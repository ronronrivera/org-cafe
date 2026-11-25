import { supabase } from './supabaseClient'

// The LCO fee tracker is a Google Sheet read/written live through two Edge
// Functions (see supabase/functions/_shared/feeSheet.ts):
//   fee-lookup — public; returns only Paid / Not Paid for one student ID
//   fee-sheet  — admin only; list / add / update rows

/** Pull the readable message out of an Edge Function error response. */
async function errorMessage(error) {
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
  return message
}

async function invoke(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, { body })
  if (error) return { data: null, error: await errorMessage(error) }
  return { data, error: null }
}

/** Public lookup. Resolves to { data: { student_id, status } } on success. */
export const lookupFeeStatus = (studentId) => invoke('fee-lookup', { student_id: studentId?.trim() })

/** Admin: every row of the tracker, each with its 1-based sheet `row`. */
export async function listFeeRows() {
  const { data, error } = await invoke('fee-sheet', { action: 'list' })
  return { data: data?.rows ?? [], error }
}

/** Admin: append a payment row. `record` = { date, or_number, student_id, name, received_by }. */
export const addFeeRow = (record) => invoke('fee-sheet', { action: 'add', record })

/** Admin: edit one row; `original` is the row as loaded, used to detect sheet changes. */
export const updateFeeRow = (original, record) =>
  invoke('fee-sheet', { action: 'update', row: original.row, original, record })

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/** "19 January 2026" (the sheet's style) → "2026-01-19" for <input type="date">; '' if unparseable. */
export function sheetDateToIso(value = '') {
  const m = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (!m) return ''
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1
  if (!month) return ''
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`
}
