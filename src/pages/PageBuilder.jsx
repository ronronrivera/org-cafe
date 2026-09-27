import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, ExternalLink, Loader2, Type, Heading1, Square, Image as ImageIcon, Film,
  Palette, Copy, ClipboardPaste, CopyPlus, Trash2, Bold, AlignLeft, AlignCenter, AlignRight, Plus,
  Undo2, Redo2, Move, Pen, Circle, Triangle, LayoutGrid, ChevronUp, ChevronDown, GalleryHorizontal, PanelTop,
  PanelBottom, Sparkles, Megaphone, Images,
} from 'lucide-react'

const COMPONENT_ICONS = { header: PanelTop, hero: Sparkles, text: Type, cta: Megaphone, cardgrid: LayoutGrid, gallery: Images, carousel: GalleryHorizontal, footer: PanelBottom }
import CanvasElement from '../components/CanvasElement'
import Block from '../components/blocks/Block'
import ComponentProps from '../components/blocks/ComponentProps'
import { getMyOrganization, uploadImage } from '../lib/organizations'
import {
  getPageLayout, savePageLayout, normalizeConfig, seedConfigFromOrg, newElement,
  newPage, newCanvasSection, newComponentSection, PRESET_COLORS, CANVAS_W, COMPONENTS,
} from '../lib/pageBuilder'
import { slugify } from '../lib/slug'

const clampEl = (el, W, H) => {
  const w = Math.min(el.w, W)
  const patch = { ...el, w: Math.max(40, Math.round(w)), x: Math.max(0, Math.min(W - Math.min(el.w, W), Math.round(el.x))) }
  if (typeof el.h === 'number') {
    patch.h = Math.min(el.h, H)
    patch.y = Math.max(0, Math.min(H - patch.h, Math.round(el.y)))
  } else {
    patch.y = Math.max(0, Math.round(el.y))
  }
  return patch
}

