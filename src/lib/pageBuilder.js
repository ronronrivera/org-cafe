import { supabase } from './supabaseClient'

export const PRESET_COLORS = ['#059669', '#0d9488', '#2563eb', '#4f46e5', '#c026d3', '#e11d48', '#ea580c', '#0f172a', '#ffffff']
export const CANVAS_W = 900

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2))

// ---- Component blocks (pre-built, picked from a library; devs add new ones) ----
export const COMPONENTS = {
  header: { label: 'Header / Nav', defaults: { title: 'Organization', logo: '', links: [{ label: 'Home', href: '#' }, { label: 'About', href: '#' }], bg: '#0f766e', color: '#ffffff' } },
  hero: { label: 'Hero', defaults: { heading: 'Welcome', subheading: 'Your organization tagline', buttonLabel: 'Learn more', buttonHref: '#', align: 'center', bgColor: '#0f766e', color: '#ffffff', image: '', overlay: 35, height: 380 } },
  text: { label: 'Text', defaults: { heading: 'Section title', body: 'Write something here…', align: 'left', color: '#0f172a', bodyColor: '#475569' } },
  cta: { label: 'Call to action', defaults: { text: 'Ready to join us?', buttonLabel: 'Join now', buttonHref: '#', bg: '#059669', color: '#ffffff' } },
  cardgrid: { label: 'Card grid', defaults: { title: '', columns: 3, cards: [{ image: '', title: 'Card', text: 'Description' }, { image: '', title: 'Card', text: 'Description' }, { image: '', title: 'Card', text: 'Description' }] } },
  gallery: { label: 'Gallery', defaults: { images: [], columns: 3 } },
  carousel: { label: 'Carousel', defaults: { images: [], height: 360, interval: 3500, rounded: 16 } },
  footer: { label: 'Footer', defaults: { text: '© 2026 Organization', links: [{ label: 'Facebook', href: '#' }], bg: '#0f172a', color: '#e2e8f0' } },
}
export const newComponentSection = (component) => ({
  id: uid(),
  kind: 'component',
  component,
  props: { ...(COMPONENTS[component]?.defaults ?? {}) },
})

// A freeform (Canva-style) design section.
export const newCanvasSection = (height = 600) => ({
  id: uid(),
  kind: 'canvas',
  height,
  background: { type: 'color', color: '#ffffff', image: null },
  elements: [],
})

export const newPage = () => ({ id: uid(), width: CANVAS_W, sections: [newCanvasSection()] })

export const defaultConfig = () => ({
  version: 4,
  accent: '#059669',
  background: { type: 'color', color: '#e2e8f0', image: null }, // backdrop behind the pages
  pages: [
    {
      id: uid(),
      width: CANVAS_W,
      sections: [
        {
          ...newCanvasSection(1100),
          elements: [
            { id: uid(), type: 'heading', x: 80, y: 70, w: 620, content: 'Your Organization', style: { fontSize: 46, color: '#0f172a', bold: true, align: 'left' } },
            { id: uid(), type: 'text', x: 80, y: 150, w: 620, content: 'Drag anything anywhere. Add text, buttons, images, and videos.', style: { fontSize: 18, color: '#475569', bold: false, align: 'left' } },
          ],
        },
      ],
    },
  ],
})

export const newElement = (type, accent = '#059669') => {
  const base = { id: uid(), x: 120, y: 120 }
  switch (type) {
    case 'heading':
      return { ...base, type, w: 500, content: 'Heading', style: { fontSize: 36, color: accent, bold: true, align: 'left' } }
    case 'text':
      return { ...base, type, w: 500, content: 'Your text here…', style: { fontSize: 18, color: '#334155', bold: false, align: 'left' } }
    case 'button':
      return { ...base, type, w: 180, h: 46, content: 'Button', href: '', style: { fontSize: 16, color: '#ffffff', bg: accent, radius: 10, align: 'center' } }
    case 'image':
      return { ...base, type, w: 260, content: '', style: { radius: 12 } }
    case 'video':
      return { ...base, type, w: 400, content: '', style: { radius: 12 } } // content = file URL or YouTube link
    case 'shape':
      return { ...base, type, shape: 'rect', w: 160, h: 120, style: { bg: accent, radius: 8 } }
    default:
      return { ...base, type: 'text', w: 400, content: 'Text', style: { fontSize: 18, color: '#334155', bold: false, align: 'left' } }
  }
}

