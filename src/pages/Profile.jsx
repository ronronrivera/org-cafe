import { useState } from 'react'
import { Mail, KeyRound, UserRound } from 'lucide-react'
import {
  updateEmail as apiUpdateEmail,
  updatePassword as apiUpdatePassword,
  updateName as apiUpdateName,
} from '../lib/auth'

// Account settings — name, email and password changes go through Supabase Auth.
const Profile = ({ email, name }) => {
  const [fullName, setFullName] = useState(name ?? '')
  const [newEmail, setNewEmail] = useState(email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState(null) // { type: 'success' | 'error', text }
  const [loading, setLoading] = useState(false)

  const field =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

  const updateFullName = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { error } = await apiUpdateName(fullName)
    setLoading(false)
    setMsg(error ? { type: 'error', text: error } : { type: 'success', text: 'Name updated.' })
  }

  const updateEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { error } = await apiUpdateEmail(newEmail)
    setLoading(false)
    setMsg(
      error
        ? { type: 'error', text: error }
        : { type: 'success', text: 'Email change requested — check your inbox to confirm.' },
    )
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!currentPassword) {
      setMsg({ type: 'error', text: 'Enter your current password.' })
      return
    }
    if (password.length < 6) {
      setMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (password !== confirm) {
      setMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    const { error } = await apiUpdatePassword(currentPassword, password)
    setLoading(false)
    if (!error) {
      setCurrentPassword('')
      setPassword('')
      setConfirm('')
    }
    setMsg(error ? { type: 'error', text: error } : { type: 'success', text: 'Password updated.' })
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="animate-fade-in-up text-2xl font-bold text-slate-800">Profile</h1>
      <p className="animate-fade-in-up text-sm text-slate-500">Manage your account credentials.</p>

      {msg && (
        <p
          className={
            'mt-4 rounded-lg px-3 py-2 text-sm ' +
            (msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')
          }
        >
          {msg.text}
        </p>
      )}

      {/* Change name */}
      <section className="mt-6 animate-fade-in-up rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <UserRound className="h-5 w-5 text-emerald-700" /> Personal Details
        </h2>
        <form onSubmit={updateFullName} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input
              className={field + ' mt-1'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
          >
            Update Name
          </button>
        </form>
      </section>

      {/* Change email */}
      <section className="mt-6 animate-fade-in-up rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Mail className="h-5 w-5 text-emerald-700" /> Change Email
        </h2>
        <form onSubmit={updateEmail} className="mt-4 space-y-4">
          <input
            type="email"
            className={field}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
          >
            Update Email
          </button>
        </form>
      </section>

      {/* Change password */}
      <section
        className="mt-6 animate-fade-in-up rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        style={{ animationDelay: '100ms' }}
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <KeyRound className="h-5 w-5 text-emerald-700" /> Change Password
        </h2>
        <form onSubmit={updatePassword} className="mt-4 space-y-4">
          <input
            type="password"
            className={field}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
          />
          <input
            type="password"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
          />
          <input
            type="password"
            className={field}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
          >
            Update Password
          </button>
        </form>
      </section>
    </main>
  )
}

export default Profile
