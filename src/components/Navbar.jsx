import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Landmark, User, UserCog, LogOut, Settings, LayoutDashboard, ChevronDown, Menu, X } from 'lucide-react'

// Payment Status has no page yet (path: null).
const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Payment Status', path: null },
  { label: 'Organizations List', path: '/organizations' },
]

const Navbar = ({ isAuthenticated = false, dashboardPath = '/admin', onLogout = () => {} }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false) // mobile menu
  const [settingsOpen, setSettingsOpen] = useState(false) // account dropdown
  const settingsRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go = (path) => () => {
    setOpen(false)
    setSettingsOpen(false)
    if (path) navigate(path)
  }

  const doLogout = () => {
    setOpen(false)
    setSettingsOpen(false)
    onLogout()
  }

  const navLink = (item, extra = '') =>
    'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ' +
    (item.path && pathname === item.path
      ? 'bg-white text-emerald-900'
      : 'text-emerald-50 hover:bg-white/10') +
    (extra ? ' ' + extra : '')

  const rightBtn =
    'flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium transition hover:bg-white/10'
  const dashActive =
    'flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-emerald-900 transition'

  return (
    <header className="bg-emerald-900 text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-6">
        <button onClick={go('/')} className="flex min-w-0 items-center gap-2.5 md:justify-self-start">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="truncate text-base font-semibold sm:text-lg">
            LCO &amp; Organization Website
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex md:justify-self-center">
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={go(item.path)} className={navLink(item)}>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop right side */}
        {isAuthenticated ? (
          <div className="hidden items-center gap-2 md:flex md:justify-self-end">
            <button
              onClick={go(dashboardPath)}
              className={pathname === dashboardPath ? dashActive : rightBtn}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>

            <div ref={settingsRef} className="relative">
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                className={rightBtn}
              >
                <Settings className="h-4 w-4" /> Settings
                <ChevronDown className={'h-4 w-4 transition ' + (settingsOpen ? 'rotate-180' : '')} />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg bg-white py-1 text-slate-700 shadow-lg ring-1 ring-slate-200">
                  <button onClick={go('/profile')} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-slate-50">
                    <UserCog className="h-4 w-4" /> Profile
                  </button>
                  <button onClick={doLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button onClick={go('/login')} className={rightBtn + ' hidden md:flex md:justify-self-end'}>
            <User className="h-4 w-4" /> Login
          </button>
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
            <button key={item.label} onClick={go(item.path)} className={navLink(item, 'block text-left')}>
              {item.label}
            </button>
          ))}
          {isAuthenticated ? (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                Settings
              </p>
              <button onClick={go(dashboardPath)} className="flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium text-emerald-50 transition hover:bg-white/10">
                <LayoutDashboard className="h-5 w-5" /> Dashboard
              </button>
              <button onClick={go('/profile')} className="flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium text-emerald-50 transition hover:bg-white/10">
                <UserCog className="h-5 w-5" /> Profile
              </button>
              <button onClick={doLogout} className="flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium text-emerald-50 transition hover:bg-white/10">
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>
          ) : (
            <button onClick={go('/login')} className="mt-1 flex w-full items-center gap-2 rounded-md border border-white/30 px-4 py-2.5 text-base font-medium text-white transition hover:bg-white/10">
              <User className="h-5 w-5" /> Login
            </button>
          )}
        </nav>
      )}
    </header>
  )
}

export default Navbar
