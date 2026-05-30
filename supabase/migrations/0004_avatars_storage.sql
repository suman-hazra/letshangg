-- v3: avatar storage for profile photos

-- Bucket: 'avatars', public read (friend group context — photos are not sensitive).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,                 -- 2 MB cap
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Path convention: <auth_uid>/<filename>
-- e.g. "0d1a3f7c-…/avatar.jpg"
-- Only the owner of the path may write.

create policy "avatars_read_all"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "avatars_read_public"
  on storage.objects for select
  to anon
  using (bucket_id = 'avatars');

create policy "avatars_write_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