const PageBuilder = () => {
  const navigate = useNavigate()
  const dragRef = useRef(null)
  const mainRef = useRef(null)
  const resizeRef = useRef(null)
  const widthRef = useRef(null)
  const drawRef = useRef(null)

  const [org, setOrg] = useState(null)
  const [config, setConfig] = useState(null)
  const [current, setCurrent] = useState(0)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [selectedId, setSelectedId] = useState(null) // element id
  const [selectedSectionId, setSelectedSectionId] = useState(null) // component section id
  const [clipboard, setClipboard] = useState(null)
  const [menu, setMenu] = useState(null)
  const [tab, setTab] = useState('text')
  const [tool, setTool] = useState('select')
  const [penColor, setPenColor] = useState('#111827')
  const [penWidth, setPenWidth] = useState(4)
  const [drawPreview, setDrawPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)

  // history
  const historyRef = useRef([])
  const futureRef = useRef([])
  const lastCommitRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: o, error } = await getMyOrganization()
      if (!active) return
      if (error || !o) { setLoadError(error || 'No organization found.'); setLoading(false); return }
      setOrg(o)
      const { config: saved } = await getPageLayout(o.org_id)
      if (!active) return
      const cfg = saved ? normalizeConfig(saved) : seedConfigFromOrg(o)
      setConfig(cfg)
      const firstCanvas = cfg.pages[0].sections.find((s) => s.kind === 'canvas')
      setActiveSectionId(firstCanvas?.id ?? cfg.pages[0].sections[0]?.id ?? null)
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  // ---- history ----
  const snapshot = (coalesce = false) => {
    if (!config) return
    const now = Date.now()
    if (coalesce && now - lastCommitRef.current < 500) return
    const hist = historyRef.current
    if (hist.length && hist[hist.length - 1] === config) return
    lastCommitRef.current = now
    historyRef.current = [...hist, config].slice(-60)
    futureRef.current = []
    setCanUndo(true); setCanRedo(false)
  }
  const undo = () => {
    const hist = historyRef.current
    if (!hist.length) return
    futureRef.current = [...futureRef.current, config]
    historyRef.current = hist.slice(0, -1)
    setConfig(hist[hist.length - 1])
    setSelectedId(null); setSelectedSectionId(null); setMenu(null)
    setCanUndo(historyRef.current.length > 0); setCanRedo(true)
  }
  const redo = () => {
    const fut = futureRef.current
    if (!fut.length) return
    historyRef.current = [...historyRef.current, config]
    futureRef.current = fut.slice(0, -1)
    setConfig(fut[fut.length - 1])
    setSelectedId(null); setSelectedSectionId(null); setMenu(null)
    setCanRedo(futureRef.current.length > 0); setCanUndo(true)
  }

  // ---- element ops (id-based across all canvas sections) ----
  const mapAllElements = (fn) =>
    setConfig((c) => ({
      ...c,
      pages: c.pages.map((p) => ({
        ...p,
        sections: p.sections.map((s) => (s.kind === 'canvas' ? { ...s, elements: fn(s.elements, p, s) } : s)),
      })),
    }))
  const updateEl = (id, patch) => { snapshot(true); mapAllElements((els) => els.map((e) => (e.id === id ? { ...e, ...patch } : e))) }
  const updateStyle = (id, patch) => { snapshot(true); mapAllElements((els) => els.map((e) => (e.id === id ? { ...e, style: { ...e.style, ...patch } } : e))) }
  const deleteEl = (id) => { snapshot(); mapAllElements((els) => els.filter((e) => e.id !== id)); setSelectedId((s) => (s === id ? null : s)) }

  const activeCanvasId = () => {
    const p = config.pages[current]
    const active = p.sections.find((s) => s.id === activeSectionId && s.kind === 'canvas')
    return (active || p.sections.find((s) => s.kind === 'canvas'))?.id ?? null
  }
  const addToSection = (el) => {
    const secId = activeCanvasId()
    if (!secId) return
    snapshot()
    setConfig((c) => ({
      ...c,
      pages: c.pages.map((p, pi) => (pi === current ? {
        ...p,
        sections: p.sections.map((s) => (s.id === secId ? { ...s, elements: [...s.elements, clampEl(el, p.width, s.height)] } : s)),
      } : p)),
    }))
    setSelectedId(el.id); setSelectedSectionId(null)
  }
  const addEl = (type) => addToSection(newElement(type, config.accent))
  const addShape = (shape) => addToSection({ ...newElement('shape', config.accent), shape })
  const duplicateEl = (id) => {
    const el = config.pages.flatMap((p) => p.sections).flatMap((s) => s.elements || []).find((e) => e.id === id)
    if (el) addToSection({ ...el, id: crypto.randomUUID(), x: el.x + 24, y: el.y + 24 })
  }
  const copyEl = (id) => {
    const el = config.pages.flatMap((p) => p.sections).flatMap((s) => s.elements || []).find((e) => e.id === id)
    if (el) setClipboard(el)
  }
  const pasteEl = () => { if (clipboard) addToSection({ ...clipboard, id: crypto.randomUUID(), x: clipboard.x + 24, y: clipboard.y + 24 }) }

  // ---- section ops ----
  const patchSection = (id, fn) => setConfig((c) => ({ ...c, pages: c.pages.map((p, pi) => (pi === current ? { ...p, sections: p.sections.map((s) => (s.id === id ? fn(s) : s)) } : p)) }))
  const patchSectionBg = (id, patch) => { snapshot(true); patchSection(id, (s) => ({ ...s, background: { ...s.background, ...patch } })) }
  const setSectionHeight = (id, h) => { snapshot(true); patchSection(id, (s) => ({ ...s, height: Math.max(120, h) })) }
  const updateComponentProps = (id, patch) => { snapshot(true); patchSection(id, (s) => ({ ...s, props: { ...s.props, ...patch } })) }
  const addSection = (section) => {
    snapshot()
    setConfig((c) => ({ ...c, pages: c.pages.map((p, pi) => (pi === current ? { ...p, sections: [...p.sections, section] } : p)) }))
    setActiveSectionId(section.id)
    if (section.kind === 'component') { setSelectedSectionId(section.id); setSelectedId(null); setTab('design') }
  }
  const deleteSection = (id) => {
    snapshot()
    setConfig((c) => ({ ...c, pages: c.pages.map((p, pi) => (pi === current ? { ...p, sections: p.sections.filter((s) => s.id !== id) } : p)) }))
    setSelectedSectionId((s) => (s === id ? null : s))
    setSelectedId(null)
  }
  const moveSection = (id, dir) => {
    snapshot()
    setConfig((c) => ({
      ...c,
      pages: c.pages.map((p, pi) => {
        if (pi !== current) return p
        const arr = [...p.sections]
        const idx = arr.findIndex((s) => s.id === id)
        const j = idx + dir
        if (idx < 0 || j < 0 || j >= arr.length) return p
        ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
        return { ...p, sections: arr }
      }),
    }))
  }

  // ---- page ops ----
  const addPage = () => { snapshot(); const ni = config.pages.length; setConfig((c) => ({ ...c, pages: [...c.pages, newPage()] })); setCurrent(ni); setSelectedId(null); setSelectedSectionId(null) }
  const deletePage = () => { if (config.pages.length <= 1) return; snapshot(); setConfig((c) => ({ ...c, pages: c.pages.filter((_, i) => i !== current) })); setSelectedId(null); setCurrent((i) => Math.max(0, i - 1)) }

  // ---- drag (pointer capture) ----
  const onElDown = (e, el, sectionId) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    snapshot()
    setActiveSectionId(sectionId)
    setSelectedId(el.id); setSelectedSectionId(null); setMenu(null)
    dragRef.current = { id: el.id, srcSection: sectionId, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, pid: e.pointerId }
  }
  const onElMove = (e) => {
    const d = dragRef.current
    if (!d || d.pid !== e.pointerId) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    mapAllElements((els, p, s) => els.map((el) => (el.id === d.id ? clampEl({ ...el, x: Math.round(d.origX + dx), y: Math.round(d.origY + dy) }, p.width, s.height) : el)))
  }
  const onElUp = (e) => {
    const d = dragRef.current
    if (!d || d.pid !== e.pointerId) return
    dragRef.current = null
    // Reassign to whichever canvas section the element was dropped over.
    setConfig((c) => {
      let el
      c.pages.forEach((p) => p.sections.forEach((s) => { if (s.kind === 'canvas') { const f = s.elements.find((x) => x.id === d.id); if (f) el = f } }))
      const srcRect = document.getElementById(`sec-${d.srcSection}`)?.getBoundingClientRect()
      if (!el || !srcRect) return c
      const absTop = srcRect.top + el.y
      const absLeft = srcRect.left + el.x
      let target = null
      let targetRect = null
      c.pages.forEach((p) => p.sections.forEach((s) => {
        if (s.kind !== 'canvas') return
        const r = document.getElementById(`sec-${s.id}`)?.getBoundingClientRect()
        if (r && absTop >= r.top && absTop <= r.bottom) { target = s; targetRect = r }
      }))
      if (!target || target.id === d.srcSection) return c
      const W = target.width || CANVAS_W
      const moved = clampEl({ ...el, x: Math.round(absLeft - targetRect.left), y: Math.round(absTop - targetRect.top) }, targetRect.width, target.height)
      void W
      return {
        ...c,
        pages: c.pages.map((p) => ({
          ...p,
          sections: p.sections.map((s) => {
            if (s.kind !== 'canvas') return s
            if (s.id === d.srcSection) return { ...s, elements: s.elements.filter((x) => x.id !== d.id) }
            if (s.id === target.id) return { ...s, elements: [...s.elements, moved] }
            return s
          }),
        })),
      }
    })
  }

  // ---- resize element ----
  const onResizeDown = (e, el, corner, sectionId) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    snapshot()
    setActiveSectionId(sectionId)
    resizeRef.current = { id: el.id, corner, startX: e.clientX, startY: e.clientY, origW: el.w, origX: el.x, origH: el.h, origY: el.y, pid: e.pointerId }
  }
  const onResizeMove = (e) => {
    const r = resizeRef.current
    if (!r || r.pid !== e.pointerId) return
    const dx = e.clientX - r.startX
    const dy = e.clientY - r.startY
    mapAllElements((els, p, s) => els.map((el) => {
      if (el.id !== r.id) return el
      const W = p.width; const H = s.height
      let w = r.origW; let x = r.origX
      if (r.corner.includes('e')) w = r.origW + dx
      if (r.corner.includes('w')) { w = r.origW - dx; x = r.origX + dx }
      const patch = {}
      patch.w = Math.min(W, Math.max(40, Math.round(w)))
      patch.x = Math.max(0, Math.min(W - patch.w, Math.round(x)))
      if (typeof r.origH === 'number') {
        let h = r.origH; let y = r.origY
        if (r.corner.includes('s')) h = r.origH + dy
        if (r.corner.includes('n')) { h = r.origH - dy; y = r.origY + dy }
        patch.h = Math.min(H, Math.max(24, Math.round(h)))
        patch.y = Math.max(0, Math.min(H - patch.h, Math.round(y)))
      }
      return { ...el, ...patch }
    }))
  }
  const onResizeUp = (e) => { if (resizeRef.current?.pid === e.pointerId) resizeRef.current = null }

  // ---- page width resize ----
  const maxCanvasWidth = () => Math.max(320, (mainRef.current?.clientWidth || window.innerWidth) - 64)
  const pw = (p) => (Number.isFinite(p?.width) && p.width >= 320 ? p.width : CANVAS_W)
  const onWidthDown = (e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    snapshot()
    widthRef.current = { startX: e.clientX, origW: pw(config.pages[current]), pid: e.pointerId }
  }
  const onWidthMove = (e) => {
    const r = widthRef.current
    if (!r || r.pid !== e.pointerId) return
    const w = Math.max(320, Math.min(maxCanvasWidth(), Math.round(r.origW + (e.clientX - r.startX))))
    setConfig((c) => ({ ...c, pages: c.pages.map((p, i) => (i === current ? { ...p, width: w } : p)) }))
  }
  const onWidthUp = (e) => { if (widthRef.current?.pid === e.pointerId) widthRef.current = null }

  const openMenu = (e, el, sectionId) => { e.preventDefault(); setActiveSectionId(sectionId); setSelectedId(el.id); setSelectedSectionId(null); setMenu({ x: e.clientX, y: e.clientY }) }

  // ---- pen ----
  const onSecDown = (e, section) => {
    setActiveSectionId(section.id)
    if (tool === 'pen') {
      e.stopPropagation()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      const rect = e.currentTarget.getBoundingClientRect()
      drawRef.current = { sectionId: section.id, pid: e.pointerId, pts: [[Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)]] }
      setDrawPreview({ sectionId: section.id, pts: drawRef.current.pts })
    } else { setSelectedId(null); setSelectedSectionId(null); setMenu(null) }
  }
  const onSecMove = (e) => {
    const d = drawRef.current
    if (!d || d.pid !== e.pointerId) return
    const rect = document.getElementById(`sec-${d.sectionId}`).getBoundingClientRect()
    d.pts.push([Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)])
    setDrawPreview({ sectionId: d.sectionId, pts: [...d.pts] })
  }
  const onSecUp = (e) => {
    const d = drawRef.current
    if (!d || d.pid !== e.pointerId) return
    drawRef.current = null; setDrawPreview(null)
    if (d.pts.length < 2) return
    const xs = d.pts.map((p) => p[0]); const ys = d.pts.map((p) => p[1])
    const pad = penWidth
    const x = Math.min(...xs) - pad; const y = Math.min(...ys) - pad
    const w = Math.max(...xs) - Math.min(...xs) + pad * 2; const h = Math.max(...ys) - Math.min(...ys) + pad * 2
    const local = d.pts.map(([px, py]) => [px - x, py - y])
    const el = { id: crypto.randomUUID(), type: 'draw', x, y, w, h, vbW: w, vbH: h, points: local, style: { stroke: penColor, strokeWidth: penWidth } }
    snapshot()
    setConfig((c) => ({ ...c, pages: c.pages.map((p, pi) => (pi === current ? { ...p, sections: p.sections.map((s) => (s.id === d.sectionId ? { ...s, elements: [...s.elements, el] } : s)) } : p)) }))
    setSelectedId(el.id); setTool('select')
  }

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target.tagName
      if (t === 'INPUT' || t === 'TEXTAREA' || e.target.isContentEditable) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
      else if (mod && e.key.toLowerCase() === 'c') selectedId && copyEl(selectedId)
      else if (mod && e.key.toLowerCase() === 'v') pasteEl()
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); selectedId && duplicateEl(selectedId) }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); deleteEl(selectedId) }
      else if (selectedId && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const el = config.pages.flatMap((p) => p.sections).flatMap((s) => s.elements || []).find((x) => x.id === selectedId)
        if (!el) return
        if (e.key === 'ArrowLeft') updateEl(el.id, { x: Math.max(0, el.x - step) })
        if (e.key === 'ArrowRight') updateEl(el.id, { x: el.x + step })
        if (e.key === 'ArrowUp') updateEl(el.id, { y: Math.max(0, el.y - step) })
        if (e.key === 'ArrowDown') updateEl(el.id, { y: el.y + step })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, clipboard, config, current, activeSectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!menu) return; const close = () => setMenu(null); window.addEventListener('click', close); return () => window.removeEventListener('click', close) }, [menu])

  const save = async () => {
    setSaving(true); setMsg(null)
    const { error } = await savePageLayout(org.org_id, config)
    setSaving(false)
    setMsg(error ? { type: 'error', text: error } : { type: 'success', text: 'Design saved.' })
    if (!error) setTimeout(() => setMsg(null), 2500)
  }

  // Generic image upload → calls cb(url). Used by component prop editors.
  const uploadImageFor = async (file, cb) => {
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadImage(org.org_id, file, 'block')
    setUploading(false)
    if (error) return setMsg({ type: 'error', text: error })
    cb(url)
  }

  const uploadMedia = async (file, kind, targetId) => {
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadImage(org.org_id, file, kind)
    setUploading(false)
    if (error) return setMsg({ type: 'error', text: error })
    if (kind === 'backdrop') return setConfig((c) => ({ ...c, background: { type: 'image', image: url, color: c.background?.color } }))
    if (kind === 'secbg') return patchSectionBg(targetId, { type: 'image', image: url })
    if (kind === 'headerlogo') return updateComponentProps(targetId, { logo: url })
    if (kind === 'carousel') {
      snapshot()
      return setConfig((c) => ({ ...c, pages: c.pages.map((p, pi) => (pi === current ? { ...p, sections: p.sections.map((s) => (s.id === targetId ? { ...s, props: { ...s.props, images: [...(s.props.images || []), url] } } : s)) } : p)) }))
    }
    if (targetId && (kind === 'img' || kind === 'vid')) return updateEl(targetId, { content: url })
    addToSection({ ...newElement(kind === 'vid' ? 'video' : 'image', config.accent), content: url })
  }

  if (loading) return <div className="flex h-screen items-center justify-center gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading builder…</div>
  if (loadError) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p className="text-red-600">{loadError}</p>
      <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</button>
    </div>
  )

  const page = config.pages[current]
  const selected = config.pages.flatMap((p) => p.sections).flatMap((s) => s.elements || []).find((e) => e.id === selectedId)
  const selectedSection = page.sections.find((s) => s.id === selectedSectionId && s.kind === 'component')
  const activeSection = page.sections.find((s) => s.id === activeSectionId)
  const slug = slugify(org.org_name || '')
  const backdrop = config.background ?? { type: 'color', color: '#e2e8f0' }
  const backdropStyle = backdrop.type === 'image' && backdrop.image ? { backgroundImage: `url(${backdrop.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: backdrop.color || '#e2e8f0' }

  const label = 'text-xs font-medium text-slate-500'
  const input = 'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  const tabBtn = (id) => 'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ' + (tab === id ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600')
  const toggleBtn = (on) => 'flex-1 rounded-md border px-2 py-1 text-xs font-medium capitalize ' + (on ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600')

  const resizeHandles = (el, sectionId) => {
    const edges = [
      ['e', { right: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }],
      ['w', { left: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }],
      ['n', { top: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }],
      ['s', { bottom: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }],
    ]
    const corners = [
      ['nw', { left: -6, top: -6, cursor: 'nwse-resize' }],
      ['ne', { right: -6, top: -6, cursor: 'nesw-resize' }],
      ['sw', { left: -6, bottom: -6, cursor: 'nesw-resize' }],
      ['se', { right: -6, bottom: -6, cursor: 'nwse-resize' }],
    ]
    const handles = el.type === 'button' ? [edges[2], edges[3]] : [...corners, edges[0], edges[1]]
    return handles.map(([corner, pos]) => (
      <div key={corner} onPointerDown={(e) => onResizeDown(e, el, corner, sectionId)} onPointerMove={onResizeMove} onPointerUp={onResizeUp} className="absolute h-3 w-3 rounded-full border-2 border-blue-500 bg-white" style={{ position: 'absolute', ...pos, touchAction: 'none' }} />
    ))
  }

  const secBgStyle = (s) => s.background?.type === 'image' && s.background.image ? { backgroundImage: `url(${s.background.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: s.background?.color || '#ffffff' }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /> Dashboard</button>
          <span className="text-sm font-semibold text-slate-800">{org.org_name}</span>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className={'text-sm ' + (msg.type === 'success' ? 'text-emerald-600' : 'text-red-600')}>{msg.text}</span>}
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"><Redo2 className="h-4 w-4" /></button>
          <a href={`/org/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><ExternalLink className="h-4 w-4" /> View as public</a>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
        </div>
      </header>

      {/* Page strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-1.5">
        <span className="text-xs font-medium text-slate-400">Pages</span>
        {config.pages.map((p, i) => (
          <button key={p.id} onClick={() => { setCurrent(i); setSelectedId(null); setSelectedSectionId(null); setActiveSectionId(p.sections.find((s) => s.kind === 'canvas')?.id ?? p.sections[0]?.id) }} className={'h-6 w-6 rounded text-xs font-medium transition ' + (i === current ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{i + 1}</button>
        ))}
        <button onClick={addPage} title="Add page" className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
        {config.pages.length > 1 && <button onClick={deletePage} className="ml-2 flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Delete page</button>}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: tools */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex border-b border-slate-200">
            <button onClick={() => setTab('text')} className={tabBtn('text')}><Type className="h-4 w-4" /> Text</button>
            <button onClick={() => setTab('elements')} className={tabBtn('elements')}><Square className="h-4 w-4" /> Elements</button>
            <button onClick={() => setTab('sections')} className={tabBtn('sections')}><LayoutGrid className="h-4 w-4" /> Sections</button>
            <button onClick={() => setTab('design')} className={tabBtn('design')}><Palette className="h-4 w-4" /> Design</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {tab === 'text' && (
              <>
                <button onClick={() => addEl('heading')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"><Heading1 className="h-4 w-4" /> Add heading</button>
                <button onClick={() => addEl('text')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><Type className="h-4 w-4" /> Add text</button>
                <p className="text-[11px] text-slate-400">Added to the active canvas section.</p>
              </>
            )}
            {tab === 'elements' && (
              <>
                <button onClick={() => addEl('button')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><Square className="h-4 w-4" /> Add button</button>
                <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} Add image / GIF<input type="file" accept="image/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'img')} /></label>
                <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />} Add video<input type="file" accept="video/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'vid')} /></label>
                <button onClick={() => addEl('video')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"><Film className="h-4 w-4" /> Add video by URL</button>
                <div>
                  <p className={label}>Shapes</p>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <button onClick={() => addShape('rect')} className="flex items-center justify-center rounded-lg border border-slate-200 py-2 text-slate-600 hover:bg-slate-50"><Square className="h-5 w-5" /></button>
                    <button onClick={() => addShape('ellipse')} className="flex items-center justify-center rounded-lg border border-slate-200 py-2 text-slate-600 hover:bg-slate-50"><Circle className="h-5 w-5" /></button>
                    <button onClick={() => addShape('triangle')} className="flex items-center justify-center rounded-lg border border-slate-200 py-2 text-slate-600 hover:bg-slate-50"><Triangle className="h-5 w-5" /></button>
                  </div>
                </div>
                <div className="mt-1 rounded-lg border border-slate-200 p-2">
                  <button onClick={() => setTool((t) => (t === 'pen' ? 'select' : 'pen'))} className={'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition ' + (tool === 'pen' ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-50')}><Pen className="h-4 w-4" /> {tool === 'pen' ? 'Drawing… (click to stop)' : 'Pen / draw'}</button>
                  {tool === 'pen' && (
                    <div className="mt-2 flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-500">Color <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="h-6 w-6 cursor-pointer rounded border border-slate-300 bg-transparent p-0" /></label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500">Size <input type="number" min="1" max="40" value={penWidth} onChange={(e) => setPenWidth(Math.max(1, Number(e.target.value) || 1))} className="w-14 rounded-md border border-slate-200 px-2 py-1 text-sm" /></label>
                    </div>
                  )}
                </div>
              </>
            )}
            {tab === 'sections' && (
              <>
                <p className={label}>Add a section to this page</p>
                <button onClick={() => addSection(newCanvasSection())} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"><LayoutGrid className="h-4 w-4" /> Canvas (freeform)</button>
                {Object.entries(COMPONENTS).map(([key, c]) => {
                  const Icon = COMPONENT_ICONS[key] || LayoutGrid
                  return (
                    <button key={key} onClick={() => addSection(newComponentSection(key))} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><Icon className="h-4 w-4" /> {c.label}</button>
                  )
                })}
                <p className="pt-2 text-[11px] text-slate-400">Sections stack top-to-bottom. Reorder / delete each from its header on the canvas.</p>
              </>
            )}
            {tab === 'design' && (
              <div className="space-y-4">
                {activeSection?.kind === 'canvas' ? (
                  <div>
                    <p className={label}>Active section background</p>
                    <div className="mt-1 flex gap-2">
                      {['color', 'image'].map((t) => (<button key={t} onClick={() => patchSectionBg(activeSection.id, { type: t })} className={toggleBtn(activeSection.background.type === t)}>{t}</button>))}
                    </div>
                    {activeSection.background.type === 'color' ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {PRESET_COLORS.map((c) => (<button key={c} onClick={() => patchSectionBg(activeSection.id, { color: c })} style={{ backgroundColor: c }} className={'h-6 w-6 rounded-full border border-slate-200 ' + (activeSection.background.color === c ? 'ring-2 ring-slate-800 ring-offset-1' : '')} />))}
                        <input type="color" value={activeSection.background.color || '#ffffff'} onChange={(e) => patchSectionBg(activeSection.id, { color: e.target.value })} className="h-6 w-6 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0" />
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {activeSection.background.image && <img src={activeSection.background.image} alt="" className="h-16 w-full rounded-md object-cover" />}
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}<span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">Upload</span><input type="file" accept="image/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'secbg', activeSection.id)} /></label>
                      </div>
                    )}
                    <label className="mt-3 block"><span className={label}>Section height (px)</span><input type="number" className={input + ' mt-1'} value={activeSection.height} onChange={(e) => setSectionHeight(activeSection.id, Number(e.target.value) || 120)} /></label>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Select a canvas section to edit its background.</p>
                )}

                <label className="block"><span className={label}>Page {current + 1} width (px)</span><input type="number" className={input + ' mt-1'} value={pw(page)} onChange={(e) => { snapshot(true); setConfig((c) => ({ ...c, pages: c.pages.map((p, i) => (i === current ? { ...p, width: Math.max(320, Math.min(maxCanvasWidth(), Number(e.target.value) || 320)) } : p)) })) }} /></label>

                <div className="border-t border-slate-100 pt-3">
                  <p className={label}>Backdrop (behind all pages)</p>
                  <div className="mt-1 flex gap-2">{['color', 'image'].map((t) => (<button key={t} onClick={() => { snapshot(true); setConfig((c) => ({ ...c, background: { ...c.background, type: t } })) }} className={toggleBtn(backdrop.type === t)}>{t}</button>))}</div>
                  {backdrop.type === 'color' ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (<button key={c} onClick={() => { snapshot(true); setConfig((cf) => ({ ...cf, background: { ...cf.background, color: c } })) }} style={{ backgroundColor: c }} className={'h-6 w-6 rounded-full border border-slate-200 ' + (backdrop.color === c ? 'ring-2 ring-slate-800 ring-offset-1' : '')} />))}
                      <input type="color" value={backdrop.color || '#e2e8f0'} onChange={(e) => { snapshot(true); setConfig((cf) => ({ ...cf, background: { ...cf.background, color: e.target.value } })) }} className="h-6 w-6 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0" />
                    </div>
                  ) : (
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}<span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">Upload backdrop</span><input type="file" accept="image/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'backdrop')} /></label>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main ref={mainRef} className="flex-1 overflow-auto p-8" style={backdropStyle}>
          <div className="flex flex-col items-center gap-4" style={{ width: pw(page), marginInline: 'auto' }}>
            {page.sections.map((section, si) => (
              <div key={section.id} className="w-full">
                <div className="flex items-center justify-between px-1 pb-1 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    {section.kind === 'component' ? <GalleryHorizontal className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                    {section.kind === 'component' ? section.component : 'Canvas'} {section.id === activeSectionId && <span className="text-emerald-600">• active</span>}
                  </span>
                  <span className="flex items-center gap-1">
                    <button onClick={() => moveSection(section.id, -1)} disabled={si === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                    <button onClick={() => moveSection(section.id, 1)} disabled={si === page.sections.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                    <button onClick={() => deleteSection(section.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </span>
                </div>

                {section.kind === 'component' ? (
                  <div
                    onPointerDown={() => { setActiveSectionId(section.id); setSelectedSectionId(section.id); setSelectedId(null); setTab('design') }}
                    className={'cursor-pointer ' + (selectedSectionId === section.id ? 'outline outline-2 outline-blue-500' : '')}
                  >
                    <Block section={section} editable />
                  </div>
                ) : (
                  <div
                    id={`sec-${section.id}`}
                    onPointerDown={(e) => onSecDown(e, section)}
                    onPointerMove={onSecMove}
                    onPointerUp={onSecUp}
                    className="relative overflow-hidden shadow-xl"
                    style={{ width: pw(page), height: section.height, outline: section.id === activeSectionId ? '2px solid #10b981' : 'none', outlineOffset: 2, cursor: tool === 'pen' ? 'crosshair' : 'default', ...secBgStyle(section) }}
                  >
                    {section.elements.map((el) => (
                      <div
                        key={el.id}
                        onPointerDown={(e) => onElDown(e, el, section.id)}
                        onPointerMove={onElMove}
                        onPointerUp={onElUp}
                        onContextMenu={(e) => openMenu(e, el, section.id)}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, cursor: 'move', outline: selectedId === el.id ? '2px solid #2563eb' : 'none', outlineOffset: 2, touchAction: 'none', pointerEvents: tool === 'pen' ? 'none' : 'auto' }}
                      >
                        <CanvasElement el={el} editable positioned={false} />
                        {el.type === 'video' && (
                          <div onPointerDown={(e) => onElDown(e, el, section.id)} onPointerMove={onElMove} onPointerUp={onElUp} title="Drag video" className="absolute -left-3 -top-3 z-10 flex h-7 w-7 cursor-move items-center justify-center rounded-full bg-blue-500 text-white shadow" style={{ touchAction: 'none' }}><Move className="h-4 w-4" /></div>
                        )}
                        {selectedId === el.id && resizeHandles(el, section.id)}
                      </div>
                    ))}
                    {drawPreview && drawPreview.sectionId === section.id && (
                      <svg className="pointer-events-none absolute inset-0" width={pw(page)} height={section.height}><polyline points={drawPreview.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={penColor} strokeWidth={penWidth} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="mt-2 h-2 w-16 cursor-ew-resize self-center rounded-full bg-slate-400 hover:bg-slate-500" onPointerDown={onWidthDown} onPointerMove={onWidthMove} onPointerUp={onWidthUp} title="Drag to resize page width" style={{ touchAction: 'none' }} />
          </div>
        </main>

        {/* Right: properties */}
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-3">
          {selectedSection ? (
            <ComponentProps
              section={selectedSection}
              update={(patch) => updateComponentProps(selectedSection.id, patch)}
              onUpload={uploadImageFor}
              uploading={uploading}
            />
          ) : !selected ? (
            <p className="text-sm text-slate-400">Select an element or component to edit it, or add one from the left.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{selected.type}</p>
              {(selected.type === 'text' || selected.type === 'heading') && (
                <>
                  <label className="block"><span className={label}>Content</span><textarea rows={3} className={input + ' mt-1 resize-none'} value={selected.content} onChange={(e) => updateEl(selected.id, { content: e.target.value })} /></label>
                  <div className="flex gap-2">
                    <label className="flex-1"><span className={label}>Font size</span><input type="number" className={input + ' mt-1'} value={selected.style.fontSize} onChange={(e) => updateStyle(selected.id, { fontSize: Number(e.target.value) || 12 })} /></label>
                    <label><span className={label}>Color</span><input type="color" className="mt-1 block h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" value={selected.style.color} onChange={(e) => updateStyle(selected.id, { color: e.target.value })} /></label>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => updateStyle(selected.id, { bold: !selected.style.bold })} className={'rounded-md border p-1.5 ' + (selected.style.bold ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500')}><Bold className="h-4 w-4" /></button>
                    {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([a, Icon]) => (<button key={a} onClick={() => updateStyle(selected.id, { align: a })} className={'rounded-md border p-1.5 ' + (selected.style.align === a ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500')}><Icon className="h-4 w-4" /></button>))}
                  </div>
                </>
              )}
              {selected.type === 'button' && (
                <>
                  <label className="block"><span className={label}>Label</span><input className={input + ' mt-1'} value={selected.content} onChange={(e) => updateEl(selected.id, { content: e.target.value })} /></label>
                  <label className="block"><span className={label}>Link (URL)</span><input className={input + ' mt-1'} value={selected.href || ''} onChange={(e) => updateEl(selected.id, { href: e.target.value })} placeholder="https://facebook.com/..." /></label>
                  <div className="flex gap-2">
                    <label className="flex-1"><span className={label}>Font size</span><input type="number" className={input + ' mt-1'} value={selected.style.fontSize} onChange={(e) => updateStyle(selected.id, { fontSize: Number(e.target.value) || 12 })} /></label>
                    <label><span className={label}>Text</span><input type="color" className="mt-1 block h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" value={selected.style.color} onChange={(e) => updateStyle(selected.id, { color: e.target.value })} /></label>
                    <label><span className={label}>Fill</span><input type="color" className="mt-1 block h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" value={selected.style.bg} onChange={(e) => updateStyle(selected.id, { bg: e.target.value })} /></label>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1"><span className={label}>Height</span><input type="number" className={input + ' mt-1'} value={selected.h ?? 46} onChange={(e) => updateEl(selected.id, { h: Math.max(24, Number(e.target.value) || 24) })} /></label>
                    <label className="flex-1"><span className={label}>Corner radius</span><input type="number" className={input + ' mt-1'} value={selected.style.radius} onChange={(e) => updateStyle(selected.id, { radius: Number(e.target.value) })} /></label>
                  </div>
                </>
              )}
              {selected.type === 'image' && (
                <>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}<span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">Replace image</span><input type="file" accept="image/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'img', selected.id)} /></label>
                  <label className="block"><span className={label}>Corner radius</span><input type="number" className={input + ' mt-1'} value={selected.style.radius} onChange={(e) => updateStyle(selected.id, { radius: Number(e.target.value) })} /></label>
                </>
              )}
              {selected.type === 'video' && (
                <>
                  <label className="block"><span className={label}>Video URL</span><input className={input + ' mt-1'} value={selected.content} onChange={(e) => updateEl(selected.id, { content: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}<span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">Upload video</span><input type="file" accept="video/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'vid', selected.id)} /></label>
                  <label className="block"><span className={label}>Corner radius</span><input type="number" className={input + ' mt-1'} value={selected.style.radius} onChange={(e) => updateStyle(selected.id, { radius: Number(e.target.value) })} /></label>
                </>
              )}
              {selected.type === 'shape' && (
                <div className="flex gap-2">
                  <label><span className={label}>Fill</span><input type="color" className="mt-1 block h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" value={selected.style.bg} onChange={(e) => updateStyle(selected.id, { bg: e.target.value })} /></label>
                  {selected.shape !== 'triangle' && selected.shape !== 'ellipse' && (<label className="flex-1"><span className={label}>Corner radius</span><input type="number" className={input + ' mt-1'} value={selected.style.radius} onChange={(e) => updateStyle(selected.id, { radius: Number(e.target.value) })} /></label>)}
                </div>
              )}
              {selected.type === 'draw' && (
                <div className="flex gap-2">
                  <label><span className={label}>Stroke</span><input type="color" className="mt-1 block h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" value={selected.style.stroke} onChange={(e) => updateStyle(selected.id, { stroke: e.target.value })} /></label>
                  <label className="flex-1"><span className={label}>Thickness</span><input type="number" className={input + ' mt-1'} value={selected.style.strokeWidth} onChange={(e) => updateStyle(selected.id, { strokeWidth: Math.max(1, Number(e.target.value) || 1) })} /></label>
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex-1"><span className={label}>Width</span><input type="number" className={input + ' mt-1'} value={selected.w} onChange={(e) => updateEl(selected.id, { w: Math.max(40, Number(e.target.value) || 40) })} /></label>
                <label className="flex-1"><span className={label}>X</span><input type="number" className={input + ' mt-1'} value={selected.x} onChange={(e) => updateEl(selected.id, { x: Number(e.target.value) })} /></label>
                <label className="flex-1"><span className={label}>Y</span><input type="number" className={input + ' mt-1'} value={selected.y} onChange={(e) => updateEl(selected.id, { y: Number(e.target.value) })} /></label>
              </div>
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <button onClick={() => duplicateEl(selected.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><CopyPlus className="h-4 w-4" /> Duplicate</button>
                <button onClick={() => deleteEl(selected.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {menu && (
        <div className="fixed z-50 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg" style={{ left: menu.x, top: menu.y }}>
          <MenuItem icon={CopyPlus} label="Duplicate" hint="Ctrl+D" onClick={() => duplicateEl(selectedId)} />
          <MenuItem icon={Copy} label="Copy" hint="Ctrl+C" onClick={() => copyEl(selectedId)} />
          <MenuItem icon={ClipboardPaste} label="Paste" hint="Ctrl+V" onClick={pasteEl} disabled={!clipboard} />
          <MenuItem icon={Trash2} label="Delete" hint="Del" onClick={() => deleteEl(selectedId)} danger />
        </div>
      )}
    </div>
  )
}

const MenuItem = ({ icon: Icon, label, hint, onClick, disabled, danger }) => (
  <button onClick={onClick} disabled={disabled} className={'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition disabled:opacity-40 ' + (danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50')}>
    <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
    <span className="text-[11px] text-slate-400">{hint}</span>
  </button>
)

export default PageBuilder
