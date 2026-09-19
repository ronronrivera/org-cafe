import { Search, Users, Megaphone, UserPlus, ReceiptText, Globe } from 'lucide-react'

// Content is drawn from the SRS system features (§3.1, §3.2, §3.5) and the
// public-visitor characteristics (§2.3). Styling follows the site's emerald theme.
const FEATURES = [
  {
    icon: Search,
    title: 'Search & Discover',
    text: 'Browse every recognized CSU organization, grouped by category, with keyword search and filters. No login required.',
  },
  {
    icon: Users,
    title: 'Organization Profiles',
    text: 'Each org has a dedicated page — logo, description, category, official Facebook link, and a live activity feed.',
  },
  {
    icon: Megaphone,
    title: 'Announcements & Events',
    text: 'Stay updated with pinned announcements and a chronological feed of posts and upcoming events.',
  },
  {
    icon: UserPlus,
    title: 'Join Organizations',
    text: 'Apply through each org’s official form — active only during the recruitment dates the organization sets.',
  },
  {
    icon: ReceiptText,
    title: 'Fee Clearance Lookup',
    text: 'Check your LCO organization-fee status with a single student ID — returns only Paid or Not Paid.',
  },
  {
    icon: Globe,
    title: 'One Central Platform',
    text: 'No more scattered Facebook pages or posters — everything about CSU organizations in a single place.',
  },
]

const CATEGORIES = ['Academic', 'Cultural', 'Recreation', 'Environmental', 'Technical', 'Religious']

const Home = ({ onNavigate = () => {} }) => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-emerald-700 to-teal-600 text-white">
        {/* Decorative accents */}
        <span className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-lime-300/10 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-teal-50 backdrop-blur">
            Caraga State University
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl animate-fade-in-up text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Discover Every CSU Student Organization in One Place
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-teal-50/90 md:text-lg">
            Organization Café brings all recognized Caraga State University organizations together —
            browse profiles, follow activities and announcements, and check your LCO fee clearance,
            all without an account.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('directory')}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-800 shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-teal-50"
            >
              Browse Organizations
            </button>
            <button
              onClick={() => onNavigate('payment')}
              className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Check Fee Clearance
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 md:text-3xl">What you can do</h2>
            <p className="mt-2 text-slate-500">Everything students and visitors need to stay connected.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-teal-200"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-sm transition group-hover:scale-105">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800 md:text-3xl">Explore by category</h2>
          <p className="mt-2 text-slate-500">Organizations are grouped into categories for easy discovery.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => onNavigate('directory')}
                className="rounded-full border border-teal-200 bg-teal-50 px-5 py-2 text-sm font-medium text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-800 to-emerald-700 text-white">
        <span className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to explore CSU organizations?</h2>
          <p className="max-w-xl text-teal-50/90">
            Start browsing the directory — no sign-up needed. Organization representatives can log in
            with credentials issued by an administrator.
          </p>
          <button
            onClick={() => onNavigate('directory')}
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-800 shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-teal-50"
          >
            Browse Organizations
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-6 text-center text-sm text-slate-400">
        © 2026 Organization Café — Caraga State University
      </footer>
    </div>
  )
}

export default Home
