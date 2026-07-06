-- ============================================================
-- HorecaHub.az — Trigram indexes for catalog search (NON-BREAKING)
--
-- The catalog search uses leading-wildcard `ilike '%q%'` on title /
-- keywords / description, which a b-tree index cannot serve — every
-- search is a sequential scan. pg_trgm GIN indexes make those ilike
-- lookups index-backed as the table grows.
--
-- Safe to apply at any time; adds indexes only.
-- ============================================================

create extension if not exists pg_trgm;

create index if not exists idx_listings_title_trgm
  on public.listings using gin (title gin_trgm_ops);

create index if not exists idx_listings_keywords_trgm
  on public.listings using gin (keywords gin_trgm_ops);

create index if not exists idx_listings_description_trgm
  on public.listings using gin (description gin_trgm_ops);
