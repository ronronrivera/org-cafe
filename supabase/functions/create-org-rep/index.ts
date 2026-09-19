// Edge Function: create-org-rep
//
// Creates an org_rep login account with a generated password. This MUST run
// server-side because it uses the service_role key (never expose that to the
// browser). Flow:
//   1. Verify the CALLER is an admin (using their JWT + is_admin() RPC).
//   2. Use the service_role client to create the auth user with a generated
//      password, email pre-confirmed, and app_metadata { role, org_id }.
//   3. The DB trigger handle_new_user() files them into public.org_reps.
//   4. Return the email + generated password so the admin can hand it off once.
//
// Local:  supabase functions serve create-org-rep
// Deploy: supabase functions deploy create-org-rep

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Readable, reasonably strong generated password.
function generatePassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing authorization' }, 401)

  // 1. Verify the caller is an admin (runs is_admin() as that user).
  const caller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: isAdmin, error: adminErr } = await caller.rpc('is_admin')
  if (adminErr) return json({ error: 'Could not verify admin.' }, 500)
  if (!isAdmin) return json({ error: 'Only admins can create org reps.' }, 403)

  // 2. Validate input.
  let body: { org_id?: number; full_name?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const { org_id, full_name, email } = body
  if (!org_id || !email) return json({ error: 'org_id and email are required.' }, 400)

  // 3. Create the auth user with the service_role client.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const password = generatePassword()

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // pre-confirmed so the rep can log in immediately
    user_metadata: { full_name: full_name ?? null },
    app_metadata: { role: 'org_rep', org_id },
  })
  if (createErr) return json({ error: createErr.message }, 400)

  // 4. Explicitly link the org_rep. We do NOT rely on the auth trigger here:
  // admin.createUser doesn't expose app_metadata to the AFTER INSERT trigger
  // reliably, so we insert the mapping ourselves (service_role bypasses RLS).
  // upsert keeps it idempotent if the trigger ever does fire.
  const { error: linkErr } = await admin
    .from('org_reps')
    .upsert({ user_id: created.user!.id, org_id }, { onConflict: 'user_id', ignoreDuplicates: true })

  if (linkErr) {
    // Roll back the auth user so we don't leave an orphaned account.
    await admin.auth.admin.deleteUser(created.user!.id)
    return json({ error: `Failed to link representative to org: ${linkErr.message}` }, 400)
  }

  // 5. Hand back the credentials (shown once to the admin).
  return json({ user_id: created.user?.id, email, password })
})
