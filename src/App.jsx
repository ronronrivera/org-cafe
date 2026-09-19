import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Directory from './pages/Directory'
import Login from './pages/Login'
import Admin from './pages/Admin'
import OrgRepDashboard from './pages/OrgRepDashboard'
import Profile from './pages/Profile'
import { supabase } from './lib/supabaseClient'
import { getCurrentRole, signOut } from './lib/auth'

const FullPageLoader = () => (
  <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
    <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
)

// Defined at module scope (NOT inside App) so its component identity is stable —
// otherwise every App re-render (e.g. an auth event on tab focus) would remount
// the guarded page and wipe its state.
const Guard = ({ authReady, session, roleResolved, role, allow, children }) => {
  if (!authReady || (session && !roleResolved)) return <FullPageLoader />
  if (!session) return <Navigate to="/login" replace />
  if (allow && role !== allow) {
    return <Navigate to={role === 'org_rep' ? '/dashboard' : role === 'admin' ? '/admin' : '/'} replace />
  }
  return children
}

const App = () => {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [role, setRole] = useState(null)
  const [roleResolved, setRoleResolved] = useState(false)

  // Supabase auth state is the source of truth for whether someone is logged in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Resolve role when the user changes (stable id avoids refresh loops).
  const userId = session?.user?.id ?? null
  useEffect(() => {
    if (!userId) {
      setRole(null)
      setRoleResolved(true)
      return
    }
    setRoleResolved(false)
    let active = true
    getCurrentRole().then((r) => {
      if (active) {
        setRole(r)
        setRoleResolved(true)
      }
    })
    return () => {
      active = false
    }
  }, [userId])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const dashboardPath = role === 'org_rep' ? '/dashboard' : '/admin'

  // Shared guard props so the module-level <Guard> knows the current auth state.
  const guardProps = { authReady, session, roleResolved, role }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar isAuthenticated={!!session} dashboardPath={dashboardPath} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/organizations" element={<Directory />} />
        <Route
          path="/login"
          element={session ? <Navigate to={dashboardPath} replace /> : <Login />}
        />
        <Route
          path="/profile"
          element={
            <Guard {...guardProps}>
              <Profile email={session?.user?.email} name={session?.user?.user_metadata?.full_name} />
            </Guard>
          }
        />
        <Route
          path="/admin"
          element={
            <Guard {...guardProps} allow="admin">
              <Admin email={session?.user?.email} />
            </Guard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Guard {...guardProps} allow="org_rep">
              <OrgRepDashboard />
            </Guard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
