import { Globe } from 'lucide-react'
import { accentStyles, categoryBadge } from '../data/sampleOrganizations'

// lucide-react dropped brand icons, so the Facebook logo is inlined as SVG.
const FacebookIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
)

const OrganizationCard = ({ org, index = 0 }) => {
  const accent = accentStyles[org.accent] ?? accentStyles.emerald
  const badge = categoryBadge[org.category_name] ?? 'bg-slate-100 text-slate-700'

  return (
    <article
      className="group animate-fade-in-up overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Colored header with logo tile */}
      <div className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${accent.header}`}>
        <span className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className={`flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-bold text-white transition duration-300 group-hover:scale-110 ${accent.tile}`}>
          {org.initials}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-800">{org.org_name}</h3>
        <p className="text-sm text-slate-400">({org.abbreviation})</p>

        <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
          {org.category_name}
        </span>

        <p className="mt-3 text-sm leading-relaxed text-slate-500">{org.description}</p>

        <div className="mt-5 flex gap-3">
          <a
            href={org.fb_page_link}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FacebookIcon className="h-4 w-4 text-[#1877F2]" /> Facebook Link
          </a>
          <a
            href={org.join_form_link}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-900"
          >
            <Globe className="h-4 w-4" /> Website
          </a>
        </div>
      </div>
    </article>
  )
}

export default OrganizationCard
