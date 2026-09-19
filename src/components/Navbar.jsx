import { useState } from 'react'
import { Landmark, User, Menu, X } from 'lucide-react'

// "Home" removed — the directory itself is the landing page (SRS §3.1).
// "Settings" removed — no backing feature in the SRS.
const NAV_ITEMS = ['Payment Status', 'Organizations List']

const Navbar = ({ active = 'Organizations List', onNavigate = () => {} }) => {
  const [open, setOpen] = useState(false)

  const goDirectory = (e) => {
    e.preventDefault()
    setOpen(false)
    onNavigate('directory')
  }

  const goLogin = (e) => {
    e.preventDefault()
    setOpen(false)
    onNavigate('login')
  }

  const navLink = (item, extra = '') =>
    'rounded-md px-4 py-2 text-sm font-medium transition ' +
    (item === active ? 'bg-white text-emerald-900' : 'text-emerald-50 hover:bg-white/10') +
    (extra ? ' ' + extra : '')

  return (
    <header className="bg-emerald-900 text-white">
      {/* Top bar: title + centered nav (desktop) / hamburger (mobile) */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:grid md:grid-cols-3 md:px-6">
        <a
          href="#"
          onClick={goDirectory}
          className="flex min-w-0 items-center gap-3 md:justify-self-start"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="truncate text-base font-semibold sm:text-lg">
            LCO &amp; Organization Website
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex md:justify-self-center">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              onClick={item === 'Organizations List' ? goDirectory : undefined}
              className={navLink(item)}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Desktop login — public visitors have no account; routes to org_rep / admin login. */}
        <a
          href="#"
          onClick={goLogin}
          className="hidden items-center gap-2 rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 md:flex md:justify-self-end"
        >
          <User className="h-4 w-4" /> Login
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="rounded-md p-2 transition hover:bg-white/10 md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              onClick={item === 'Organizations List' ? goDirectory : undefined}
              className={navLink(item, 'block')}
            >
              {item}
            </a>
          ))}
          <a
            href="#"
            onClick={goLogin}
            className="mt-1 flex items-center gap-2 rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <User className="h-4 w-4" /> Login
          </a>
        </nav>
      )}
    </header>
  )
}

export default Navbar
