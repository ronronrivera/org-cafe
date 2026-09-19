// Edge Function: delete-org
//
// Deletes an organization AND the auth.users accounts of its org_reps (which the
// browser can't do — that needs the service_role key). Also clears the org's
// storage folder. Steps:
//   1. Verify the caller is an admin.
//   2. Look up the org's rep user_ids (org_reps is hidden from the API; only
//      the service_role client can read it).
//   3. Delete those auth users (cascades their org_reps rows).
//   4. Remove the org's files under org-media/<org_id>/.
//   5. Delete the organization row.
//
// Local:  supabase functions serve delete-org
// Deploy: supabase functions deploy delete-org

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing authorization' }, 401)

  // 1. Verify admin.
  const caller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: isAdmin, error: adminErr } = await caller.rpc('is_admin')
  if (adminErr) return json({ error: 'Could not verify admin.' }, 500)
  if (!isAdmin) return json({ error: 'Only admins can delete organizations.' }, 403)

  let body: { org_id?: number }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const { org_id } = body
  if (!org_id) return json({ error: 'org_id is required.' }, 400)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // 2 + 3. Delete the rep auth accounts.
  const { data: reps } = await admin.from('org_reps').select('user_id').eq('org_id', org_id)
  for (const rep of reps ?? []) {
    await admin.auth.admin.deleteUser(rep.user_id)
  }

  // 4. Remove the org's storage folder (best-effort).
  const { data: files } = await admin.storage.from('org-media').list(`${org_id}`)
  if (files && files.length > 0) {
    await admin.storage.from('org-media').remove(files.map((f) => `${org_id}/${f.name}`))
  }

  // 5. Delete the organization.
  const { error } = await admin.from('organizations').delete().eq('org_id', org_id)
  if (error) return json({ error: error.message }, 400)

  return json({ ok: true, deleted_reps: reps?.length ?? 0 })
})
