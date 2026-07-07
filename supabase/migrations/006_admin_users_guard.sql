-- ============================================================
-- HorecaHub.az — CRITICAL: lock down the admin_users view
--
-- INCIDENT (2026-07-07): public.admin_users is a SECURITY DEFINER view
-- that exposes auth.users.email joined onto profiles. It had NO caller
-- check and SELECT was granted to anon, so ANYONE with the public anon
-- key could dump every user's email:
--
--   GET /rest/v1/admin_users?select=email   → all rows, unauthenticated.
--
-- This bypasses the whole phased email-revoke plan (003). Fix: keep the
-- definer view (it must read auth.users) but add a WHERE guard so only a
-- logged-in admin gets rows, and drop anon's grant entirely. The admin
-- panel keeps working unchanged (admins pass the guard); everyone else
-- gets zero rows / permission denied.
--
-- Apply in the Supabase SQL editor (idempotent). Column list/order match
-- the live view exactly.
-- ============================================================

drop view if exists public.admin_users;

create view public.admin_users
with (security_invoker = false)   -- definer: the view must read auth.users
as
select
  p.id,
  p.full_name,
  p.company_name,
  p.phone,
  p.city,
  p.account_type,
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

-- Only logged-in admins may read it; the WHERE guard gives non-admins
-- zero rows even though the SELECT privilege is broad. anon gets nothing.
revoke all on public.admin_users from anon, authenticated;
grant  select on public.admin_users to authenticated;

-- Verify afterwards:
--   • anon key  → GET /rest/v1/admin_users?select=id  ⇒ [] or 401/permission denied
--   • admin JWT → returns rows with email
