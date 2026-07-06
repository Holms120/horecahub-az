-- ============================================================
-- HorecaHub.az — Storage bucket hardening (REVIEW BEFORE APPLYING)
--
-- ⚠️  Review against the live buckets first. If policies with these
--     names already exist they are dropped and recreated; make sure the
--     recreated versions match your intent. Bucket-level limits
--     (allowed mime types, max file size) are set in the Storage UI /
--     bucket config, NOT in SQL — set them there too.
--
-- Both the client `listings` and `avatars` uploads write under a
-- `{auth.uid()}/…` prefix, so writes are restricted to the caller's own
-- folder. Reads stay public (images are shown to anonymous visitors).
-- ============================================================

-- Public read (images are shown on public listing pages)
drop policy if exists "listings_avatars_public_read" on storage.objects;
create policy "listings_avatars_public_read"
  on storage.objects for select
  using (bucket_id in ('listings', 'avatars'));

-- Authenticated users may write only inside their own {uid}/ folder
drop policy if exists "own_folder_insert" on storage.objects;
create policy "own_folder_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own_folder_update" on storage.objects;
create policy "own_folder_update"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own_folder_delete" on storage.objects;
create policy "own_folder_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reminder (set in bucket config, not here):
--   • avatars  : max ~2 MB, mime image/jpeg,image/png,image/webp
--   • listings : max ~5 MB, mime image/jpeg,image/png,image/webp
