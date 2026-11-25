import { useState } from 'react'
import { ReceiptText, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { lookupFeeStatus } from '../lib/fees'

// SRS §3.5 public lookup: one student ID in, only "Paid" / "Not Paid" out.
const FeeClearance = () => {
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { student_id, status }
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!studentId.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    const { data, error } = await lookupFeeStatus(studentId)
    setLoading(false)
    if (error) setError(error)
    else setResult(data)
  }

  const paid = result?.status === 'Paid'

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="animate-fade-in-up text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <ReceiptText className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">LCO Fee Clearance</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your student ID to check whether your LCO organization fee has been recorded. Only the
          payment status is shown.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-8 flex gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200"
      >
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            inputMode="numeric"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Student ID, e.g. 251-01479"
            aria-label="Student ID"
            className="w-full bg-transparent py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !studentId.trim()}
          className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Check
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {result && (
        <div
          className={
            'mt-6 flex animate-fade-in-up items-center gap-4 rounded-xl p-5 ring-1 ' +
            (paid ? 'bg-emerald-50 ring-emerald-200' : 'bg-red-50 ring-red-200')
          }
        >
          {paid ? (
            <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="h-10 w-10 shrink-0 text-red-500" />
          )}
          <div>
            <p className="text-sm text-slate-500">{result.student_id}</p>
            <p className={'text-xl font-bold ' + (paid ? 'text-emerald-800' : 'text-red-700')}>{result.status}</p>
            {!paid && (
              <p className="mt-1 text-xs text-slate-500">
                No payment is recorded for this ID. If you've paid, bring your official receipt to the LCO office.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default FeeClearance
