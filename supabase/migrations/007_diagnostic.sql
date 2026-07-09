-- ============================================================
-- Run this FIRST (Supabase SQL editor) to see the current state
-- before applying 007_listings_rls_hardening.sql.
-- ============================================================

-- 1) Is RLS actually enabled on the leaky tables?
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('listings', 'phone_clicks', 'listing_views', 'messages', 'feedback')
order by relname;

-- 2) What policies exist right now? Look for any SELECT policy whose
--    qual is `true` (that is the leak — it lets anon read everything).
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('listings', 'phone_clicks')
order by tablename, cmd, policyname;

-- 3) Table-level grants (a broad GRANT SELECT to anon also matters).
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('listings', 'phone_clicks')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
