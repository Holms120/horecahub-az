-- ============================================================
-- HorecaHub.az — Security hardening, phase 1 (NON-BREAKING)
--
-- Safe to apply to production at any time — it only ADDS a trigger,
-- an RPC and a column-scoped grant; it does not remove any privilege
-- the current front-end relies on.
--
-- Covers:
--   • CRITICAL — block self-promotion to admin (is_admin / is_blocked)
--   • HIGH     — get_my_profile() RPC (prereq for the email revoke in 003)
--   • MEDIUM   — messages UPDATE limited to is_read
-- ============================================================

-- ── 1) Block privilege escalation on profiles ────────────────
-- A non-admin must never flip is_admin / is_blocked on ANY row.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_admin   is distinct from old.is_admin
      or new.is_blocked is distinct from old.is_blocked)
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and is_admin = true
     )
  then
    new.is_admin   := old.is_admin;
    new.is_blocked := old.is_blocked;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged_columns on public.profiles;
create trigger trg_protect_profile_privileged_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

-- ── 2) Own-profile RPC (definer) ─────────────────────────────
-- Lets the client read its full own profile without a blanket
-- select('*') on the base table, so 003 can safely revoke the
-- email column from anon/authenticated.
create or replace function public.get_my_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- ── 3) Message integrity ─────────────────────────────────────
-- Receiver may only flip is_read, not rewrite body / sender.
revoke update on public.messages from anon, authenticated;
grant  update (is_read) on public.messages to authenticated;
