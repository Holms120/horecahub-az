-- ============================================================
-- HorecaHub.az — Row Level Security Policy Documentation
-- Run these in Supabase SQL Editor to apply / verify policies.
-- ============================================================

-- ── listings ────────────────────────────────────────────────
-- Anyone can read active listings.
-- Users can insert their own listings (status defaults to 'pending').
-- Users can update/delete only their own listings.
-- CRITICAL: Only admins (is_admin = true) may set status = 'active' or 'rejected'.

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_select_active"
  ON listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "listings_select_own"
  ON listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "listings_insert_own"
  ON listings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_blocked = true
    )
  );

CREATE POLICY "listings_update_own"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'  -- users can only edit their own pending listings
  );

CREATE POLICY "listings_update_admin"
  ON listings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- ── profiles ─────────────────────────────────────────────────
-- Anyone can read a limited set of profile fields (public data).
-- Users can update only their own profile.
-- is_admin and is_blocked must NOT be writable by the user themselves.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);  -- RLS is enforced at column level via explicit select in app code

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-promotion: is_admin and is_blocked must remain unchanged
    -- Enforce via trigger or restrict column grants, not just policy
  );

-- ── messages ─────────────────────────────────────────────────
-- Users can read messages they sent or received.
-- Users can insert messages (sender_id must equal their own id).
-- Users can delete only messages they sent.
-- Blocked users cannot send messages.

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_blocked = true
    )
  );

CREATE POLICY "messages_update_own"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)  -- only receiver can mark as read
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "messages_delete_own"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ── categories ───────────────────────────────────────────────
-- Public read. Only admins can insert/update/delete.

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_write_admin"
  ON categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── subcategories ─────────────────────────────────────────────
-- Same as categories.

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subcategories_select_all"
  ON subcategories FOR SELECT
  USING (true);

CREATE POLICY "subcategories_write_admin"
  ON subcategories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── favorites ─────────────────────────────────────────────────
-- Users can read/write only their own favorites.

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_own"
  ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── feedback ─────────────────────────────────────────────────
-- Users can insert feedback. Admins can read all.

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_authenticated"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "feedback_select_admin"
  ON feedback FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── phone_clicks / listing_views ─────────────────────────────
-- Anyone can insert (analytics). Only admins can read aggregates.

ALTER TABLE phone_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phone_clicks_insert_all"
  ON phone_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "phone_clicks_select_admin"
  ON phone_clicks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_views_insert_all"
  ON listing_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "listing_views_select_admin"
  ON listing_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
