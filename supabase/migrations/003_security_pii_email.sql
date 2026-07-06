-- ============================================================
-- HorecaHub.az — Security hardening, phase 2 (BREAKING — SEQUENCE MATTERS)
--
-- ⚠️  Apply ONLY AFTER the front-end that reads the own profile via
--     rpc('get_my_profile') is live in production. The old front-end
--     does select('*') on profiles; once email is column-revoked that
--     query fails with "permission denied for column email".
--
--     Correct order:
--       1. apply 002_security_core.sql   (creates get_my_profile)
--       2. deploy the new front-end       (uses get_my_profile)
--       3. apply THIS file                (revokes email)
--
-- Covers:
--   • HIGH — stop bulk email harvesting via the public anon key.
--
-- profiles keeps its row-level "public read" (seller name/phone are
-- intentionally public for the marketplace); only the `email` column
-- is removed from anon/authenticated. Owners read their email from the
-- auth session (user.email); admins read it via the admin_users view.
-- ============================================================

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

-- After applying, confirm the admin panel still shows user emails via
-- the admin_users view. If not, ensure admin_users is owned by a role
-- that retains SELECT on profiles.email (definer semantics).
