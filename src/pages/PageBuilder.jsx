import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, ExternalLink, Loader2, Type, Heading1, Square, Image as ImageIcon, Film,
  Palette, Copy, ClipboardPaste, CopyPlus, Trash2, Bold, AlignLeft, AlignCenter, AlignRight, Plus,
  Undo2, Redo2, Move, Pen,
} from 'lucide-react'
import CanvasElement from '../components/CanvasElement'
import { getMyOrganization, uploadImage } from '../lib/organizations'
import {
  getPageLayout, savePageLayout, normalizeConfig, seedConfigFromOrg, newElement, newPage, PRESET_COLORS, CANVAS_W,
} from '../lib/pageBuilder'
import { slugify } from '../lib/slug'

const PageBuilder = () => {
  const navigate = useNavigate()
  const dragRef = useRef(null)
  const mainRef = useRef(null)

  const [org, setOrg] = useState(null)
  const [config, setConfig] = useState(null)
  const [current, setCurrent] = useState(0) // active page index
  const [selectedId, setSelectedId] = useState(null)
  const [clipboard, setClipboard] = useState(null)
  const [menu, setMenu] = useState(null)
  const [tab, setTab] = useState('text')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [tool, setTool] = useState('select') // 'select' | 'pen'
  const [penColor, setPenColor] = useState('#111827')
  const [penWidth, setPenWidth] = useState(4)
  const [drawPreview, setDrawPreview] = useState(null)
  const drawRef = useRef(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: o, error } = await getMyOrganization()
      if (!active) return
      if (error || !o) {
        setLoadError(error || 'No organization found.')
        setLoading(false)
        return
      }
      setOrg(o)
      const { config: saved } = await getPageLayout(o.org_id)
      if (!active) return
      setConfig(saved ? normalizeConfig(saved) : seedConfigFromOrg(o))
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // ---- undo / redo history ----
  const historyRef = useRef([])
  const futureRef = useRef([])
  const lastCommitRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Snapshot the CURRENT config before a change. `coalesce` merges rapid edits
  // (e.g. typing / nudging) into one history step.
  const snapshot = (coalesce = false) => {
    if (!config) return
    const now = Date.now()
    if (coalesce && now - lastCommitRef.current < 500) return
    const hist = historyRef.current
    if (hist.length && hist[hist.length - 1] === config) return
    lastCommitRef.current = now
    historyRef.current = [...hist, config].slice(-60)
    futureRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }
  const undo = () => {
    const hist = historyRef.current
    if (!hist.length) return
    futureRef.current = [...futureRef.current, config]
    historyRef.current = hist.slice(0, -1)
    setConfig(hist[hist.length - 1])
    setSelectedId(null)
    setMenu(null)
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
  }
  const redo = () => {
    const fut = futureRef.current
    if (!fut.length) return
    historyRef.current = [...historyRef.current, config]
    futureRef.current = fut.slice(0, -1)
    setConfig(fut[fut.length - 1])
    setSelectedId(null)
    setMenu(null)
    setCanRedo(futureRef.current.length > 0)
    setCanUndo(true)
  }

  // ---- element mutations (id-based across pages → robust during drag) ----
  const mapElements = (fn) =>
    setConfig((c) => ({ ...c, pages: c.pages.map((p) => ({ ...p, elements: fn(p.elements) })) }))
  const updateEl = (id, patch) => { snapshot(true); mapElements((els) => els.map((e) => (e.id === id ? { ...e, ...patch } : e))) }
  const updateStyle = (id, patch) => { snapshot(true); mapElements((els) => els.map((e) => (e.id === id ? { ...e, style: { ...e.style, ...patch } } : e))) }
  const deleteEl = (id) => {
    snapshot()
    mapElements((els) => els.filter((e) => e.id !== id))
    setSelectedId((s) => (s === id ? null : s))
  }

  // ---- current-page mutations ----
  const mutatePage = (fn) => setConfig((c) => ({ ...c, pages: c.pages.map((p, i) => (i === current ? fn(p) : p)) }))
  const patchBg = (patch) => { snapshot(true); mutatePage((p) => ({ ...p, background: { ...p.background, ...patch } })) }
  const patchBackdrop = (patch) => { snapshot(true); setConfig((c) => ({ ...c, background: { ...(c.background ?? {}), ...patch } })) }
  const addToPage = (el) => {
    snapshot()
    mutatePage((p) => {
      const W = pw(p)
      const w = Math.min(el.w, W)
      const x = Math.max(0, Math.min(W - w, el.x))
      return { ...p, elements: [...p.elements, { ...el, w, x }] }
    })
    setSelectedId(el.id)
  }
  const addEl = (type) => addToPage(newElement(type, config.accent))
  const duplicateEl = (id) => {
    const el = config.pages.flatMap((p) => p.elements).find((e) => e.id === id)
    if (el) addToPage({ ...el, id: crypto.randomUUID(), x: el.x + 24, y: el.y + 24 })
  }
  const copyEl = (id) => {
    const el = config.pages.flatMap((p) => p.elements).find((e) => e.id === id)
    if (el) setClipboard(el)
  }
  const pasteEl = () => {
    if (!clipboard) return
    addToPage({ ...clipboard, id: crypto.randomUUID(), x: clipboard.x + 24, y: clipboard.y + 24 })
  }

  // ---- page management ----
  const scrollToPage = (i) => {
    setCurrent(i)
    setSelectedId(null)
    setMenu(null)
    requestAnimationFrame(() => document.getElementById(`pb-page-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const addPage = () => {
    snapshot()
    const nextIndex = config.pages.length
    setConfig((c) => ({ ...c, pages: [...c.pages, newPage()] }))
    setSelectedId(null)
    setCurrent(nextIndex)
    setTimeout(() => document.getElementById(`pb-page-${nextIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const deletePage = () => {
    if (config.pages.length <= 1) return
    snapshot()
    setConfig((c) => ({ ...c, pages: c.pages.filter((_, i) => i !== current) }))
    setSelectedId(null)
    setCurrent((i) => Math.max(0, i - 1))
  }

  // ---- drag (press-and-hold via pointer capture) ----
  const resizeRef = useRef(null)
  const widthRef = useRef(null)

  const onElDown = (e, el, pageIndex) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    snapshot()
    setCurrent(pageIndex)
    setSelectedId(el.id)
    setMenu(null)
    dragRef.current = { id: el.id, srcPage: pageIndex, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, pid: e.pointerId }
  }
  const onElMove = (e) => {
    const d = dragRef.current
    if (!d || d.pid !== e.pointerId) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    setConfig((c) => ({
      ...c,
      pages: c.pages.map((p) => ({
        ...p,
        elements: p.elements.map((el) => (el.id === d.id ? { ...el, x: Math.max(0, Math.min(pw(p) - el.w, Math.round(d.origX + dx))), y: Math.max(0, Math.round(d.origY + dy)) } : el)),
      })),
    }))
  }
  const onElUp = (e) => {
    const d = dragRef.current
    if (!d || d.pid !== e.pointerId) return
    dragRef.current = null
    // Reassign the element to whichever page it was dropped over (cross-page move).
    setConfig((c) => {
      const el = c.pages[d.srcPage]?.elements.find((x) => x.id === d.id)
      const srcRect = document.getElementById(`pb-page-${d.srcPage}`)?.getBoundingClientRect()
      if (!el || !srcRect) return c
      const absTop = srcRect.top + el.y
      const absLeft = srcRect.left + el.x
      let target = d.srcPage
      for (let i = 0; i < c.pages.length; i++) {
        const r = document.getElementById(`pb-page-${i}`)?.getBoundingClientRect()
        if (r && absTop >= r.top && absTop <= r.bottom) { target = i; break }
      }
      if (target === d.srcPage) return c
      const tRect = document.getElementById(`pb-page-${target}`).getBoundingClientRect()
      const mw = Math.min(el.w, Math.round(tRect.width))
      const moved = { ...el, w: mw, x: Math.max(0, Math.min(Math.round(tRect.width) - mw, Math.round(absLeft - tRect.left))), y: Math.max(0, Math.round(absTop - tRect.top)) }
      return {
        ...c,
        pages: c.pages.map((p, i) =>
          i === d.srcPage ? { ...p, elements: p.elements.filter((x) => x.id !== d.id) }
            : i === target ? { ...p, elements: [...p.elements, moved] }
              : p,
        ),
      }
    })
  }

  // ---- resize element (press-and-hold) ----
  const onResizeDown = (e, el, corner) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    snapshot()
    resizeRef.current = { id: el.id, corner, startX: e.clientX, startY: e.clientY, origW: el.w, origX: el.x, origH: el.h, origY: el.y, pid: e.pointerId }
  }
  const onResizeMove = (e) => {
    const r = resizeRef.current
    if (!r || r.pid !== e.pointerId) return
    const dx = e.clientX - r.startX
    const dy = e.clientY - r.startY
    setConfig((c) => ({
      ...c,
      pages: c.pages.map((p) => ({
        ...p,
        elements: p.elements.map((el) => {
          if (el.id !== r.id) return el
          const W = pw(p)
          const H = p.height || 1100
          let w = r.origW
          let x = r.origX
          if (r.corner.includes('e')) w = r.origW + dx
          if (r.corner.includes('w')) { w = r.origW - dx; x = r.origX + dx }
          // Never bigger than the page, and kept inside it.
          const patch = {}
          patch.w = Math.min(W, Math.max(40, Math.round(w)))
          patch.x = Math.max(0, Math.min(W - patch.w, Math.round(x)))
          if (typeof r.origH === 'number') {
            let h = r.origH
            let y = r.origY
            if (r.corner.includes('s')) h = r.origH + dy
            if (r.corner.includes('n')) { h = r.origH - dy; y = r.origY + dy }
            patch.h = Math.min(H, Math.max(24, Math.round(h)))
            patch.y = Math.max(0, Math.min(H - patch.h, Math.round(y)))
          }
          return { ...el, ...patch }
        }),
      })),
    }))
  }
  const onResizeUp = (e) => {
    if (resizeRef.current?.pid === e.pointerId) resizeRef.current = null
  }

  // Max canvas width = the canvas area between the tool panels (minus its padding).
  const maxCanvasWidth = () => Math.max(320, (mainRef.current?.clientWidth || window.innerWidth) - 64)
  // Safe width: recover from any NaN/invalid value stuck in state.
  const pw = (p) => (Number.isFinite(p?.width) && p.width >= 320 ? p.width : CANVAS_W)

  // ---- resize a single page's width (press-and-hold); pages are independent ----
  const onWidthDown = (e, index) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    snapshot()
    widthRef.current = { index, startX: e.clientX, origW: pw(config.pages[index]), pid: e.pointerId }
  }
  const onWidthMove = (e) => {
    const r = widthRef.current
    if (!r || r.pid !== e.pointerId) return
    const dx = e.clientX - r.startX
    const w = Math.max(320, Math.min(maxCanvasWidth(), Math.round(r.origW + dx)))
    setConfig((c) => ({ ...c, pages: c.pages.map((p, i) => (i === r.index ? { ...p, width: w } : p)) }))
  }
  const onWidthUp = (e) => {
    if (widthRef.current?.pid === e.pointerId) widthRef.current = null
  }
  const openMenu = (e, el, pageIndex) => {
    e.preventDefault()
    setCurrent(pageIndex)
    setSelectedId(el.id)
    setMenu({ x: e.clientX, y: e.clientY })
  }

  // ---- pen / freehand drawing ----
  const onPageDown = (e, i) => {
    if (tool === 'pen') {
      e.stopPropagation()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      const rect = e.currentTarget.getBoundingClientRect()
      drawRef.current = { pageIndex: i, pid: e.pointerId, pts: [[Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)]] }
      setDrawPreview({ pageIndex: i, pts: drawRef.current.pts })
    } else {
      setCurrent(i)
      setSelectedId(null)
      setMenu(null)
    }
  }
  const onPageMove = (e) => {
    const d = drawRef.current
    if (!d || d.pid !== e.pointerId) return
    const rect = document.getElementById(`pb-page-${d.pageIndex}`).getBoundingClientRect()
    d.pts.push([Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)])
    setDrawPreview({ pageIndex: d.pageIndex, pts: [...d.pts] })
  }
  const onPageUp = (e) => {
    const d = drawRef.current
    if (!d || d.pid !== e.pointerId) return
    drawRef.current = null
    setDrawPreview(null)
    if (d.pts.length < 2) return
    const xs = d.pts.map((p) => p[0])
    const ys = d.pts.map((p) => p[1])
    const pad = penWidth
    const x = Math.min(...xs) - pad
    const y = Math.min(...ys) - pad
    const w = Math.max(...xs) - Math.min(...xs) + pad * 2
    const h = Math.max(...ys) - Math.min(...ys) + pad * 2
    const local = d.pts.map(([px, py]) => [px - x, py - y])
    const el = { id: crypto.randomUUID(), type: 'draw', x, y, w, h, vbW: w, vbH: h, points: local, style: { stroke: penColor, strokeWidth: penWidth } }
    snapshot()
    setConfig((c) => ({ ...c, pages: c.pages.map((p, i) => (i === d.pageIndex ? { ...p, elements: [...p.elements, el] } : p)) }))
    setSelectedId(el.id)
    setTool('select')
  }

  // ---- keyboard ----
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
        const el = config.pages.flatMap((p) => p.elements).find((x) => x.id === selectedId)
        if (!el) return
        if (e.key === 'ArrowLeft') updateEl(el.id, { x: Math.max(0, el.x - step) })
        if (e.key === 'ArrowRight') updateEl(el.id, { x: el.x + step })
        if (e.key === 'ArrowUp') updateEl(el.id, { y: Math.max(0, el.y - step) })
        if (e.key === 'ArrowDown') updateEl(el.id, { y: el.y + step })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, clipboard, config, current]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menu])

  const save = async () => {
    setSaving(true)
    setMsg(null)
    const { error } = await savePageLayout(org.org_id, config)
    setSaving(false)
    setMsg(error ? { type: 'error', text: error } : { type: 'success', text: 'Design saved.' })
    if (!error) setTimeout(() => setMsg(null), 2500)
  }

  const uploadMedia = async (file, kind, forId) => {
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadImage(org.org_id, file, kind)
    setUploading(false)
    if (error) return setMsg({ type: 'error', text: error })
    if (forId) return updateEl(forId, { content: url })
    if (kind === 'pagebg') return patchBg({ type: 'image', image: url })
    if (kind === 'backdrop') return patchBackdrop({ type: 'image', image: url })
    addToPage({ ...newElement(kind === 'vid' ? 'video' : 'image', config.accent), content: url })
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading builder…</div>
  }
  if (loadError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{loadError}</p>
        <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</button>
      </div>
    )
  }

  const page = config.pages[current] ?? config.pages[0]
  const selected = config.pages.flatMap((p) => p.elements).find((e) => e.id === selectedId)
  const slug = slugify(org.org_name || '')
  const bg = page.background
  const backdrop = config.background ?? { type: 'color', color: '#e2e8f0' }
  const backdropStyle = backdrop.type === 'image' && backdrop.image
    ? { backgroundImage: `url(${backdrop.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: backdrop.color || '#e2e8f0' }

  const label = 'text-xs font-medium text-slate-500'
  const input = 'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  const tabBtn = (id) => 'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ' + (tab === id ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600')

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
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"><Redo2 className="h-4 w-4" /></button>
          <a href={`/org/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><ExternalLink className="h-4 w-4" /> View as public</a>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
        </div>
      </header>

      {/* Page strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-1.5">
        <span className="text-xs font-medium text-slate-400">Pages</span>
        {config.pages.map((p, i) => (
          <button key={p.id} onClick={() => scrollToPage(i)} className={'h-6 w-6 rounded text-xs font-medium transition ' + (i === current ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')} title={`Jump to page ${i + 1}`}>{i + 1}</button>
        ))}
        <button onClick={addPage} title="Add page" className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
        {config.pages.length > 1 && (
          <button onClick={deletePage} className="ml-2 flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Delete page</button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: tools */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex border-b border-slate-200">
            <button onClick={() => setTab('text')} className={tabBtn('text')}><Type className="h-4 w-4" /> Text</button>
            <button onClick={() => setTab('elements')} className={tabBtn('elements')}><Square className="h-4 w-4" /> Elements</button>
            <button onClick={() => setTab('design')} className={tabBtn('design')}><Palette className="h-4 w-4" /> Design</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {tab === 'text' && (
              <>
                <button onClick={() => addEl('heading')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"><Heading1 className="h-4 w-4" /> Add heading</button>
                <button onClick={() => addEl('text')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><Type className="h-4 w-4" /> Add text</button>
              </>
            )}
            {tab === 'elements' && (
              <>
                <button onClick={() => addEl('button')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><Square className="h-4 w-4" /> Add button</button>
                <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} Add image / GIF
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'img')} />
                </label>
                <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />} Add video
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'vid')} />
                </label>
                <button onClick={() => addEl('video')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"><Film className="h-4 w-4" /> Add video by URL (YouTube…)</button>

                <div className="mt-1 rounded-lg border border-slate-200 p-2">
                  <button
                    onClick={() => setTool((t) => (t === 'pen' ? 'select' : 'pen'))}
                    className={'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition ' + (tool === 'pen' ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-50')}
                  >
                    <Pen className="h-4 w-4" /> {tool === 'pen' ? 'Drawing… (click to stop)' : 'Pen / draw'}
                  </button>
                  {tool === 'pen' && (
                    <div className="mt-2 flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-500">
                        Color <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="h-6 w-6 cursor-pointer rounded border border-slate-300 bg-transparent p-0" />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500">
                        Size <input type="number" min="1" max="40" value={penWidth} onChange={(e) => setPenWidth(Math.max(1, Number(e.target.value) || 1))} className="w-14 rounded-md border border-slate-200 px-2 py-1 text-sm" />
                      </label>
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">Draw freehand on the current page.</p>
                </div>
              </>
            )}
            {tab === 'design' && (
              <div className="space-y-4">
                <div>
                  <p className={label}>Page {current + 1} background</p>
                  <div className="mt-1 flex gap-2">
                    {['color', 'image'].map((t) => (
                      <button key={t} onClick={() => patchBg({ type: t })} className={'flex-1 rounded-md border px-2 py-1 text-xs font-medium capitalize ' + (bg.type === t ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600')}>{t}</button>
                    ))}
                  </div>
                  {bg.type === 'color' ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => patchBg({ color: c })} style={{ backgroundColor: c }} className={'h-6 w-6 rounded-full border border-slate-200 ' + (bg.color === c ? 'ring-2 ring-slate-800 ring-offset-1' : '')} />
                      ))}
                      <input type="color" value={bg.color || '#ffffff'} onChange={(e) => patchBg({ color: e.target.value })} title="Custom color" className="h-6 w-6 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0" />
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {bg.image && <img src={bg.image} alt="" className="h-20 w-full rounded-md object-cover" />}
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        <span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                          {bg.image ? 'Replace image / GIF' : 'Upload image / GIF'}
                        </span>
                        <input type="file" accept="image/*,image/gif" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'pagebg')} />
                      </label>
                      {bg.image && (
                        <button onClick={() => patchBg({ image: null })} className="text-xs text-red-500 hover:underline">Remove image</button>
                      )}
                    </div>
                  )}
                </div>
                <label className="block"><span className={label}>Page {current + 1} width (px)</span>
                  <input type="number" className={input + ' mt-1'} value={pw(page)} onChange={(e) => { snapshot(true); mutatePage((p) => ({ ...p, width: Math.max(320, Math.min(maxCanvasWidth(), Number(e.target.value) || 320)) })) }} />
                </label>

                <div className="border-t border-slate-100 pt-3">
                  <p className={label}>Backdrop (behind all pages)</p>
                  <div className="mt-1 flex gap-2">
                    {['color', 'image'].map((t) => (
                      <button key={t} onClick={() => patchBackdrop({ type: t })} className={'flex-1 rounded-md border px-2 py-1 text-xs font-medium capitalize ' + (backdrop.type === t ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600')}>{t}</button>
                    ))}
                  </div>
                  {backdrop.type === 'color' ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => patchBackdrop({ color: c })} style={{ backgroundColor: c }} className={'h-6 w-6 rounded-full border border-slate-200 ' + (backdrop.color === c ? 'ring-2 ring-slate-800 ring-offset-1' : '')} />
                      ))}
                      <input type="color" value={backdrop.color || '#e2e8f0'} onChange={(e) => patchBackdrop({ color: e.target.value })} title="Custom color" className="h-6 w-6 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0" />
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {backdrop.image && <img src={backdrop.image} alt="" className="h-20 w-full rounded-md object-cover" />}
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        <span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">{backdrop.image ? 'Replace image / GIF' : 'Upload image / GIF'}</span>
                        <input type="file" accept="image/*,image/gif" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'backdrop')} />
                      </label>
                      {backdrop.image && <button onClick={() => patchBackdrop({ image: null })} className="text-xs text-red-500 hover:underline">Remove image</button>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas — all pages stacked; scroll to move between them */}
        <main ref={mainRef} className="flex-1 overflow-auto p-8" style={backdropStyle}>
          <div className="flex flex-col items-center gap-2">
            {config.pages.map((pg, i) => {
              const pbg = pg.background.type === 'image' && pg.background.image
                ? { backgroundImage: `url(${pg.background.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { backgroundColor: pg.background.color || '#ffffff' }
              return (
                <div key={pg.id} style={{ width: pw(pg) }}>
                  <div className="flex items-center justify-between px-1 pb-1 pt-4 text-xs font-medium text-slate-500">
                    <span>Page {i + 1} · {pw(pg)}px</span>
                    {i === current && <span className="text-emerald-600">• editing</span>}
                  </div>
                  <div
                    id={`pb-page-${i}`}
                    onPointerDown={(e) => onPageDown(e, i)}
                    onPointerMove={onPageMove}
                    onPointerUp={onPageUp}
                    className="relative overflow-hidden shadow-xl"
                    style={{ width: pw(pg), height: pg.height, outline: i === current ? '2px solid #10b981' : 'none', outlineOffset: 2, cursor: tool === 'pen' ? 'crosshair' : 'default', ...pbg }}
                  >
                    {pg.elements.map((el) => (
                      <div
                        key={el.id}
                        onPointerDown={(e) => onElDown(e, el, i)}
                        onPointerMove={onElMove}
                        onPointerUp={onElUp}
                        onContextMenu={(e) => openMenu(e, el, i)}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, cursor: 'move', outline: selectedId === el.id ? '2px solid #2563eb' : 'none', outlineOffset: 2, touchAction: 'none', pointerEvents: tool === 'pen' ? 'none' : 'auto' }}
                      >
                        <CanvasElement el={el} editable positioned={false} />
                        {/* Videos are interactive (play/pause), so they get a drag grip instead of body-drag. */}
                        {el.type === 'video' && (
                          <div
                            onPointerDown={(e) => onElDown(e, el, i)}
                            onPointerMove={onElMove}
                            onPointerUp={onElUp}
                            title="Drag video"
                            className="absolute -left-3 -top-3 z-10 flex h-7 w-7 cursor-move items-center justify-center rounded-full bg-blue-500 text-white shadow"
                            style={{ touchAction: 'none' }}
                          >
                            <Move className="h-4 w-4" />
                          </div>
                        )}
                        {selectedId === el.id &&
                          (() => {
                            // Buttons resize via edges only (no corners); everything
                            // else via corners + left/right edges.
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
                            const handles = el.type === 'button' ? edges : [...corners, edges[0], edges[1]]
                            return handles.map(([corner, pos]) => (
                              <div
                                key={corner}
                                onPointerDown={(e) => onResizeDown(e, el, corner)}
                                onPointerMove={onResizeMove}
                                onPointerUp={onResizeUp}
                                className="absolute h-3 w-3 rounded-full border-2 border-blue-500 bg-white"
                                style={{ position: 'absolute', ...pos, touchAction: 'none' }}
                              />
                            ))
                          })()}
                      </div>
                    ))}

                    {/* Live pen preview */}
                    {drawPreview && drawPreview.pageIndex === i && (
                      <svg className="pointer-events-none absolute inset-0" width={pw(pg)} height={pg.height}>
                        <polyline points={drawPreview.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={penColor} strokeWidth={penWidth} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}

                    {/* This page's width resize handle */}
                    <div
                      onPointerDown={(e) => onWidthDown(e, i)}
                      onPointerMove={onWidthMove}
                      onPointerUp={onWidthUp}
                      title="Drag to resize this page's width"
                      className="absolute right-0 top-1/2 z-20 h-20 w-2 -translate-y-1/2 cursor-ew-resize rounded-l-full bg-slate-400 hover:bg-slate-500"
                      style={{ touchAction: 'none' }}
                    />
                  </div>
                </div>
              )
            })}
            <button onClick={addPage} className="my-4 flex items-center gap-2 rounded-lg border border-dashed border-slate-400 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Add page
            </button>
          </div>
        </main>

        {/* Right: properties */}
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-3">
          {!selected ? (
            <p className="text-sm text-slate-400">Select an element to edit it, or add one from the left.</p>
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
                    {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([a, Icon]) => (
                      <button key={a} onClick={() => updateStyle(selected.id, { align: a })} className={'rounded-md border p-1.5 ' + (selected.style.align === a ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500')}><Icon className="h-4 w-4" /></button>
                    ))}
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
                  <label className="block"><span className={label}>Video URL (YouTube / Vimeo / file)</span><input className={input + ' mt-1'} value={selected.content} onChange={(e) => updateEl(selected.id, { content: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}<span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">Upload video file</span><input type="file" accept="video/*" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'vid', selected.id)} /></label>
                  <label className="block"><span className={label}>Corner radius</span><input type="number" className={input + ' mt-1'} value={selected.style.radius} onChange={(e) => updateStyle(selected.id, { radius: Number(e.target.value) })} /></label>
                </>
              )}

              {selected.type === 'draw' && (
                <div className="flex gap-2">
                  <label><span className={label}>Stroke</span><input type="color" className="mt-1 block h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" value={selected.style.stroke} onChange={(e) => updateStyle(selected.id, { stroke: e.target.value })} /></label>
                  <label className="flex-1"><span className={label}>Thickness</span><input type="number" className={input + ' mt-1'} value={selected.style.strokeWidth} onChange={(e) => updateStyle(selected.id, { strokeWidth: Math.max(1, Number(e.target.value) || 1) })} /></label>
                </div>
              )}

              <div className="flex gap-2">
                <label className="flex-1"><span className={label}>Width</span><input type="number" className={input + ' mt-1'} value={selected.w} onChange={(e) => updateEl(selected.id, { w: Math.min(pw(page), Math.max(40, Number(e.target.value) || 40)) })} /></label>
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
