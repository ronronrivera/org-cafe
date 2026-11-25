import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, RefreshCw, Search, Loader2, X } from 'lucide-react'
import { listFeeRows, addFeeRow, updateFeeRow, sheetDateToIso } from '../lib/fees'

const EMPTY = { date: '', or_number: '', student_id: '', name: '', received_by: '' }
const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local time

// Add / edit one tracker row. Edits carry the original row so the server can
// refuse the write if the sheet changed underneath us.
const FeeRowModal = ({ original, receivers, onClose, onSaved }) => {
  const [form, setForm] = useState(
    original
      ? { ...original, date: sheetDateToIso(original.date) || original.date }
      : { ...EMPTY, date: today() },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = original ? await updateFeeRow(original, form) : await addFeeRow(form)
    setSaving(false)
    if (error) setError(error)
    else onSaved(original ? 'Row updated in the sheet.' : 'Payment added to the sheet.')
  }

  const field =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  const label = 'mb-1 block text-xs font-medium text-slate-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <form
        onSubmit={submit}
        className="w-full max-w-lg animate-fade-in-up rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{original ? 'Edit payment' : 'Record payment'}</h2>
            <p className="text-xs text-slate-400">
              {original ? `Sheet row ${original.row}` : 'Appended to the LCO fee tracker sheet'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div>
            <label className={label}>Date of Collection</label>
            <input type="date" required value={form.date} onChange={set('date')} className={field} />
          </div>
          <div>
            <label className={label}>OR Number</label>
            <input value={form.or_number} onChange={set('or_number')} placeholder="2526-0001" className={field} />
          </div>
          <div>
            <label className={label}>ID Number</label>
            <input required value={form.student_id} onChange={set('student_id')} placeholder="251-01479" className={field} />
          </div>
          <div>
            <label className={label}>Received by</label>
            <input required list="fee-receivers" value={form.received_by} onChange={set('received_by')} className={field} />
            <datalist id="fee-receivers">
              {receivers.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Student's Name</label>
            <input required value={form.name} onChange={set('name')} placeholder="JUAN A. DELA CRUZ" className={field} />
          </div>
        </div>

        {error && <p className="mx-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

// Admin view of the live LCO fee tracker (Google Sheet via the fee-sheet Edge Function).
const FeePaymentsPanel = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [editing, setEditing] = useState(null) // row object, or 'new'

  const [query, setQuery] = useState('')
  const [receiver, setReceiver] = useState('')
  const [series, setSeries] = useState('')
  const [date, setDate] = useState('')

  const apply = ({ data, error }) => {
    setRows(data)
    setError(error)
    setLoading(false)
  }

  const load = async () => {
    setLoading(true)
    apply(await listFeeRows())
  }

  useEffect(() => {
    let active = true
    listFeeRows().then((res) => active && apply(res))
    return () => {
      active = false
    }
  }, [])

  // Filter options come from the sheet itself. "ID series" is the part of the
  // student ID before the dash (e.g. 251), which tracks the entry batch.
  const distinct = (fn) => [...new Set(rows.map(fn).filter(Boolean))]
  const receivers = distinct((r) => r.received_by).sort()
  const seriesList = distinct((r) => r.student_id.split('-')[0]).sort().reverse()
  const dates = distinct((r) => r.date)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!q || [r.student_id, r.name, r.or_number].some((v) => v.toLowerCase().includes(q))) &&
        (!receiver || r.received_by === receiver) &&
        (!series || r.student_id.split('-')[0] === series) &&
        (!date || r.date === date),
    )
  }, [rows, query, receiver, series, date])

  const handleSaved = (text) => {
    setEditing(null)
    setNotice(text)
    load()
  }

  const select =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-emerald-500'

  return (
    <div className="space-y-4">
      {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">LCO Fee Collection Tracker</h2>
            <span className="text-sm text-slate-400">
              Live from Google Sheets · {visible.length} of {rows.length} payments
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button
              onClick={() => setEditing('new')}
              className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" /> Record Payment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-3">
          <div className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, name, or OR number"
              className="w-full bg-transparent py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <select value={series} onChange={(e) => setSeries(e.target.value)} className={select}>
            <option value="">All ID series</option>
            {seriesList.map((s) => (
              <option key={s} value={s}>
                {s}-xxxxx
              </option>
            ))}
          </select>
          <select value={date} onChange={(e) => setDate(e.target.value)} className={select}>
            <option value="">All dates</option>
            {dates.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select value={receiver} onChange={(e) => setReceiver(e.target.value)} className={select}>
            <option value="">Anyone received</option>
            {receivers.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading sheet…
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Date of Collection</th>
                  <th className="px-6 py-3">OR Number</th>
                  <th className="px-6 py-3">ID Number</th>
                  <th className="px-6 py-3">Student's Name</th>
                  <th className="px-6 py-3">Received by</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((r) => (
                  <tr key={r.row} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-3 text-slate-500">{r.date}</td>
                    <td className="px-6 py-3 text-slate-500">{r.or_number || '—'}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{r.student_id}</td>
                    <td className="px-6 py-3 text-slate-600">{r.name}</td>
                    <td className="px-6 py-3 text-slate-500">{r.received_by}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setEditing(r)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      {rows.length === 0 ? 'The sheet has no payments yet.' : 'No payments match these filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <FeeRowModal
          original={editing === 'new' ? null : editing}
          receivers={receivers}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default FeePaymentsPanel
