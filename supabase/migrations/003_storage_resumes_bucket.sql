-- Storage bucket + policies for resumes
-- Note: buckets live in storage schema. Run once in Supabase SQL editor (or via migrations).

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = excluded.public;

-- Allow authenticated users to manage files in their own folder: {user_id}/...
-- Requires path convention enforced in frontend upload.

drop policy if exists "resumes_read_own" on storage.objects;
create policy "resumes_read_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "resumes_update_own" on storage.objects;
create policy "resumes_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

