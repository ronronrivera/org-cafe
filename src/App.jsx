import { useState } from 'react'
import Navbar from './components/Navbar'
import Directory from './pages/Directory'
import Login from './pages/Login'

// Lightweight view switch until a real router is added.
const App = () => {
  const [page, setPage] = useState('directory')

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        active={page === 'login' ? '' : 'Organizations List'}
        onNavigate={setPage}
      />
      {page === 'login' ? <Login /> : <Directory />}
    </div>
  )
}

export default App
