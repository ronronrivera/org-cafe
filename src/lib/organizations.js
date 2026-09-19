import { supabase } from './supabaseClient'

const BUCKET = 'org-media'

/** Categories for the org form (FK target of organizations.category_id). */
export async function listCategories() {
  const { data, error } = await supabase
    .from('org_categories')
    .select('category_id, category_name')
    .order('category_name')
  return { data: data ?? [], error: error?.message ?? null }
}

/** All organizations, newest first, with their category name embedded. */
export async function listOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select(
      'org_id, org_name, description, logo, background_image, fb_page_link, join_form_link, status, category_id, org_categories(category_name)',
    )
    .order('created_at', { ascending: false })
  return { data: data ?? [], error: error?.message ?? null }
}

/**
 * Upload an image into the org's folder (RLS storage convention is
 * "<org_id>/..."), returning its public URL.
 */
async function uploadImage(orgId, file, prefix) {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  const path = `${orgId}/${prefix}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

/**
 * Create an organization, then (if provided) upload logo/background under its
 * folder and patch the row with their URLs. The org_id isn't known until the
 * row exists, which is why images are a second step.
 */
export async function createOrganization({
  org_name,
  description,
  category_id,
  fb_page_link,
  join_form_link,
  logoFile,
  backgroundFile,
}) {
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      org_name,
      description: description || null,
      category_id: category_id || null,
      fb_page_link: fb_page_link || null,
      join_form_link: join_form_link || null,
    })
    .select('org_id, org_name, description, logo, background_image, fb_page_link, join_form_link, status, category_id, org_categories(category_name)')
    .single()
  if (error) return { data: null, error: error.message }

  const patch = {}
  if (logoFile) {
    const { url, error: e } = await uploadImage(org.org_id, logoFile, 'logo')
    if (e) return { data: org, error: `Organization created, but logo upload failed: ${e}` }
    patch.logo = url
  }
  if (backgroundFile) {
    const { url, error: e } = await uploadImage(org.org_id, backgroundFile, 'bg')
    if (e) return { data: org, error: `Organization created, but background upload failed: ${e}` }
    patch.background_image = url
  }

  if (Object.keys(patch).length > 0) {
    const { data: updated, error: e } = await supabase
      .from('organizations')
      .update(patch)
      .eq('org_id', org.org_id)
      .select('org_id, org_name, description, logo, background_image, fb_page_link, join_form_link, status, category_id, org_categories(category_name)')
      .single()
    if (e) return { data: { ...org, ...patch }, error: e.message }
    return { data: updated, error: null }
  }

  return { data: org, error: null }
}

/**
 * Delete an organization. Runs via the `delete-org` Edge Function so it can also
 * remove the org_reps' auth.users accounts and storage files (service_role only).
 */
export async function deleteOrganization(orgId) {
  const { error } = await supabase.functions.invoke('delete-org', { body: { org_id: orgId } })
  if (!error) return { error: null }

  let message = error.message
  try {
    const res = error.context
    if (res && typeof res.clone === 'function') {
      const text = await res.clone().text()
      try {
        message = JSON.parse(text).error || text || message
      } catch {
        message = text || message
      }
    }
  } catch {
    /* ignore */
  }
  return { error: message }
}

const ORG_COLUMNS =
  'org_id, org_name, description, logo, background_image, fb_page_link, join_form_link, status, category_id, org_categories(category_name)'

/** The organization the signed-in org_rep manages (resolved via RPC). */
export async function getMyOrganization() {
  const { data: orgId, error: rpcErr } = await supabase.rpc('get_user_org_id')
  if (rpcErr) return { data: null, error: rpcErr.message }
  if (!orgId) return { data: null, error: 'No organization is linked to this account.' }

  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('org_id', orgId)
    .single()
  return { data, error: error?.message ?? null }
}

/**
 * Update an org's editable fields (+ optional new logo/background). RLS lets an
 * org_rep update only their own org, and admins any org.
 */
export async function updateOrganization(orgId, fields, { logoFile, backgroundFile } = {}) {
  const patch = { ...fields }

  if (logoFile) {
    const { url, error } = await uploadImage(orgId, logoFile, 'logo')
    if (error) return { data: null, error: `Logo upload failed: ${error}` }
    patch.logo = url
  }
  if (backgroundFile) {
    const { url, error } = await uploadImage(orgId, backgroundFile, 'bg')
    if (error) return { data: null, error: `Background upload failed: ${error}` }
    patch.background_image = url
  }

  const { data, error } = await supabase
    .from('organizations')
    .update(patch)
    .eq('org_id', orgId)
    .select(ORG_COLUMNS)
    .single()
  return { data, error: error?.message ?? null }
}
