import { useEffect, useState } from 'react'
import { Building2, ReceiptText, Plus, Trash2, Loader2 } from 'lucide-react'
import { students as seedStudents } from '../data/sampleStudents'
import { listOrganizations, listCategories, deleteOrganization } from '../lib/organizations'
import AddOrgModal from '../components/AddOrgModal'
import ConfirmModal from '../components/ConfirmModal'

const TABS = [
  { id: 'orgs', label: 'Organizations', icon: Building2 },
  { id: 'payments', label: 'Student Payments', icon: ReceiptText },
]
const Admin = ({ email }) => {
  const [tab, setTab] = useState('orgs')

  // Organizations (live from Supabase)
  const [orgs, setOrgs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [notice, setNotice] = useState(null) // { type, text }
  const [deleteTarget, setDeleteTarget] = useState(null) // org pending deletion
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [orgRes, catRes] = await Promise.all([listOrganizations(), listCategories()])
      if (!active) return
      setOrgs(orgRes.data)
      setCategories(catRes.data)
      setLoadError(orgRes.error || catRes.error)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const handleCreated = (org, warning) => {
    setOrgs((prev) => [org, ...prev])
    setModalOpen(false)
    setNotice({ type: warning ? 'error' : 'success', text: warning || `“${org.org_name}” added.` })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await deleteOrganization(deleteTarget.org_id)
    setDeleting(false)
    if (error) {
      setNotice({ type: 'error', text: `Delete failed: ${error}` })
    } else {
      setOrgs((o) => o.filter((x) => x.org_id !== deleteTarget.org_id))
      setNotice({ type: 'success', text: `“${deleteTarget.org_name}” deleted.` })
    }
    setDeleteTarget(null)
  }

  // Students / payments (still hardcoded)
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
          {notice && (
            <p
              className={
                'rounded-lg px-3 py-2 text-sm ' +
                (notice.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')
              }
            >
              {notice.text}
            </p>
          )}

          {/* Org list */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Organizations</h2>
                <span className="text-sm text-slate-400">{orgs.length} total</span>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" /> Add Organization
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading…
              </div>
            ) : loadError ? (
              <div className="px-6 py-8 text-center text-red-600">{loadError}</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Logo</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orgs.map((o) => (
                    <tr key={o.org_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        {o.logo ? (
                          <img src={o.logo} alt="" className="h-9 w-9 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                            —
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800">{o.org_name}</td>
                      <td className="px-6 py-3 text-slate-500">{o.org_categories?.category_name ?? '—'}</td>
                      <td className="px-6 py-3 text-slate-500">{o.status}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(o)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orgs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        No organizations yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {/* Payments tab (hardcoded for now) */}
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
                          (s.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')
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

      {modalOpen && (
        <AddOrgModal
          categories={categories}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete organization?"
          message={`This will permanently delete “${deleteTarget.org_name}” and all its posts, media, and announcements. This cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </main>
  )
}

export default Admin
