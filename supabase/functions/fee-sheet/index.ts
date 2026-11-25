// Edge Function: fee-sheet (ADMIN ONLY)
//
// Live read/write access to the LCO fee tracker Google Sheet for the admin
// "Student Payments" tab (SRS §3.5 admin table view). Actions:
//   { action: 'list' }                        → all rows
//   { action: 'add', record }                 → append a payment row
//   { action: 'update', row, original, record } → edit one row in place
//
// Rows have no stable id in the sheet (people sort and insert rows), so an
// update carries the row's values as the admin last saw them; if that row no
// longer matches, the write is refused (409) instead of overwriting whatever
// row now sits at that position.
//
// Local:  supabase functions serve fee-sheet
// Deploy: supabase functions deploy fee-sheet

import { createClient } from 'npm:@supabase/supabase-js@2'
import { cors, json, readSheet, appendRow, updateRow, normId, FIELDS, type Field } from '../_shared/feeSheet.ts'

const ID_PATTERN = /^\d{2,4}-\d{4,6}$/
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type Rec = Record<Field, string>

// Validate and normalize a record from the browser. Returns an error string or the clean record.
function clean(input: Partial<Rec> | undefined): Rec | string {
  if (!input) return 'record is required.'
  const rec = {} as Rec
  for (const f of FIELDS) rec[f] = String(input[f] ?? '').trim()
  rec.student_id = normId(rec.student_id)

  // Values are written with USER_ENTERED (so dates become real dates); block
  // anything Sheets would treat as a formula.
  if (FIELDS.some((f) => /^[=+@]/.test(rec[f]))) return 'Values cannot start with =, + or @.'
  if (!ID_PATTERN.test(rec.student_id)) return 'ID Number must look like 251-01479.'
  if (!rec.name) return "Student's name is required."
  if (!rec.received_by) return 'Received by is required.'
  if (!rec.date) return 'Date of collection is required.'

  // Date inputs send YYYY-MM-DD; store it in the sheet's "19 January 2026" style.
  const iso = rec.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) rec.date = `${Number(iso[3])} ${MONTHS[Number(iso[2]) - 1]} ${iso[1]}`
  return rec
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing authorization' }, 401)

  // Verify the caller is an admin (runs is_admin() as that user).
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: isAdmin, error: adminErr } = await caller.rpc('is_admin')
  if (adminErr) return json({ error: 'Could not verify admin.' }, 500)
  if (!isAdmin) return json({ error: 'Only admins can access fee records.' }, 403)

  let body: { action?: string; row?: number; original?: Partial<Rec>; record?: Partial<Rec> }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  try {
    const sheet = await readSheet()

    if (body.action === 'list') return json({ rows: sheet.rows })

    if (body.action === 'add') {
      const rec = clean(body.record)
      if (typeof rec === 'string') return json({ error: rec }, 400)
      const dup = sheet.rows.find((r) => normId(r.student_id) === rec.student_id)
      if (dup) return json({ error: `${rec.student_id} is already recorded (row ${dup.row}).` }, 409)
      await appendRow(sheet, rec)
      return json({ ok: true })
    }

    if (body.action === 'update') {
      const rec = clean(body.record)
      if (typeof rec === 'string') return json({ error: rec }, 400)
      const current = sheet.rows.find((r) => r.row === body.row)
      const unchanged = current && FIELDS.every((f) => current[f] === String(body.original?.[f] ?? '').trim())
      if (!unchanged) {
        return json({ error: 'That row changed in the sheet since you loaded it. Refresh and try again.' }, 409)
      }
      const dup = sheet.rows.find((r) => r.row !== body.row && normId(r.student_id) === rec.student_id)
      if (dup) return json({ error: `${rec.student_id} is already recorded (row ${dup.row}).` }, 409)
      await updateRow(sheet, body.row!, rec)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Fee sheet request failed.' }, 502)
  }
})
