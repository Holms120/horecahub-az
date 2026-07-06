-- ============================================================
-- HorecaHub.az — Security hardening migration
-- Addresses: privilege escalation via profiles, PII (email) leak,
--            message tampering by receiver.
--
-- ⚠️  APPLY TOGETHER with the coupled front-end change that reads the
--     own profile via rpc('get_my_profile') instead of select('*').
--     Test on a branch / staging database BEFORE production.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1) Block self-promotion: a non-admin must never be able to flip
--    is_admin / is_blocked on ANY profile row (incl. their own).
--    Admins are still allowed (used by the block/unblock action).
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- 2) Stop bulk PII (email) harvesting through the anon key.
--    profiles keeps row-level "public read" (seller name/phone are
--    intentionally public for the marketplace), but the `email`
--    column is removed from anon/authenticated column privileges.
--    Owners never need profiles.email in the UI — the client reads
--    it from the auth session (user.email). Admin panel reads it
--    through the definer-owned `admin_users` view.
-- ────────────────────────────────────────────────────────────
revoke select on public.profiles from anon, authenticated;

do $$
declare
  _cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into _cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = 'profiles'
    and column_name <> 'email';

  execute format(
    'grant select (%s) on public.profiles to anon, authenticated;',
    _cols
  );
end;
$$;

-- Own full profile (incl. any private columns) via a definer RPC so the
-- front-end never needs a blanket select('*') on the base table.
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

-- ────────────────────────────────────────────────────────────
-- 3) Message integrity: the receiver may only flip `is_read`, not
--    rewrite the body / sender of a message in their inbox.
-- ────────────────────────────────────────────────────────────
revoke update on public.messages from anon, authenticated;
grant  update (is_read) on public.messages to authenticated;

-- ────────────────────────────────────────────────────────────
-- NOTES / follow-ups that live outside SQL migrations
-- ────────────────────────────────────────────────────────────
-- • phone_clicks / listing_views accept anonymous inserts by design
--   (analytics for logged-out visitors). Add abuse protection at the
--   edge (rate limiting / Cloudflare / captcha) rather than in RLS.
--
-- • Storage buckets `listings` and `avatars`: verify policies restrict
--   INSERT/UPDATE to authenticated users writing only under their own
--   `{auth.uid()}/…` prefix, and set a server-side file size limit.
--   Suggested policy (adjust bucket_id):
--     create policy "own_folder_write" on storage.objects
--       for insert to authenticated
--       with check (
--         bucket_id = 'listings'
--         and (storage.foldername(name))[1] = auth.uid()::text
--       );
--
-- • After applying: confirm the admin panel still shows user emails
--   (via the admin_users view). If not, ensure admin_users is owned by
--   a role that retains SELECT on profiles.email (definer semantics).
