import { supabase } from './supabaseClient'

/**
 * Create an org_rep login account for an organization by invoking the
 * `create-org-rep` Edge Function (which runs server-side with the service_role
 * key). Returns the generated credentials so the admin can hand them off once.
 *
 * @param {{ org_id: number, full_name: string, email: string }} input
 * @returns {Promise<{ data: { email: string, password: string } | null, error: string | null }>}
 */
export async function createOrgRep({ org_id, full_name, email }) {
  const { data, error } = await supabase.functions.invoke('create-org-rep', {
    body: { org_id, full_name: full_name?.trim(), email: email?.trim() },
  })

  if (error) {
    // Edge Functions return details in the response body on non-2xx. Try JSON
    // first, then raw text, so 404s (function not served) are also readable.
    let message = error.message
    try {
      const res = error.context
      if (res && typeof res.clone === 'function') {
        const text = await res.clone().text()
        try {
          const body = JSON.parse(text)
          message = body.error || body.message || text || message
        } catch {
          message = text || message
        }
      }
    } catch {
      /* ignore */
    }
    return { data: null, error: message }
  }
  return { data, error: null }
}