export const seedConfigFromOrg = (org = {}) => {
  const c = defaultConfig()
  const accent = c.accent
  const els = []
  let y = 60
  if (org.logo) {
    els.push({ id: uid(), type: 'image', x: 80, y, w: 96, content: org.logo, style: { radius: 16 } })
    y += 120
  }
  els.push({ id: uid(), type: 'heading', x: 80, y, w: 700, content: org.org_name || 'Organization', style: { fontSize: 46, color: '#0f172a', bold: true, align: 'left' } })
  y += 80
  if (org.description) {
    els.push({ id: uid(), type: 'text', x: 80, y, w: 640, content: org.description, style: { fontSize: 18, color: '#475569', bold: false, align: 'left' } })
    y += 120
  }
  if (org.fb_page_link) {
    els.push({ id: uid(), type: 'button', x: 80, y, w: 190, content: 'Facebook Page', href: org.fb_page_link, style: { fontSize: 16, color: '#ffffff', bg: accent, radius: 10, align: 'center' } })
  }
  c.pages[0].sections[0].elements = els
  return c
}

const normalizeSection = (s) => {
  if (s?.kind === 'component') {
    return { id: s.id || uid(), kind: 'component', component: s.component, props: { ...(COMPONENTS[s.component]?.defaults ?? {}), ...(s.props ?? {}) } }
  }
  return {
    id: s?.id || uid(),
    kind: 'canvas',
    height: Number(s?.height) || 600,
    background: { type: 'color', color: '#ffffff', image: null, ...(s?.background ?? {}) },
    elements: Array.isArray(s?.elements) ? s.elements : [],
  }
}

const normalizePage = (p, fallbackW) => {
  // v4 page (has sections) or migrate a v3 page (has elements) into one canvas section.
  const sections = Array.isArray(p.sections)
    ? p.sections.map(normalizeSection)
    : [normalizeSection({ id: uid(), kind: 'canvas', height: p.height, background: p.background, elements: p.elements })]
  return { id: p.id || uid(), width: Number(p.width) || fallbackW || CANVAS_W, sections: sections.length ? sections : [newCanvasSection()] }
}

export const normalizeConfig = (config) => {
  const d = defaultConfig()
  if (!config) return d
  if (Array.isArray(config.pages)) {
    return {
      version: 4,
      accent: config.accent || d.accent,
      background: { ...d.background, ...(config.background ?? {}) },
      pages: config.pages.length ? config.pages.map((p) => normalizePage(p, Number(config.width))) : d.pages,
    }
  }
  // very old v2 — single { page, elements } → one page, one canvas section
  if (Array.isArray(config.elements)) {
    return {
      version: 4,
      accent: config.page?.accent || d.accent,
      background: { ...d.background },
      pages: [normalizePage({ width: config.page?.width, height: config.page?.height, background: config.page?.background, elements: config.elements })],
    }
  }
  return d
}

// Return a YouTube/Vimeo embed URL, or null if `url` is a direct video file.
export const getEmbedUrl = (url = '') => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export async function getPageLayout(orgId) {
  const { data, error } = await supabase.from('page_layouts').select('config').eq('org_id', orgId).maybeSingle()
  if (error) return { config: null, error: error.message }
  return { config: data?.config ?? null, error: null }
}

export async function savePageLayout(orgId, config) {
  const { error } = await supabase.from('page_layouts').upsert({ org_id: orgId, config }, { onConflict: 'org_id' })
  return { error: error?.message ?? null }
}
