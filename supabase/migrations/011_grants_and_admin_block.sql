-- ============================================================
-- HorecaHub.az — fix column-grant drift + admin user blocking
--
-- Idempotent — safe to re-run. Apply in the Supabase SQL editor.
-- Run this BEFORE deploying the matching front-end change, because
-- Admin's "block user" switches to the RPC created in section 2.
-- ============================================================

-- ── 1) Grant the columns migration 009 added ─────────────────
-- 003_security_pii_email.sql revokes SELECT on public.profiles and then
-- re-grants a column list SNAPSHOTTED from information_schema at that
-- moment (everything except `email`). Postgres column privileges are
-- per-column and are NOT inherited by columns created afterwards, so the
-- four columns 009 added never received a grant.
--
-- PostgREST fails the ENTIRE request with 401 / 42501 when any referenced
-- column lacks SELECT — including a column used only in a WHERE filter.
-- Verified against production with the anon key:
--     select=account_type    -> 200
--     select=supplier_status -> 401  42501 permission denied for table profiles
-- That is what pinned the admin's supplier-application badge at 0.
grant select (supplier_status, supplier_requested_at, supplier_reviewed_at, supplier_reject_reason)
  on public.profiles to authenticated;

-- Deliberately NOT granted to anon: application state is not public data.
-- Consequence: a logged-out client must never reference these columns.
--
-- ⚠️ MAINTENANCE RULE: every future `alter table public.profiles add column`
-- must ship its own `grant select (<col>) on public.profiles to authenticated;`
-- in the same migration, or it silently becomes unreadable for every role.

-- ── 2) Admin user blocking ───────────────────────────────────
-- The only UPDATE policy on profiles is profiles_update_own
-- (000_rls_policies.sql: USING auth.uid() = id). There is no admin
-- counterpart — unlike listings, which has listings_update_admin. So the
-- panel's `update({is_blocked}).eq('id', other_user)` matched ZERO rows and
-- returned success, and the UI optimistically painted the user as blocked
-- while the database never changed.
--
-- Same shape as review_supplier_application (009): authorize server-side in a
-- definer function, so the panel never needs UPDATE rights on other people's
-- rows. Returns the new value so the client can verify the write landed.
create or replace function public.set_user_blocked(
  p_user_id uuid,
  p_blocked boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _result boolean;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'not authorized';
  end if;

  -- An admin must not be able to lock themselves out.
  if p_user_id = auth.uid() then
    raise exception 'cannot block your own account';
  end if;

  update public.profiles
  set is_blocked = p_blocked
  where id = p_user_id
  returning is_blocked into _result;

  if not found then
    raise exception 'no such user: %', p_user_id;
  end if;

  return _result;
end;
$$;

revoke all on function public.set_user_blocked(uuid, boolean) from public;
grant execute on function public.set_user_blocked(uuid, boolean) to authenticated;

-- ── Verify afterwards ────────────────────────────────────────
--   • as a normal user JWT:  select supplier_status from profiles limit 1;  ⇒ works
--   • as anon:               same query                                     ⇒ 401 (intended)
--   • admin panel:           the "Təchizatçılar" tab badge shows the real
--                            pending count instead of a permanent 0
--   • admin panel:           blocking a user survives a page reload
--   • non-admin calling set_user_blocked                                    ⇒ 'not authorized'
