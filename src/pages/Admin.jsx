import { useState } from 'react'
import { Building2, ReceiptText, Plus, Trash2 } from 'lucide-react'
import { organizations as seedOrgs } from '../data/sampleOrganizations'
import { students as seedStudents } from '../data/sampleStudents'

// Hardcoded for now (SRS §3.4 / §3.5). Wire to Supabase later.
const CATEGORIES = ['Academic', 'Cultural', 'Recreation', 'Environmental', 'Technical', 'Religious']
const TABS = [
  { id: 'orgs', label: 'Organizations', icon: Building2 },
  { id: 'payments', label: 'Student Payments', icon: ReceiptText },
]
const EMPTY_FORM = { org_name: '', abbreviation: '', category_name: 'Academic', description: '' }

const Admin = ({ email }) => {
  const [tab, setTab] = useState('orgs')

  // Organizations
  const [orgs, setOrgs] = useState(seedOrgs)
  const [form, setForm] = useState(EMPTY_FORM)

  const addOrg = (e) => {
    e.preventDefault()
    if (!form.org_name.trim()) return
    setOrgs((prev) => [{ org_id: Date.now(), ...form }, ...prev])
    setForm(EMPTY_FORM)
  }
  const deleteOrg = (id) => setOrgs((prev) => prev.filter((o) => o.org_id !== id))

  // Students / payments
  const [students, setStudents] = useState(seedStudents)
  const [filter, setFilter] = useState('all')
  const toggleStatus = (id) =>
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === id ? { ...s, status: s.status === 'Paid' ? 'Not Paid' : 'Paid' } : s,
      ),
    )
  const visibleStudents = students.filter((s) => filter === 'all' || s.status === filter)
  const paidCount = students.filter((s) => s.status === 'Paid').length
  const notPaidCount = students.length - paidCount

  const field =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="animate-fade-in-up text-2xl font-bold text-slate-800">Admin Control Hub</h1>
      <p className="animate-fade-in-up text-sm text-slate-500">Signed in{email ? ` as ${email}` : ''}.</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ' +
              (tab === id
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700')
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Organizations tab */}
      {tab === 'orgs' && (
        <div key="orgs" className="mt-6 animate-fade-in-up space-y-6">
          {/* Add org form */}
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Add a new organization</h2>
            <form onSubmit={addOrg} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                className={field}
                placeholder="Organization name"
                value={form.org_name}
                onChange={(e) => setForm({ ...form, org_name: e.target.value })}
              />
              <input
                className={field}
                placeholder="Abbreviation (e.g. BSIT)"
                value={form.abbreviation}
                onChange={(e) => setForm({ ...form, abbreviation: e.target.value })}
              />
              <select
                className={field}
                value={form.category_name}
                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                className={field}
                placeholder="Short description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
                >
                  <Plus className="h-4 w-4" /> Add Organization
                </button>
              </div>
            </form>
          </section>

          {/* Org list */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Organizations</h2>
              <span className="text-sm text-slate-400">{orgs.length} total</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Abbr.</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgs.map((o) => (
                  <tr key={o.org_id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{o.org_name}</td>
                    <td className="px-6 py-3 text-slate-500">{o.abbreviation}</td>
                    <td className="px-6 py-3 text-slate-500">{o.category_name}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => deleteOrg(o.org_id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No organizations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* Payments tab */}
      {tab === 'payments' && (
        <div key="payments" className="mt-6 animate-fade-in-up">
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Student Fee Clearance</h2>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {[
                  { id: 'all', label: `All (${students.length})` },
                  { id: 'Paid', label: `Paid (${paidCount})` },
                  { id: 'Not Paid', label: `Not Paid (${notPaidCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={
                      'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                      (filter === f.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700')
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Student ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Dept</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{s.student_id}</td>
                    <td className="px-6 py-3 text-slate-600">{s.name}</td>
                    <td className="px-6 py-3 text-slate-500">{s.department}</td>
                    <td className="px-6 py-3 text-slate-500">{s.course}</td>
                    <td className="px-6 py-3 text-slate-500">{s.year_level}</td>
                    <td className="px-6 py-3">
                      <span
                        className={
                          'rounded-full px-2.5 py-1 text-xs font-semibold ' +
                          (s.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700')
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(s.student_id)}
                        className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Mark {s.status === 'Paid' ? 'Not Paid' : 'Paid'}
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No students match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </main>
  )
}

export default Admin
