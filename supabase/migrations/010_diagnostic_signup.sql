-- ============================================================
-- DIAGNOSTIC — run in the Supabase SQL editor, paste back the output.
-- Nothing here modifies data; every statement is a SELECT.
--
-- WHY: supplier signups never appear in the admin panel as applications.
-- Migration 009 is confirmed applied in production (rpc
-- review_supplier_application exists and raises its own 'not authorized').
-- The admin query itself is correct — it reads public.admin_users where
-- supplier_status = 'pending', and 009's view exposes every column it selects.
--
-- So the break is upstream: supplier_status never becomes 'pending'.
-- 009's hold_supplier_signup trigger only fires when the INSERT into
-- public.profiles already carries account_type = 'supplier'. That INSERT is
-- done by the auth signup trigger on auth.users — which is NOT versioned in
-- this repo (no migration defines it; it was created in the dashboard).
-- If that trigger does not copy account_type out of raw_user_meta_data, every
-- signup lands as 'individual'/'none' and no application can ever exist.
-- ============================================================

-- 1) The signup trigger on auth.users: does it exist, and what does it run?
select t.tgname            as trigger_name,
       c.relname           as on_table,
       p.proname           as function_name,
       pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc  p on p.oid = t.tgfoid
where not t.tgisinternal
  and c.relname = 'users'
  and c.relnamespace = 'auth'::regnamespace;

-- 2) THE ANSWER IS USUALLY HERE — the full body of that function.
--    Look for whether it copies account_type / company_name / phone2 /
--    supplier_categories out of new.raw_user_meta_data into public.profiles.
select p.proname, pg_get_functiondef(p.oid) as source
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname in ('handle_new_user', 'create_profile_for_user', 'on_auth_user_created')
   or p.prosrc ilike '%insert into public.profiles%';

-- 3) Triggers on public.profiles — 009's hold_supplier_signup must be present.
select tgname, pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and not tgisinternal
order by tgname;

-- 4) Do the 009 columns exist, and what are their defaults?
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('account_type', 'supplier_status', 'supplier_categories',
                      'supplier_requested_at', 'company_name', 'phone2')
order by column_name;

-- 5) Reality check — what did real signups actually produce?
select account_type, supplier_status, count(*) as n
from public.profiles
group by 1, 2
order by n desc;

-- 6) Any pending applications at all right now?
select id, full_name, company_name, account_type, supplier_status,
       supplier_requested_at, created_at
from public.profiles
where supplier_status is distinct from 'none'
order by created_at desc
limit 20;

-- 7) The 10 newest signups — did any of them ask to be a supplier?
--    raw_user_meta_data is what Register.jsx sent to auth.signUp().
select u.id, u.email, u.created_at, u.email_confirmed_at,
       u.raw_user_meta_data ->> 'account_type'        as meta_account_type,
       u.raw_user_meta_data ->> 'company_name'        as meta_company,
       u.raw_user_meta_data ->> 'supplier_categories' as meta_categories,
       p.account_type    as profile_account_type,
       p.supplier_status as profile_supplier_status
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc
limit 10;

-- ============================================================
-- HOW TO READ THE RESULT
--   • Query 7 is the smoking gun. If meta_account_type = 'supplier' but
--     profile_account_type = 'individual' AND profile_supplier_status = 'none',
--     the signup trigger is dropping account_type → fix is to rewrite that
--     trigger (and version it in the repo as migration 011).
--   • If profile_supplier_status = 'pending' for those rows, the data is fine
--     and the bug is in the admin panel's read path instead.
--   • If p.* is NULL, no profile row is created at signup at all (likely
--     created only on email confirmation, or the trigger is missing entirely).
-- ============================================================
