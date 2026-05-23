-- Migration: create bannerly-images storage bucket for rendered PNGs
insert into storage.buckets (id, name, public)
values ('bannerly-images', 'bannerly-images', true)
on conflict (id) do nothing;

-- Public read access (rendered images are returned as public URLs)
create policy "Public read access for bannerly-images"
  on storage.objects
  for select
  using (bucket_id = 'bannerly-images');

-- Authenticated users can upload to their own folder (folder = user uid)
create policy "Users can upload to their own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'bannerly-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/delete their own objects
create policy "Users can update their own objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'bannerly-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'bannerly-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
