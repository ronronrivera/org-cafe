import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Directory from './pages/Directory'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import { supabase } from './lib/supabaseClient'
import { getCurrentRole, signOut } from './lib/auth'

// Lightweight view switch until a real router is added.
const App = () => {
  const [page, setPage] = useState('home')
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)

  // Supabase auth state is the source of truth for whether someone is logged in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Resolve the role (admin / org_rep) whenever the session changes.
  useEffect(() => {
    if (!session) {
      setRole(null)
      return
    }
    getCurrentRole().then(setRole)
  }, [session])

  const handleLogout = async () => {
    await signOut()
    setPage('directory')
  }

  const renderPage = () => {
    if (page === 'login') return <Login onSuccess={() => setPage('admin')} />
    if (page === 'admin') return <Admin email={session?.user?.email} />
    if (page === 'profile') return <Profile email={session?.user?.email} />
    if (page === 'directory') return <Directory />
    return <Home onNavigate={setPage} />
  }

  const activeNav =
    page === 'home'
      ? 'Home'
      : page === 'directory'
        ? 'Organizations List'
        : page === 'admin'
          ? 'Dashboard'
          : ''

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        active={activeNav}
        isAuthenticated={!!session}
        onNavigate={setPage}
        onLogout={handleLogout}
      />
      {renderPage()}
    </div>
  )
}

export default App
