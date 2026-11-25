// Edge Function: fee-lookup (PUBLIC — no login)
//
// SRS §3.5 public lookup: a visitor sends ONE student ID and gets back only
// "Paid" or "Not Paid". No names, OR numbers, or other rows ever leave this
// function. A student counts as Paid when their ID appears in the LCO fee
// tracker sheet (the sheet is a collection log — unpaid students aren't in it).
//
// Deployed with JWT verification off so anonymous visitors can call it:
//   supabase functions deploy fee-lookup --no-verify-jwt
// (also set in supabase/config.toml for local serve).

import { cors, json, readSheet, normId } from '../_shared/feeSheet.ts'

// e.g. 251-01479
const ID_PATTERN = /^\d{2,4}-\d{4,6}$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { student_id?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const id = normId(body.student_id)
  if (!ID_PATTERN.test(id)) return json({ error: 'Enter a valid student ID, e.g. 251-01479.' }, 400)

  try {
    const { rows } = await readSheet()
    const paid = rows.some((r) => normId(r.student_id) === id)
    return json({ student_id: id, status: paid ? 'Paid' : 'Not Paid' })
  } catch (e) {
    console.error(e)
    return json({ error: 'Fee records are unavailable right now. Please try again later.' }, 502)
  }
})
