-- =====================================================================
-- Organization Café — Migration: page_layouts.config
-- A flexible JSON document describing the org page design built in the
-- page builder (theme, section order/visibility, custom blocks). This
-- supersedes the earlier scalar columns (theme_color, banner_style,
-- section_order) as the single source of layout truth.
--
-- RLS is unchanged: existing page_layouts policies already scope
-- insert/update/delete to the org_rep of the row's org, and allow public
-- read. The moddatetime trigger keeps updated_at fresh.
-- =====================================================================

alter table public.page_layouts
    add column if not exists config jsonb;
