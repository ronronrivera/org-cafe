import { useState } from 'react'
import { Landmark, User, LogOut, Menu, X } from 'lucide-react'

// "Settings" removed — no backing feature in the SRS.
const NAV_ITEMS = ['Home', 'Payment Status', 'Organizations List']

const Navbar = ({
  active = 'Organizations List',
  onNavigate = () => {},
  isAuthenticated = false,
  onLogout = () => {},
}) => {
  const [open, setOpen] = useState(false)

  const goDirectory = (e) => {
    e.preventDefault()
    setOpen(false)
    onNavigate('directory')
  }

  const goHome = (e) => {
    e.preventDefault()
    setOpen(false)
    onNavigate('home')
  }

  // Maps a nav label to its click handler (Payment Status has no page yet).
  const navHandler = (item) =>
    item === 'Home' ? goHome : item === 'Organizations List' ? goDirectory : undefined

  const goLogin = (e) => {
    e.preventDefault()
    setOpen(false)
    onNavigate('login')
  }

  const doLogout = (e) => {
    e.preventDefault()
    setOpen(false)
    onLogout()
  }

  const navLink = (item, extra = '') =>
    'whitespace-nowrap rounded-md px-4 py-2.5 text-base font-medium transition ' +
    (item === active ? 'bg-white text-emerald-900' : 'text-emerald-50 hover:bg-white/10') +
    (extra ? ' ' + extra : '')

  return (
    <header className="bg-emerald-900 text-white shadow-md">
      {/* Top bar: title + centered nav (desktop) / hamburger (mobile) */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-6">
        <a
          href="#"
          onClick={goHome}
          className="flex min-w-0 items-center gap-3 md:justify-self-start"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <Landmark className="h-6 w-6" />
          </span>
          <span className="truncate text-lg font-semibold sm:text-xl">
            LCO &amp; Organization Website
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex md:justify-self-center">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              onClick={navHandler(item)}
              className={navLink(item)}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Desktop login/logout — public visitors have no account. */}
        {isAuthenticated ? (
          <a
            href="#"
            onClick={doLogout}
            className="hidden items-center gap-2 rounded-md border border-white/30 px-4 py-2.5 text-base font-medium text-white transition hover:bg-white/10 md:flex md:justify-self-end"
          >
            <LogOut className="h-5 w-5" /> Logout
          </a>
        ) : (
          <a
            href="#"
            onClick={goLogin}
            className="hidden items-center gap-2 rounded-md border border-white/30 px-4 py-2.5 text-base font-medium text-white transition hover:bg-white/10 md:flex md:justify-self-end"
          >
            <User className="h-5 w-5" /> Login
          </a>
        )}

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
              onClick={navHandler(item)}
              className={navLink(item, 'block')}
            >
              {item}
            </a>
          ))}
          {isAuthenticated ? (
            <a
              href="#"
              onClick={doLogout}
              className="mt-1 flex items-center gap-2 rounded-md border border-white/30 px-4 py-2.5 text-base font-medium text-white transition hover:bg-white/10"
            >
              <LogOut className="h-5 w-5" /> Logout
            </a>
          ) : (
            <a
              href="#"
              onClick={goLogin}
              className="mt-1 flex items-center gap-2 rounded-md border border-white/30 px-4 py-2.5 text-base font-medium text-white transition hover:bg-white/10"
            >
              <User className="h-5 w-5" /> Login
            </a>
          )}
        </nav>
      )}
    </header>
  )
}

export default Navbar
