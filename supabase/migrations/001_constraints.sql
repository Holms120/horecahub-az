-- ============================================================
-- HorecaHub.az — Database-level input length constraints
-- Run these in Supabase SQL Editor.
-- ============================================================

ALTER TABLE listings ADD CONSTRAINT title_length       CHECK (char_length(title) <= 80);
ALTER TABLE listings ADD CONSTRAINT description_length  CHECK (char_length(description) <= 3000);
ALTER TABLE profiles ADD CONSTRAINT full_name_length    CHECK (char_length(full_name) <= 100);
