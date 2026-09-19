import { useState } from 'react'
import { Landmark, User, Eye, EyeOff } from 'lucide-react'
import { signInAsAdmin } from '../lib/auth'

// Both roles authenticate through Supabase Auth (SRS §3.3, §3.4). This is the
// design shell; the submit handler is wired to real auth in a later step.
const ROLES = [
  { id: 'org_rep', label: 'Organization Representative' },
  { id: 'admin', label: 'Administrator' },
]

const Login = () => {
  const [role, setRole] = useState('org_rep')
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isOrgRep = role === 'org_rep'
  const identifierLabel = isOrgRep ? 'Organization ID / Email' : 'Email'
  const identifierPlaceholder = isOrgRep ? 'Enter your organization ID' : 'Enter your email'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isOrgRep) {
      // org_rep auth is wired in a later step.
      setError('Organization representative login is not available yet.')
      return
    }

    setLoading(true)
    const { error: authError } = await signInAsAdmin(identifier, password)
    setLoading(false)

    if (authError) {
      setError(authError)
      return
    }
    // TODO: route to the admin control hub once it exists.
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_0_60px_rgba(0,0,0,0.28)]">
        {/* Card header */}
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <Landmark className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your organization</p>
        </div>

        {/* Role toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={
                'rounded-md px-3 py-2 text-sm font-medium transition ' +
                (role === r.id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800')
              }
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {identifierLabel}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierPlaceholder}
                className="w-full bg-transparent py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="shrink-0 text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-700 accent-emerald-700" />
              Remember me
            </label>
            <a href="#" className="text-sm font-medium text-emerald-700 hover:underline">
              Forgot password?
            </a>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-800 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Organization Website — Local Council Organization Management System
        </p>
      </div>
    </div>
  )
}

export default Login
