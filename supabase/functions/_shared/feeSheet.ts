// Shared Google Sheets access for the fee-clearance Edge Functions.
//
// The LCO fee tracker lives in a Google Sheet that stays the source of truth;
// these functions read/write it live through the Sheets API using a Google
// service account (the sheet must be shared with the service account's email
// as Editor). Credentials never reach the browser.
//
// Secrets (supabase secrets set ... / supabase/functions/.env locally):
//   GOOGLE_SERVICE_ACCOUNT_JSON  the full service-account key JSON
//   FEE_SHEET_ID                 spreadsheet id (the long part of its URL)
//   FEE_SHEET_TAB                optional tab name; defaults to the first tab
//
// Switching from a test sheet to the real LCO sheet = change FEE_SHEET_ID (and
// FEE_SHEET_TAB if needed) and share the real sheet with the same service
// account. Columns are located by their header text, not position.

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Field → accepted header spellings (compared lowercased, non-letters stripped).
const HEADERS = {
  date: ['dateofcollection', 'date'],
  or_number: ['ornumber', 'or', 'orno'],
  student_id: ['idnumber', 'studentid', 'idno', 'id'],
  name: ['studentsname', 'studentname', 'name'],
  received_by: ['receivedby'],
} as const
export type Field = keyof typeof HEADERS
export const FIELDS = Object.keys(HEADERS) as Field[]

export type FeeRow = { row: number } & Record<Field, string>

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z]/g, '')
export const normId = (s: unknown) => String(s ?? '').replace(/\s+/g, '')

// ---------------------------------------------------------------------------
// Google OAuth: sign a JWT with the service-account key, exchange for a token.
// ---------------------------------------------------------------------------
let cachedToken: { token: string; exp: number } | null = null

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token

  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set.')
  const { client_email, private_key } = JSON.parse(raw)

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const pem = private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`))

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${b64url(sig)}`,
    }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Google auth failed: ${body.error_description || body.error}`)
  cachedToken = { token: body.access_token, exp: now + body.expires_in }
  return body.access_token
}

// ---------------------------------------------------------------------------
// Sheets API helpers
// ---------------------------------------------------------------------------
const tab = () => {
  const t = Deno.env.get('FEE_SHEET_TAB')
  return t ? `'${t.replace(/'/g, "''")}'!` : ''
}

async function sheets(path: string, init: RequestInit = {}) {
  const id = Deno.env.get('FEE_SHEET_ID')
  if (!id) throw new Error('FEE_SHEET_ID is not set.')
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Google Sheets error: ${body.error?.message ?? res.status}`)
  return body
}

// Column letter for a 0-based index (0 → A, 26 → AA).
const col = (i: number): string => (i < 26 ? '' : col(Math.floor(i / 26) - 1)) + String.fromCharCode(65 + (i % 26))

export type Sheet = {
  rows: FeeRow[]
  columns: Record<Field, number> // 0-based column index of each field
  headerRow: number // 1-based sheet row of the header
}

/** Read the whole tracker. The header row is found by scanning for "ID Number". */
export async function readSheet(): Promise<Sheet> {
  const { values = [] } = await sheets(
    `/values/${encodeURIComponent(`${tab()}A1:Z`)}?valueRenderOption=FORMATTED_VALUE`,
  )

  const headerIdx = (values as string[][]).findIndex((r) =>
    r.some((c) => (HEADERS.student_id as readonly string[]).includes(norm(c))),
  )
  if (headerIdx === -1) throw new Error('Could not find the "ID Number" header in the fee sheet.')

  const header = (values[headerIdx] as string[]).map(norm)
  const columns = {} as Record<Field, number>
  for (const f of FIELDS) {
    const i = header.findIndex((h) => (HEADERS[f] as readonly string[]).includes(h))
    if (i === -1) throw new Error(`Fee sheet is missing the column for "${f}".`)
    columns[f] = i
  }

  const rows: FeeRow[] = []
  ;(values as string[][]).slice(headerIdx + 1).forEach((r, i) => {
    const rec = { row: headerIdx + 2 + i } as FeeRow
    for (const f of FIELDS) rec[f] = String(r[columns[f]] ?? '').trim()
    if (rec.student_id || rec.name) rows.push(rec) // skip blank/spacer rows
  })
  return { rows, columns, headerRow: headerIdx + 1 }
}

/** Build a full sheet row (A..last mapped column) from field values. */
function toRowValues(sheet: Sheet, rec: Record<Field, string>) {
  const width = Math.max(...Object.values(sheet.columns)) + 1
  const out: (string | null)[] = Array(width).fill(null)
  for (const f of FIELDS) out[sheet.columns[f]] = rec[f]
  return out
}

/** Append a payment row after the last row of the table. */
export async function appendRow(sheet: Sheet, rec: Record<Field, string>) {
  const range = `${tab()}A${sheet.headerRow}:${col(Math.max(...Object.values(sheet.columns)))}`
  await sheets(
    `/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: [toRowValues(sheet, rec)] }) },
  )
}

/** Overwrite only the mapped columns of one sheet row. */
export async function updateRow(sheet: Sheet, row: number, rec: Record<Field, string>) {
  const data = FIELDS.map((f) => ({
    range: `${tab()}${col(sheet.columns[f])}${row}`,
    values: [[rec[f]]],
  }))
  await sheets('/values:batchUpdate', {
    method: 'POST',
    body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
  })
}
