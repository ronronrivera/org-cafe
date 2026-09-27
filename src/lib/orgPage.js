import { supabase } from './supabaseClient'
import { slugify } from './slug'

/** Resolve a name-based slug to a full org page (slugs aren't stored; matched here). */
export async function getOrgPageBySlug(slug) {
  const { data: orgs, error } = await supabase.from('organizations').select('org_id, org_name')
  if (error) return { data: null, error: error.message }
  const match = (orgs ?? []).find((o) => slugify(o.org_name) === slug)
  if (!match) return { data: null, error: 'Organization not found.' }
  return getOrgPage(match.org_id)
}

/**
 * Everything the public org page needs. All tables are public-read per RLS.
 * Every org gets a "default page" simply by rendering this data — no extra row
 * is required.
 */
export async function getOrgPage(orgId) {
  const [orgRes, postsRes, annRes, mediaRes, layoutRes] = await Promise.all([
    supabase
      .from('organizations')
      .select(
        'org_id, org_name, description, logo, background_image, fb_page_link, join_form_link, join_open_date, join_close_date, status, org_categories(category_name)',
      )
      .eq('org_id', orgId)
      .single(),
    supabase.from('posts').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
    supabase
      .from('announcements')
      .select('*')
      .eq('org_id', orgId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('media_assets').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
    supabase.from('page_layouts').select('config').eq('org_id', orgId).maybeSingle(),
  ])

  if (orgRes.error) return { data: null, error: orgRes.error.message }

  return {
    data: {
      org: orgRes.data,
      posts: postsRes.data ?? [],
      announcements: annRes.data ?? [],
      media: mediaRes.data ?? [],
      config: layoutRes.data?.config ?? null,
    },
    error: null,
  }
}
