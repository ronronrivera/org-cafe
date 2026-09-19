import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import OrganizationCard from '../components/OrganizationCard'
import { listOrganizations } from '../lib/organizations'

const Directory = () => {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error: err } = await listOrganizations()
      if (!active) return
      // Flatten the embedded category name for the card.
      setOrgs(data.map((o) => ({ ...o, category_name: o.org_categories?.category_name })))
      setError(err)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orgs
    return orgs.filter(
      (o) =>
        o.org_name?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        o.category_name?.toLowerCase().includes(q),
    )
  }, [orgs, query])

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      {/* Search + filter row */}
      <div className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for organizations..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading organizations…
        </div>
      ) : error ? (
        <div className="py-20 text-center text-red-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          {orgs.length === 0 ? 'No organizations yet.' : 'No organizations match your search.'}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org, index) => (
            <OrganizationCard key={org.org_id} org={org} index={index} />
          ))}
        </div>
      )}
    </main>
  )
}

export default Directory
