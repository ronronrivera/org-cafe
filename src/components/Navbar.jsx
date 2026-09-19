import { useEffect, useRef, useState } from 'react'
import { Landmark, User, UserCog, LogOut, Settings, LayoutDashboard, ChevronDown, Menu, X } from 'lucide-react'

// "Settings" here is the account menu, not a page. Base nav for everyone:
const NAV_ITEMS = ['Home', 'Payment Status', 'Organizations List']

const Navbar = ({
  active = 'Organizations List',
  onNavigate = () => {},
  isAuthenticated = false,
  onLogout = () => {},
}) => {
  const [open, setOpen] = useState(false) // mobile menu
  const [settingsOpen, setSettingsOpen] = useState(false) // desktop account dropdown
  const settingsRef = useRef(null)

  // Close the account dropdown when clicking outside it.
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navigate = (page) => (e) => {
    e.preventDefault()
    setOpen(false)
    setSettingsOpen(false)
    onNavigate(page)
  }
  const goHome = navigate('home')
  const goDirectory = navigate('directory')
  const goDashboard = navigate('admin')
  const goLogin = navigate('login')
  const goProfile = navigate('profile')

  const doLogout = (e) => {
    e.preventDefault()
    setOpen(false)
    setSettingsOpen(false)
    onLogout()
  }

  const navHandler = (item) =>
    item === 'Home' ? goHome : item === 'Organizations List' ? goDirectory : undefined

  // Smaller buttons for the right-side account controls (Dashboard + Settings).
  const rightBtn =
    'flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium transition hover:bg-white/10'

  const navLink = (item, extra = '') =>
    'whitespace-nowrap rounded-md px-4 py-2.5 text-base font-medium transition ' +
    (item === active ? 'bg-white text-emerald-900' : 'text-emerald-50 hover:bg-white/10') +
    (extra ? ' ' + extra : '')

  return (
    <header className="bg-emerald-900 text-white shadow-md">
      {/* Top bar: title + centered nav (desktop) / hamburger (mobile) */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-6">
        <a href="#" onClick={goHome} className="flex min-w-0 items-center gap-3 md:justify-self-start">
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
            <a key={item} href="#" onClick={navHandler(item)} className={navLink(item)}>
              {item}
            </a>
          ))}
        </nav>

        {/* Desktop right side: Dashboard + account dropdown (auth) or login */}
        {isAuthenticated ? (
          <div className="hidden items-center gap-2 md:flex md:justify-self-end">
            <a
              href="#"
              onClick={goDashboard}
              className={
                active === 'Dashboard'
                  ? 'flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-emerald-900 transition'
                  : rightBtn
              }
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </a>

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
                  <a
                    href="#"
                    onClick={goProfile}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-slate-50"
                  >
                    <UserCog className="h-4 w-4" /> Profile
                  </a>
                  <a
                    href="#"
                    onClick={doLogout}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </a>
                </div>
              )}
            </div>
          </div>
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
            <a key={item} href="#" onClick={navHandler(item)} className={navLink(item, 'block')}>
              {item}
            </a>
          ))}
          {isAuthenticated ? (
            <>
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                  Settings
                </p>
                <a
                  href="#"
                  onClick={goDashboard}
                  className="flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium text-emerald-50 transition hover:bg-white/10"
                >
                  <LayoutDashboard className="h-5 w-5" /> Dashboard
                </a>
                <a
                  href="#"
                  onClick={goProfile}
                  className="flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium text-emerald-50 transition hover:bg-white/10"
                >
                  <UserCog className="h-5 w-5" /> Profile
                </a>
                <a
                  href="#"
                  onClick={doLogout}
                  className="flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium text-emerald-50 transition hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5" /> Logout
                </a>
              </div>
            </>
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
