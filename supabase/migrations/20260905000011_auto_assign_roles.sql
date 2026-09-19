-- =====================================================================
-- Organization Café — Migration: auto-assign roles on user creation
--
-- Maps a newly created auth.users row into the correct role table based
-- on app_metadata.role. This runs at the DATABASE level (trigger), which
-- is consistent with the rule that admins are provisioned outside the
-- application API.
--
-- IMPORTANT: this reads raw_app_meta_data (app_metadata), which can ONLY
-- be set by the service_role / admin API — never by the user themselves.
-- It must NOT read raw_user_meta_data (user_metadata), which is
-- user-editable at signup and would allow self-promotion to admin.
--
-- A user with no role in app_metadata (e.g. an org_rep created through a
-- different flow, or any other account) is left untouched here.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := new.raw_app_meta_data ->> 'role';
    v_org_id int := (new.raw_app_meta_data ->> 'org_id')::int;
begin
    if v_role = 'admin' then
        insert into public.admins (user_id)
        values (new.id)
        on conflict (user_id) do nothing;

    elsif v_role = 'org_rep' and v_org_id is not null then
        -- Only assign an org_rep if an org_id was explicitly provided.
        insert into public.org_reps (user_id, org_id)
        values (new.id, v_org_id)
        on conflict (user_id) do nothing;
    end if;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
