-- 008: admin-editable catalog labels
--
-- 1. Per-language label columns. `label` stays the Azerbaijani text the
--    admin panel already edits; label_ru / label_en are optional overrides
--    for the RU / EN versions of the site.
-- 2. Re-assert the categories/subcategories policies. On prod an admin's
--    subcategory edit was dropped silently (UPDATE matched 0 rows under
--    RLS and returned no error), so the write policy either is missing or
--    lacks WITH CHECK — recreate both write policies with an explicit
--    WITH CHECK and make sure the read policies and grants exist.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS label_ru text,
  ADD COLUMN IF NOT EXISTS label_en text;

ALTER TABLE public.subcategories
  ADD COLUMN IF NOT EXISTS label_ru text,
  ADD COLUMN IF NOT EXISTS label_en text;

ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "categories_write_admin" ON public.categories;
CREATE POLICY "categories_write_admin"
  ON public.categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "subcategories_select_all" ON public.subcategories;
CREATE POLICY "subcategories_select_all"
  ON public.subcategories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "subcategories_write_admin" ON public.subcategories;
CREATE POLICY "subcategories_write_admin"
  ON public.subcategories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

GRANT SELECT ON public.categories, public.subcategories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.subcategories TO authenticated;
