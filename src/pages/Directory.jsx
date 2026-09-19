import OrganizationCard from '../components/OrganizationCard'
import { organizations } from '../data/sampleOrganizations'

const Directory = () => {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      {/* Search + filter row */}
      <div className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search for organizations..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
          ◇ Filter
        </button>
      </div>

      {/* Organization cards grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org, index) => (
          <OrganizationCard key={org.org_id} org={org} index={index} />
        ))}
      </div>
    </main>
  )
}

export default Directory
