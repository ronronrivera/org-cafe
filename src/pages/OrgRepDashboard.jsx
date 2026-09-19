import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save, ImagePlus, SquarePen, LayoutTemplate, Sparkles } from 'lucide-react'
import OrganizationCard from '../components/OrganizationCard'
import { getMyOrganization, updateOrganization } from '../lib/organizations'

const TABS = [
  { id: 'card', label: 'Organization Card', icon: SquarePen },
  { id: 'builder', label: 'Page Builder', icon: LayoutTemplate },
]

const OrgRepDashboard = () => {
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

      {/* Page Builder — prototype placeholder (not implemented yet) */}
      {tab === 'builder' && (
        <div key="builder" className="mt-8 animate-fade-in-up">
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white">
              <LayoutTemplate className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-800">Page Builder</h2>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <Sparkles className="h-3.5 w-3.5" /> Coming soon
            </span>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500">
              Design your own organization page — drag-and-drop sections, pick a theme, add posts,
              events, media, and announcements. This is a planned feature; the interface below is a
              placeholder while we design it.
            </p>

            {/* Wireframe mockup */}
            <div className="mx-auto mt-8 max-w-lg space-y-3 text-left opacity-60">
              <div className="h-24 rounded-lg bg-slate-100" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-16 rounded-lg bg-slate-100" />
                <div className="h-16 rounded-lg bg-slate-100" />
                <div className="h-16 rounded-lg bg-slate-100" />
              </div>
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>

            <button
              disabled
              className="mt-8 cursor-not-allowed rounded-lg bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-400"
            >
              Start Building
            </button>
          </div>
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
