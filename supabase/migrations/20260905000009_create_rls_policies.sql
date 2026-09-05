-- =====================================================================
-- Organization Café — Migration: RLS policies
-- Row Level Security for all tables.
--
-- Model:
--   * Public visitors            → read-only on everything public
--   * org_reps (auth.uid())      → full write on content of THEIR org only
--   * admins (auth.uid())        → write on organizations, org_categories,
--                                   and org_reps
--   * admins / org_reps tables   → NO read or write policies; they are
--                                   completely hidden from the API.
--                                   Role checks go through SECURITY
--                                   DEFINER helper functions below, which
--                                   bypass RLS internally, so the mapping
--                                   tables never need to be exposed.
--   * admins table               → NO write policies; admin accounts are
--                                   provisioned at the database level.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Role-check helper functions (SECURITY DEFINER → bypass RLS internally)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.admins a where a.user_id = auth.uid()
    );
$$;

create or replace function public.get_user_org_id()
returns int
language sql
security definer
set search_path = public
stable
as $$
    select org_id from public.org_reps where user_id = auth.uid() limit 1;
$$;

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------
alter table public.org_categories  enable row level security;
alter table public.organizations   enable row level security;
alter table public.admins          enable row level security;
alter table public.org_reps        enable row level security;
alter table public.page_layouts    enable row level security;
alter table public.media_assets    enable row level security;
alter table public.posts           enable row level security;
alter table public.announcements   enable row level security;

-- ---------------------------------------------------------------------
-- Drop any legacy public-read policies on the mapping tables (from an
-- earlier version of this migration) so admins/org_reps stay hidden.
-- ---------------------------------------------------------------------
drop policy if exists "public read admins" on public.admins;
drop policy if exists "public read org_reps" on public.org_reps;

-- ---------------------------------------------------------------------
-- Public read access (content only — admins/org_reps stay hidden)
-- ---------------------------------------------------------------------
create policy "public read org_categories" on public.org_categories
    for select using (true);

create policy "public read organizations" on public.organizations
    for select using (true);

create policy "public read posts" on public.posts
    for select using (true);

create policy "public read announcements" on public.announcements
    for select using (true);

create policy "public read media_assets" on public.media_assets
    for select using (true);

create policy "public read page_layouts" on public.page_layouts
    for select using (true);

-- ---------------------------------------------------------------------
-- org_categories — admins only
-- ---------------------------------------------------------------------
drop policy if exists "admin insert org_categories" on public.org_categories;
create policy "admin insert org_categories" on public.org_categories
    for insert with check (public.is_admin());

drop policy if exists "admin update org_categories" on public.org_categories;
create policy "admin update org_categories" on public.org_categories
    for update using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin delete org_categories" on public.org_categories;
create policy "admin delete org_categories" on public.org_categories
    for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- organizations — admins (full), org_reps of the row's org (update only)
-- ---------------------------------------------------------------------
drop policy if exists "admin insert organizations" on public.organizations;
create policy "admin insert organizations" on public.organizations
    for insert with check (public.is_admin());

drop policy if exists "admin update organizations" on public.organizations;
create policy "admin update organizations" on public.organizations
    for update using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin delete organizations" on public.organizations;
create policy "admin delete organizations" on public.organizations
    for delete using (public.is_admin());

-- The org_rep can only UPDATE their own org (and cannot reassign org_id).
drop policy if exists "org_rep update own organization" on public.organizations;
create policy "org_rep update own organization" on public.organizations
    for update using (public.get_user_org_id() = organizations.org_id)
    with check (public.get_user_org_id() = organizations.org_id);

-- ---------------------------------------------------------------------
-- org_reps — admins only (no public self-registration; table stays hidden)
-- ---------------------------------------------------------------------
drop policy if exists "admin insert org_reps" on public.org_reps;
create policy "admin insert org_reps" on public.org_reps
    for insert with check (public.is_admin());

drop policy if exists "admin update org_reps" on public.org_reps;
create policy "admin update org_reps" on public.org_reps
    for update using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin delete org_reps" on public.org_reps;
create policy "admin delete org_reps" on public.org_reps
    for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- posts — org_rep of the row's org only
-- ---------------------------------------------------------------------
drop policy if exists "org_rep insert own posts" on public.posts;
create policy "org_rep insert own posts" on public.posts
    for insert with check (public.get_user_org_id() = posts.org_id);

drop policy if exists "org_rep update own posts" on public.posts;
create policy "org_rep update own posts" on public.posts
    for update using (public.get_user_org_id() = posts.org_id)
    with check (public.get_user_org_id() = posts.org_id);

drop policy if exists "org_rep delete own posts" on public.posts;
create policy "org_rep delete own posts" on public.posts
    for delete using (public.get_user_org_id() = posts.org_id);

-- ---------------------------------------------------------------------
-- announcements — org_rep of the row's org only
-- ---------------------------------------------------------------------
drop policy if exists "org_rep insert own announcements" on public.announcements;
create policy "org_rep insert own announcements" on public.announcements
    for insert with check (public.get_user_org_id() = announcements.org_id);

drop policy if exists "org_rep update own announcements" on public.announcements;
create policy "org_rep update own announcements" on public.announcements
    for update using (public.get_user_org_id() = announcements.org_id)
    with check (public.get_user_org_id() = announcements.org_id);

drop policy if exists "org_rep delete own announcements" on public.announcements;
create policy "org_rep delete own announcements" on public.announcements
    for delete using (public.get_user_org_id() = announcements.org_id);

-- ---------------------------------------------------------------------
-- media_assets — org_rep of the row's org only
-- ---------------------------------------------------------------------
drop policy if exists "org_rep insert own media" on public.media_assets;
create policy "org_rep insert own media" on public.media_assets
    for insert with check (public.get_user_org_id() = media_assets.org_id);

drop policy if exists "org_rep update own media" on public.media_assets;
create policy "org_rep update own media" on public.media_assets
    for update using (public.get_user_org_id() = media_assets.org_id)
    with check (public.get_user_org_id() = media_assets.org_id);

drop policy if exists "org_rep delete own media" on public.media_assets;
create policy "org_rep delete own media" on public.media_assets
    for delete using (public.get_user_org_id() = media_assets.org_id);

-- ---------------------------------------------------------------------
-- page_layouts — org_rep of the row's org only (one layout per org)
-- ---------------------------------------------------------------------
drop policy if exists "org_rep insert own layout" on public.page_layouts;
create policy "org_rep insert own layout" on public.page_layouts
    for insert with check (public.get_user_org_id() = page_layouts.org_id);

drop policy if exists "org_rep update own layout" on public.page_layouts;
create policy "org_rep update own layout" on public.page_layouts
    for update using (public.get_user_org_id() = page_layouts.org_id)
    with check (public.get_user_org_id() = page_layouts.org_id);

drop policy if exists "org_rep delete own layout" on public.page_layouts;
create policy "org_rep delete own layout" on public.page_layouts
    for delete using (public.get_user_org_id() = page_layouts.org_id);