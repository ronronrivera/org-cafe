import { useNavigate } from 'react-router-dom'
import { Search, Users, Megaphone, UserPlus, ReceiptText, Globe, ArrowRight } from 'lucide-react'
import HeroBackground, { Dots } from '../components/HeroBackground'

// Content is drawn from the SRS system features (§3.1, §3.2, §3.5) and the
// public-visitor characteristics (§2.3). Styling follows the site's emerald theme.
const FEATURES = [
  {
    icon: Search,
    title: 'Search & Discover',
    text: 'Browse every recognized CSU organization, grouped by category, with keyword search and filters. No login required.',
    dest: 'directory',
  },
  {
    icon: Users,
    title: 'Organization Profiles',
    text: 'Each org has a dedicated page — logo, description, category, official Facebook link, and a live activity feed.',
    dest: 'directory',
  },
  {
    icon: Megaphone,
    title: 'Announcements & Events',
    text: 'Stay updated with pinned announcements and a chronological feed of posts and upcoming events.',
    dest: 'directory',
  },
  {
    icon: UserPlus,
    title: 'Join Organizations',
    text: 'Apply through each org’s official form — active only during the recruitment dates the organization sets.',
    dest: 'directory',
  },
  {
    icon: ReceiptText,
    title: 'Fee Clearance Lookup',
    text: 'Check your LCO organization fee status with a single student ID — returns only Paid or Not Paid.',
    dest: 'payment',
  },
  {
    icon: Globe,
    title: 'One Central Platform',
    text: 'No more scattered Facebook pages or posters — everything about CSU organizations in a single place.',
    dest: 'directory',
  },
]

const CATEGORIES = ['Academic', 'Cultural', 'Recreation', 'Environmental', 'Technical', 'Religious']

const Home = () => {
  const navigate = useNavigate()
  const onNavigate = (dest) => navigate(dest === 'directory' ? '/organizations' : `/${dest}`)
  return (
    <div>
      {/* Hero — the global Navbar overlays this section on the home route. */}
      <section className="relative overflow-hidden text-white">
        <HeroBackground />

        <div className="relative mx-auto max-w-5xl px-6 pb-36 pt-32 text-center md:pb-44 md:pt-36">
          <span className="inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-teal-50 backdrop-blur">
            Caraga State University
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl animate-fade-in-up text-4xl font-bold leading-tight tracking-tight drop-shadow-sm md:text-5xl">
            Discover Every CSU Student Organization in One Place
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-teal-50/95 drop-shadow-sm md:text-lg">
            Organization Café brings all recognized Caraga State University organizations together —
            browse profiles, follow activities and announcements, and check your LCO fee clearance,
            all without an account.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('directory')}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-teal-50"
            >
              Browse Organizations
            </button>
            <button
              onClick={() => onNavigate('payment')}
              className="rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Check Fee Clearance
            </button>
          </div>
        </div>
      </section>

      {/* Features + categories share one soft background with decorative circles */}
      <section className="relative overflow-hidden bg-slate-50">
        <span aria-hidden className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-100/50" />
        <span aria-hidden className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-100/50" />
        <Dots cols={3} rows={6} className="right-16 top-20 hidden text-emerald-300/70 lg:grid" />
        <svg
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 hidden h-36 w-[22rem] md:block"
          viewBox="0 0 300 140"
          preserveAspectRatio="none"
        >
          <path d="M0 140C80 70 180 15 300 0V140Z" fill="#b6ebdc" />
          <path d="M85 140C140 80 210 25 300 5V140Z" fill="#66cfb1" />
          <path d="M140 140C180 90 230 45 300 30V140Z" fill="#039068" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-6 md:pb-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-emerald-900 md:text-3xl">What you can do</h2>
            <p className="mt-2 text-slate-600">Everything students and visitors need to stay connected.</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, dest }) => (
              <button
                key={title}
                onClick={() => onNavigate(dest)}
                className="group flex items-start gap-4 rounded-xl bg-white p-4 text-left shadow-md shadow-slate-200/70 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-emerald-200"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm transition group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-800">{title}</span>
                  <span className="mt-2 block text-xs leading-relaxed text-slate-500">{text}</span>
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>

          <div className="mt-14 text-center">
            <h2 className="text-2xl font-bold text-emerald-900 md:text-3xl">Explore by category</h2>
            <p className="mt-2 text-slate-600">Organizations are grouped into categories for easy discovery.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => onNavigate('directory')}
                  className="rounded-full border-2 border-emerald-600 bg-white px-5 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#03765b] via-[#058a68] to-[#0aa57b] text-white">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cta-bright" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#14b88e" />
              <stop offset="1" stopColor="#22c79b" />
            </linearGradient>
          </defs>
          <path d="M0 0C160 0 260 70 340 170C400 250 450 310 500 320H0Z" fill="#1bb38b" />
          <path d="M0 22C140 25 235 90 315 185C375 260 425 310 470 320H0Z" fill="#05664b" />
          <path d="M0 165C200 230 380 290 500 320H0Z" fill="#17bc8f" />
          <path d="M780 320C950 230 1150 90 1440 0V320Z" fill="url(#cta-bright)" />
          <path d="M1440 0C1260 40 1150 180 1100 320H1210C1250 200 1330 70 1440 0Z" fill="#05664f" />
        </svg>
        <Dots cols={5} rows={5} className="left-4 top-10 hidden text-emerald-300/50 md:grid" />
        <Dots cols={5} rows={4} className="right-6 top-12 hidden text-emerald-100/30 md:grid" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 py-16 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to explore CSU organizations?</h2>
          <p className="max-w-xl text-teal-50/90">
            Start browsing the directory — no sign-up needed. Organization representatives can log in
            with credentials issued by an administrator.
          </p>
          <button
            onClick={() => onNavigate('directory')}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-teal-50"
          >
            Browse Organizations
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#012b2c] py-6 text-center text-sm text-teal-100/50">
        © 2026 Organization Café — Caraga State University
      </footer>
    </div>
  )
}

export default Home
