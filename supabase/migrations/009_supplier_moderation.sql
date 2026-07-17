-- ============================================================
-- HorecaHub.az — supplier accounts require moderation
--
-- Before: picking "Təchizatçı" at signup wrote account_type='supplier'
-- straight into profiles — an instant, unreviewed supplier account.
-- Worse, profiles_update_own lets a user PATCH their own row and the
-- 002 trigger only froze is_admin/is_blocked, so ANY logged-in user
-- could promote themselves with a single REST call, no UI involved.
--
-- After: account_type is granted by an admin only. A signup that asks
-- for a supplier account lands as account_type='individual' +
-- supplier_status='pending' and waits for review.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- ── 1) Application state ─────────────────────────────────────
alter table public.profiles
  add column if not exists supplier_status        text not null default 'none',
  add column if not exists supplier_requested_at  timestamptz,
  add column if not exists supplier_reviewed_at   timestamptz,
  add column if not exists supplier_reject_reason text;

do $$
begin
  alter table public.profiles
    add constraint supplier_status_valid
    check (supplier_status in ('none', 'pending', 'approved', 'rejected'));
exception
  when duplicate_object then null;
end $$;

create index if not exists profiles_supplier_status_idx
  on public.profiles (supplier_status)
  where supplier_status = 'pending';

-- Everyone who is already a supplier stays one (grandfathered as approved).
update public.profiles
set supplier_status      = 'approved',
    supplier_reviewed_at = coalesce(supplier_reviewed_at, now())
where account_type = 'supplier'
  and supplier_status is distinct from 'approved';

-- ── 2) Hold supplier signups for review ──────────────────────
-- The signup path (auth trigger → INSERT into profiles) copies
-- account_type from user-supplied auth metadata. Intercepting on
-- profiles itself covers that trigger and any other insert path.
create or replace function public.hold_supplier_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_type = 'supplier' then
    new.account_type          := 'individual';
    new.supplier_status       := 'pending';
    new.supplier_requested_at := coalesce(new.supplier_requested_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hold_supplier_signup on public.profiles;
create trigger trg_hold_supplier_signup
  before insert on public.profiles
  for each row
  execute function public.hold_supplier_signup();

-- ── 3) Freeze moderator-owned columns ────────────────────────
-- Supersedes the 002 version: same is_admin/is_blocked guarantee,
-- plus account_type and the supplier_* review fields. The one move a
-- user may make on their own row is applying: none/rejected → pending.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No JWT (service_role / SQL editor) already bypasses RLS entirely.
  if auth.uid() is null then
    return new;
  end if;

  if exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ) then
    return new;
  end if;

  new.is_admin               := old.is_admin;
  new.is_blocked             := old.is_blocked;
  new.account_type           := old.account_type;
  new.supplier_reviewed_at   := old.supplier_reviewed_at;
  new.supplier_reject_reason := old.supplier_reject_reason;

  if new.supplier_status is distinct from old.supplier_status
     and auth.uid() = old.id
     and old.supplier_status in ('none', 'rejected')
     and new.supplier_status = 'pending'
  then
    new.supplier_requested_at := now();
  else
    new.supplier_status       := old.supplier_status;
    new.supplier_requested_at := old.supplier_requested_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged_columns on public.profiles;
create trigger trg_protect_profile_privileged_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

-- ── 4) The review action ─────────────────────────────────────
-- Definer RPC so the decision is authorized server-side, the same way
-- delete-user works — the admin panel never needs UPDATE rights on
-- other people's profiles.
create or replace function public.review_supplier_application(
  p_user_id uuid,
  p_approve boolean,
  p_reason  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set account_type           = case when p_approve then 'supplier' else account_type end,
      supplier_status        = case when p_approve then 'approved' else 'rejected' end,
      supplier_reject_reason = case when p_approve then null
                                    else nullif(btrim(coalesce(p_reason, '')), '') end,
      supplier_reviewed_at   = now()
  where id = p_user_id
    and supplier_status = 'pending';

  if not found then
    raise exception 'no pending supplier application for %', p_user_id;
  end if;
end;
$$;

revoke all on function public.review_supplier_application(uuid, boolean, text) from public;
grant execute on function public.review_supplier_application(uuid, boolean, text) to authenticated;

-- ── 5) Surface applications to the admin panel ───────────────
-- Same admin-only guard as 006, plus the fields a reviewer needs.
drop view if exists public.admin_users;

create view public.admin_users
with (security_invoker = false)   -- definer: the view must read auth.users
as
select
  p.id,
  p.full_name,
  p.company_name,
  p.phone,
  p.phone2,
  p.city,
  p.account_type,
  p.supplier_status,
  p.supplier_categories,
  p.supplier_requested_at,
  p.supplier_reject_reason,
  p.is_blocked,
  p.is_admin,
  p.created_at,
  u.email
from public.profiles p
left join auth.users u on u.id = p.id
where exists (
  select 1 from public.profiles a
  where a.id = auth.uid() and a.is_admin = true
);

revoke all on public.admin_users from anon, authenticated;
grant  select on public.admin_users to authenticated;

-- Verify afterwards:
--   • self-promotion → PATCH /rest/v1/profiles?id=eq.<own> {"account_type":"supplier"}
--     with a normal user JWT ⇒ row comes back still 'individual'
--   • new supplier signup ⇒ account_type='individual', supplier_status='pending'
--   • admin approve ⇒ account_type='supplier', supplier_status='approved'
