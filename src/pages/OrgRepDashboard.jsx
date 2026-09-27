import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, ImagePlus, SquarePen, LayoutTemplate, ExternalLink } from 'lucide-react'
import OrganizationCard from '../components/OrganizationCard'
import { getMyOrganization, updateOrganization } from '../lib/organizations'
import { slugify } from '../lib/slug'

const TABS = [
  { id: 'card', label: 'Organization Card', icon: SquarePen },
  { id: 'builder', label: 'Page Builder', icon: LayoutTemplate },
]

const OrgRepDashboard = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('card')
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [form, setForm] = useState({ org_name: '', description: '', fb_page_link: '' })
  const [logoFile, setLogoFile] = useState(null)
  const [bgFile, setBgFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await getMyOrganization()
      if (!active) return
      if (data) {
        setOrg(data)
        setForm({
          org_name: data.org_name ?? '',
          description: data.description ?? '',
          fb_page_link: data.fb_page_link ?? '',
        })
      }
      setLoadError(error)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // Live preview URLs for newly-picked images.
  const logoUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile])
  const bgUrl = useMemo(() => (bgFile ? URL.createObjectURL(bgFile) : null), [bgFile])
  useEffect(() => () => logoUrl && URL.revokeObjectURL(logoUrl), [logoUrl])
  useEffect(() => () => bgUrl && URL.revokeObjectURL(bgUrl), [bgUrl])

  const previewOrg = {
    ...org,
    ...form,
    category_name: org?.org_categories?.category_name,
    logo: logoUrl || org?.logo,
    background_image: bgUrl || org?.background_image,
    fb_page_link: form.fb_page_link || '#',
    join_form_link: org?.join_form_link || '#',
  }

  const save = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!form.org_name.trim()) {
      setMsg({ type: 'error', text: 'Organization name is required.' })
      return
    }
    setSaving(true)
    const { data, error } = await updateOrganization(org.org_id, form, {
      logoFile,
      backgroundFile: bgFile,
    })
    setSaving(false)
    if (error) {
      setMsg({ type: 'error', text: error })
      return
    }
    setOrg(data)
    setLogoFile(null)
    setBgFile(null)
    setMsg({ type: 'success', text: 'Changes saved.' })
  }

  const field =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  const fileInput =
    'mt-1 block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100'

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="animate-fade-in-up text-2xl font-bold text-slate-800">My Organization</h1>
      <p className="animate-fade-in-up text-sm text-slate-500">
        Manage how your organization appears to students.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ' +
              (tab === id
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700')
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Page Builder — live preview of the org's public page */}
      {tab === 'builder' && (
        <div key="builder" className="mt-8 animate-fade-in-up">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : loadError || !org ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {loadError || 'No organization found.'}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <LayoutTemplate className="h-5 w-5 text-emerald-700" /> Your Page
                  </h2>
                  <p className="text-sm text-slate-500">A live preview of your public organization page.</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/org/${slugify(org.org_name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" /> View as
                  </a>
                  <button
                    onClick={() => navigate('/dashboard/builder')}
                    className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
                  >
                    <SquarePen className="h-4 w-4" /> Edit Page
                  </button>
                </div>
              </div>

              {/* Live preview — scroll inside to see the whole page */}
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                <iframe
                  title="Page preview"
                  src={`/org/${slugify(org.org_name || '')}`}
                  className="w-full"
                  style={{ height: 560, border: 0, display: 'block' }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-slate-400">Scroll inside the preview to see the whole page.</p>

              <p className="mt-4 text-center text-xs text-slate-400">
                Click <span className="font-medium text-slate-500">Edit Page</span> to customize your theme, sections, and content.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Organization Card editor */}
      {tab === 'card' &&
        (loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : loadError ? (
          <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>
        ) : (
          <div key="card" className="mt-8 grid animate-fade-in-up grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Editor */}
          <form onSubmit={save} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {msg && (
              <p
                className={
                  'rounded-lg px-3 py-2 text-sm ' +
                  (msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')
                }
              >
                {msg.text}
              </p>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Organization name</span>
              <input
                className={field + ' mt-1'}
                value={form.org_name}
                onChange={(e) => setForm({ ...form, org_name: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                rows={4}
                className={field + ' mt-1 resize-none'}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>

          {/* Live preview */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Public preview</p>
            <OrganizationCard org={previewOrg} />
          </div>
          </div>
        ))}
    </main>
  )
}

export default OrgRepDashboard
