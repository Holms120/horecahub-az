-- ============================================================
-- HorecaHub.az — CRITICAL/MEDIUM: fix over-permissive read access
--
-- INCIDENT (2026-07-10, found in review): with only the public anon key
-- and NO session, an anonymous caller can read listings in ANY status:
--
--   GET /rest/v1/listings?status=eq.pending  → 115 rows (moderation queue)
--   GET /rest/v1/listings?status=eq.deleted   → 47 rows (soft-deleted)
--   GET /rest/v1/listings?status=eq.rejected  → 6 rows
--   GET /rest/v1/phone_clicks?select=*         → 30 rows (admin-only analytics)
--
-- Root cause: `listings` (and `phone_clicks`) still carry a leftover
-- permissive "read to everyone" policy (or RLS is off), so the intended
-- policies from 000_rls_policies.sql never actually constrain reads.
-- `messages` / `feedback` DO enforce correctly, which is why this went
-- unnoticed — the leak is table-specific.
--
-- This migration is authoritative and idempotent: it drops EVERY existing
-- policy on the two tables and recreates the intended set from scratch, so
-- an unknown-named legacy policy cannot keep the door open.
--
-- ⚠️ Before applying, run 007_diagnostic.sql and eyeball the current
--    policies. Apply in the Supabase SQL editor. The admin panel and
--    owner edit/soft-delete keep working (see WITH CHECK below).
-- ============================================================

-- ── listings ─────────────────────────────────────────────────
alter table public.listings enable row level security;

-- Wipe all existing policies (named or not) so nothing permissive lingers.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'listings'
  loop
    execute format('drop policy if exists %I on public.listings', pol.policyname);
  end loop;
end $$;

-- SELECT: anyone reads active; owners read their own (any status);
-- admins read everything (needed by the moderation panel).
create policy "listings_select_active"
  on public.listings for select
  using (status = 'active');

create policy "listings_select_own"
  on public.listings for select
  using (auth.uid() = user_id);

create policy "listings_select_admin"
  on public.listings for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

-- INSERT: only as yourself, only as 'pending', and not while blocked.
create policy "listings_insert_own"
  on public.listings for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and not exists (
      select 1 from public.profiles where id = auth.uid() and is_blocked = true
    )
  );

-- UPDATE (owner): may edit own row, but may only leave it in a
-- self-serviceable state — 'pending' (edit) or 'deleted' (soft delete).
-- This blocks self-approval to 'active'/'rejected' while still allowing
-- the app's ListingCard/Profile soft-delete on an active listing.
create policy "listings_update_own"
  on public.listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status in ('pending', 'deleted'));

-- UPDATE (admin): full moderation (approve / reject / edit category, etc.)
create policy "listings_update_admin"
  on public.listings for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- DELETE: owners may hard-delete their own row (app uses soft-delete, but
-- keep parity with 000). Admins delete via the delete-user function / update.
create policy "listings_delete_own"
  on public.listings for delete
  using (auth.uid() = user_id);

-- ── phone_clicks ─────────────────────────────────────────────
-- Insert stays open (anonymous analytics from listing pages); reads become
-- admin-only. The app only ever READS phone_clicks in the admin panel, so
-- tightening this does not affect any public UI.
alter table public.phone_clicks enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'phone_clicks'
  loop
    execute format('drop policy if exists %I on public.phone_clicks', pol.policyname);
  end loop;
end $$;

create policy "phone_clicks_insert_all"
  on public.phone_clicks for insert
  with check (true);

create policy "phone_clicks_select_admin"
  on public.phone_clicks for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- ── NOTE on listing_views ─────────────────────────────────────
-- listing_views is intentionally left publicly readable: the view counter
-- is shown to every visitor (ListingCard / ListingDetail / Profile). The
-- admin-only intent documented in 000_rls_policies.sql contradicts that
-- product decision — 000 was never applied for this table. If you ever
-- decide to hide view counts, add an admin-only SELECT policy here AND
-- remove the public reads in the front-end at the same time.

-- ── Verify afterwards (anon key, no session) ─────────────────
--   GET /rest/v1/listings?status=eq.pending&select=id   ⇒ []
--   GET /rest/v1/listings?status=eq.deleted&select=id    ⇒ []
--   GET /rest/v1/listings?select=id (default)            ⇒ only active
--   GET /rest/v1/phone_clicks?select=id                  ⇒ [] / permission denied
--   admin JWT: moderation panel still lists pending/rejected rows.
