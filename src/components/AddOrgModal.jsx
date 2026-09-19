import { useEffect, useMemo, useState } from 'react'
import { X, ArrowLeft, ArrowRight, Plus, Loader2, ImagePlus, Copy, Check, KeyRound } from 'lucide-react'
import OrganizationCard from './OrganizationCard'
import { createOrganization } from '../lib/organizations'
import { createOrgRep } from '../lib/orgReps'

const EMPTY = {
  org_name: '',
  description: '',
  category_id: '',
  fb_page_link: '',
  rep_full_name: '',
  rep_email: '',
}

// Wizard steps. The last one is a live preview of the public card.
const STEPS = ['Name', 'Description', 'Category', 'Representative', 'Preview & media']

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

const AddOrgModal = ({ categories = [], onClose, onCreated }) => {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [logoFile, setLogoFile] = useState(null)
  const [bgFile, setBgFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { org, credentials, repError }
  const [copied, setCopied] = useState(false)

  // Object URLs for live preview (revoked on change/unmount to avoid leaks).
  const logoUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile])
  const bgUrl = useMemo(() => (bgFile ? URL.createObjectURL(bgFile) : null), [bgFile])
  useEffect(() => () => logoUrl && URL.revokeObjectURL(logoUrl), [logoUrl])
  useEffect(() => () => bgUrl && URL.revokeObjectURL(bgUrl), [bgUrl])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const categoryName = categories.find((c) => String(c.category_id) === String(form.category_id))?.category_name

  const previewOrg = {
    org_name: form.org_name,
    description: form.description,
    category_name: categoryName,
    fb_page_link: form.fb_page_link || '#',
    join_form_link: '#', // org_reps set the join form later
    logo: logoUrl,
    background_image: bgUrl,
  }

  const isLast = step === STEPS.length - 1
  const canNext =
    (step !== 0 || form.org_name.trim().length > 0) &&
    (step !== 3 || (form.rep_full_name.trim().length > 0 && isValidEmail(form.rep_email)))

  const next = () => {
    if (step === 0 && !form.org_name.trim()) {
      setError('Organization name is required.')
      return
    }
    if (step === 3) {
      if (!form.rep_full_name.trim()) return setError("Enter the representative's full name.")
      if (!isValidEmail(form.rep_email)) return setError('Enter a valid representative email.')
    }
    setError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const back = () => {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)

    // 1. Create the organization.
    const { data: org, error: orgErr } = await createOrganization({
      ...form,
      logoFile,
      backgroundFile: bgFile,
    })
    if (orgErr && !org) {
      setSubmitting(false)
      setError(orgErr)
      return
    }

    // 2. Create the org_rep account (Edge Function). If this fails, the org
    // still exists — surface a warning so the admin can retry the rep later.
    const { data: creds, error: repErr } = await createOrgRep({
      org_id: org.org_id,
      full_name: form.rep_full_name,
      email: form.rep_email,
    })
    setSubmitting(false)

    setResult({ org, credentials: creds, repError: repErr || orgErr })
  }

  const copyCreds = async () => {
    if (!result?.credentials) return
    await navigator.clipboard.writeText(
      `Email: ${result.credentials.email}\nPassword: ${result.credentials.password}`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const finish = () => {
    onCreated(result.org, result.repError)
  }

  const field =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  const fileInput =
    'mt-1 block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {result ? (
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-6 w-6" />
              </span>
              <h2 className="mt-3 text-lg font-semibold text-slate-800">Organization created</h2>
              <p className="mt-1 text-sm text-slate-500">“{result.org.org_name}” was added.</p>
            </div>

            {result.credentials ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <KeyRound className="h-4 w-4" /> Representative login credentials
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  Save these now — the password won't be shown again.
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">Email</span>
                    <span className="font-mono text-slate-800">{result.credentials.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">Password</span>
                    <span className="font-mono text-slate-800">{result.credentials.password}</span>
                  </div>
                </div>
                <button
                  onClick={copyCreds}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>

                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Tell the representative to <strong>change this password immediately</strong> after
                  their first login (Profile → Change Password).
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Organization created, but the representative account failed: {result.repError}. You can
                add the rep later.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={finish}
                className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* Header + progress */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Add Organization</h2>
            <p className="text-xs text-slate-400">
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 px-6 pt-4">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={'h-1.5 flex-1 rounded-full transition ' + (i <= step ? 'bg-emerald-600' : 'bg-slate-200')}
            />
          ))}
        </div>

        {/* Step body (animates on change) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div key={step} className="animate-fade-in-up">
            {step === 0 && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">What's the organization name?</span>
                <input
                  autoFocus
                  className={field + ' mt-2'}
                  placeholder="e.g. Computer Science Society"
                  value={form.org_name}
                  onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                />
              </label>
            )}

            {step === 1 && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Describe the organization</span>
                <textarea
                  autoFocus
                  rows={5}
                  className={field + ' mt-2 resize-none'}
                  placeholder="What is this organization about?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            )}

            {step === 2 && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Choose a category</span>
                <select
                  className={field + ' mt-2'}
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">{categories.length ? 'No category' : 'No categories yet'}</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  The representative logs in with this email and an auto-generated password
                  (shown once after you create the organization).
                </p>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Representative full name</span>
                  <input
                    autoFocus
                    className={field + ' mt-1'}
                    placeholder="e.g. Juan Dela Cruz"
                    value={form.rep_full_name}
                    onChange={(e) => setForm({ ...form, rep_full_name: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Representative email (login)</span>
                  <input
                    type="email"
                    className={field + ' mt-1'}
                    placeholder="rep@example.com"
                    value={form.rep_email}
                    onChange={(e) => setForm({ ...form, rep_email: e.target.value })}
                  />
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Live preview */}
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">How students will see it</p>
                  <OrganizationCard org={previewOrg} />
                </div>

                {/* Media + link inputs */}
                <div className="space-y-4">
                  <label className="block text-sm text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <ImagePlus className="h-4 w-4" /> Profile photo (logo)
                    </span>
                    <input type="file" accept="image/*" className={fileInput} onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <label className="block text-sm text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <ImagePlus className="h-4 w-4" /> Background image
                    </span>
                    <input type="file" accept="image/*" className={fileInput} onChange={(e) => setBgFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Facebook page link</span>
                    <input
                      className={field + ' mt-1'}
                      placeholder="https://facebook.com/..."
                      value={form.fb_page_link}
                      onChange={(e) => setForm({ ...form, fb_page_link: e.target.value })}
                    />
                  </label>
                  <p className="text-xs text-slate-400">
                    The join form link is set later by the organization's representative.
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={back}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {isLast ? (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting ? 'Creating…' : 'Create Organization'}
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!canNext}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-40"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}

export default AddOrgModal
