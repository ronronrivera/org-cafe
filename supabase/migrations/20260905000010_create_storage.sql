-- =====================================================================
-- Organization Café — Migration: Storage
-- Public storage bucket for org logos, backgrounds, post images, and
-- media assets. Any visitor can read; only admins or the org_rep of the
-- owning organization can upload/update/delete.
--
-- Folder convention: "<org_id>/<anything>" so storage RLS can scope
-- org_rep uploads to their own organization.
-- =====================================================================

-- Create the public bucket (id and name must match).
insert into storage.buckets (id, name, public)
values ('org-media', 'org-media', true)
on conflict (id) do nothing;

-- Any visitor may read / list objects.
create policy "public read org-media" on storage.objects
    for select using (bucket_id = 'org-media');

-- ---------------------------------------------------------------------
-- INSERT — admins (any path) or org_reps (their own <org_id>/ folder)
-- ---------------------------------------------------------------------
create policy "admin upload org-media" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'org-media'
        and public.is_admin()
    );

create policy "org_rep upload own org folder" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'org-media'
        and (storage.foldername(name))[1] is not null
        and (storage.foldername(name))[1] = public.get_user_org_id()::text
    );

-- ---------------------------------------------------------------------
-- UPDATE / DELETE — same scoping as INSERT
-- ---------------------------------------------------------------------
create policy "admin update org-media" on storage.objects
    for update to authenticated
    using (bucket_id = 'org-media' and public.is_admin())
    with check (bucket_id = 'org-media' and public.is_admin());

create policy "org_rep update own org folder" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'org-media'
        and (storage.foldername(name))[1] is not null
        and (storage.foldername(name))[1] = public.get_user_org_id()::text
    )
    with check (
        bucket_id = 'org-media'
        and (storage.foldername(name))[1] is not null
        and (storage.foldername(name))[1] = public.get_user_org_id()::text
    );

create policy "admin delete org-media" on storage.objects
    for delete to authenticated
    using (bucket_id = 'org-media' and public.is_admin());

create policy "org_rep delete own org folder" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'org-media'
        and (storage.foldername(name))[1] is not null
        and (storage.foldername(name))[1] = public.get_user_org_id()::text
    );