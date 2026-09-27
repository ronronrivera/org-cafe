import { Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react'

const L = 'text-xs font-medium text-slate-500'
const I = 'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

const FileBtn = ({ onUpload, uploading, cb, children = 'Upload' }) => (
  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
    <span className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">{children}</span>
    <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0], cb)} />
  </label>
)

const Color = ({ label, value, onChange }) => (
  <label><span className={L}>{label}</span><input type="color" className="mt-1 block h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} /></label>
)

const Links = ({ links = [], set }) => (
  <div className="space-y-2">
    {links.map((lnk, idx) => (
      <div key={idx} className="rounded-md border border-slate-200 p-2">
        <div className="flex items-center gap-1">
          <input className={I} placeholder="Label" value={lnk.label} onChange={(e) => set(links.map((x, k) => (k === idx ? { ...x, label: e.target.value } : x)))} />
          <button onClick={() => set(links.filter((_, k) => k !== idx))} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
        </div>
        <input className={I + ' mt-1'} placeholder="https://…" value={lnk.href} onChange={(e) => set(links.map((x, k) => (k === idx ? { ...x, href: e.target.value } : x)))} />
      </div>
    ))}
    <button onClick={() => set([...links, { label: 'Link', href: '#' }])} className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"><Plus className="h-4 w-4" /> Add link</button>
  </div>
)

// One editor for every component block. `update(patch)` merges into props;
// `onUpload(file, cb)` uploads an image then calls cb(url).
const ComponentProps = ({ section, update, onUpload, uploading }) => {
  const p = section.props
  const set = (patch) => update(patch)

  switch (section.component) {
    case 'header':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Header / Nav</p>
          <label className="block"><span className={L}>Title</span><input className={I + ' mt-1'} value={p.title || ''} onChange={(e) => set({ title: e.target.value })} /></label>
          <div><p className={L}>Logo</p><div className="mt-1 flex items-center gap-2">{p.logo && <img src={p.logo} alt="" className="h-8 w-8 rounded object-cover" />}<FileBtn onUpload={onUpload} uploading={uploading} cb={(url) => set({ logo: url })} />{p.logo && <button onClick={() => set({ logo: '' })} className="text-xs text-red-500 hover:underline">Remove</button>}</div></div>
          <div><p className={L}>Nav links</p><div className="mt-1"><Links links={p.links} set={(links) => set({ links })} /></div></div>
          <div className="flex gap-4"><Color label="Background" value={p.bg} onChange={(v) => set({ bg: v })} /><Color label="Text" value={p.color} onChange={(v) => set({ color: v })} /></div>
        </div>
      )
    case 'hero':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hero</p>
          <label className="block"><span className={L}>Heading</span><input className={I + ' mt-1'} value={p.heading} onChange={(e) => set({ heading: e.target.value })} /></label>
          <label className="block"><span className={L}>Subheading</span><textarea rows={2} className={I + ' mt-1 resize-none'} value={p.subheading} onChange={(e) => set({ subheading: e.target.value })} /></label>
          <label className="block"><span className={L}>Button label</span><input className={I + ' mt-1'} value={p.buttonLabel} onChange={(e) => set({ buttonLabel: e.target.value })} /></label>
          <label className="block"><span className={L}>Button link</span><input className={I + ' mt-1'} value={p.buttonHref} onChange={(e) => set({ buttonHref: e.target.value })} /></label>
          <div className="flex gap-2">{['center', 'left'].map((a) => (<button key={a} onClick={() => set({ align: a })} className={'flex-1 rounded-md border px-2 py-1 text-xs font-medium capitalize ' + (p.align === a ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600')}>{a}</button>))}</div>
          <div className="flex items-center gap-4"><Color label="Background" value={p.bgColor} onChange={(v) => set({ bgColor: v })} /><Color label="Text" value={p.color} onChange={(v) => set({ color: v })} /></div>
          <div><p className={L}>Background image</p><div className="mt-1 flex items-center gap-2">{p.image && <img src={p.image} alt="" className="h-10 w-16 rounded object-cover" />}<FileBtn onUpload={onUpload} uploading={uploading} cb={(url) => set({ image: url })} />{p.image && <button onClick={() => set({ image: '' })} className="text-xs text-red-500 hover:underline">Remove</button>}</div></div>
          <label className="block"><span className={L}>Height (px)</span><input type="number" className={I + ' mt-1'} value={p.height} onChange={(e) => set({ height: Number(e.target.value) || 200 })} /></label>
        </div>
      )
    case 'text':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Text</p>
          <label className="block"><span className={L}>Heading</span><input className={I + ' mt-1'} value={p.heading} onChange={(e) => set({ heading: e.target.value })} /></label>
          <label className="block"><span className={L}>Body</span><textarea rows={5} className={I + ' mt-1 resize-none'} value={p.body} onChange={(e) => set({ body: e.target.value })} /></label>
          <div className="flex gap-2">{['left', 'center', 'right'].map((a) => (<button key={a} onClick={() => set({ align: a })} className={'flex-1 rounded-md border px-2 py-1 text-xs font-medium capitalize ' + (p.align === a ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600')}>{a}</button>))}</div>
          <div className="flex gap-4"><Color label="Heading" value={p.color} onChange={(v) => set({ color: v })} /><Color label="Body" value={p.bodyColor} onChange={(v) => set({ bodyColor: v })} /></div>
        </div>
      )
    case 'button':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Button</p>
          <label className="block"><span className={L}>Label</span><input className={I + ' mt-1'} value={p.label} onChange={(e) => set({ label: e.target.value })} /></label>
          <label className="block"><span className={L}>Link (URL)</span><input className={I + ' mt-1'} value={p.href} onChange={(e) => set({ href: e.target.value })} placeholder="https://…" /></label>
          <div className="flex gap-2">{['left', 'center', 'right'].map((a) => (<button key={a} onClick={() => set({ align: a })} className={'flex-1 rounded-md border px-2 py-1 text-xs font-medium capitalize ' + (p.align === a ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600')}>{a}</button>))}</div>
          <div className="flex items-center gap-4"><Color label="Fill" value={p.bg} onChange={(v) => set({ bg: v })} /><Color label="Text" value={p.color} onChange={(v) => set({ color: v })} /></div>
          <div className="flex gap-2">
            <label className="flex-1"><span className={L}>Font size</span><input type="number" className={I + ' mt-1'} value={p.size} onChange={(e) => set({ size: Number(e.target.value) || 12 })} /></label>
            <label className="flex-1"><span className={L}>Corner radius</span><input type="number" className={I + ' mt-1'} value={p.radius} onChange={(e) => set({ radius: Number(e.target.value) })} /></label>
          </div>
        </div>
      )
    case 'cta':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Call to action</p>
          <label className="block"><span className={L}>Text</span><input className={I + ' mt-1'} value={p.text} onChange={(e) => set({ text: e.target.value })} /></label>
          <label className="block"><span className={L}>Button label</span><input className={I + ' mt-1'} value={p.buttonLabel} onChange={(e) => set({ buttonLabel: e.target.value })} /></label>
          <label className="block"><span className={L}>Button link</span><input className={I + ' mt-1'} value={p.buttonHref} onChange={(e) => set({ buttonHref: e.target.value })} /></label>
          <div className="flex gap-4"><Color label="Background" value={p.bg} onChange={(v) => set({ bg: v })} /><Color label="Text" value={p.color} onChange={(v) => set({ color: v })} /></div>
        </div>
      )
    case 'cardgrid':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Card grid</p>
          <label className="block"><span className={L}>Title</span><input className={I + ' mt-1'} value={p.title} onChange={(e) => set({ title: e.target.value })} /></label>
          <label className="block"><span className={L}>Columns</span><input type="number" min="1" max="4" className={I + ' mt-1'} value={p.columns} onChange={(e) => set({ columns: Math.max(1, Math.min(4, Number(e.target.value) || 1)) })} /></label>
          <div className="space-y-2">
            {(p.cards || []).map((card, idx) => (
              <div key={idx} className="rounded-md border border-slate-200 p-2">
                <div className="flex items-center justify-between"><span className="text-xs text-slate-400">Card {idx + 1}</span>{p.cards.length > 3 && <button onClick={() => set({ cards: p.cards.filter((_, k) => k !== idx) })} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>}</div>
                <input className={I + ' mt-1'} placeholder="Title" value={card.title} onChange={(e) => set({ cards: p.cards.map((c, k) => (k === idx ? { ...c, title: e.target.value } : c)) })} />
                <textarea rows={2} className={I + ' mt-1 resize-none'} placeholder="Text" value={card.text} onChange={(e) => set({ cards: p.cards.map((c, k) => (k === idx ? { ...c, text: e.target.value } : c)) })} />
                <div className="mt-1 flex items-center gap-2">{card.image && <img src={card.image} alt="" className="h-8 w-12 rounded object-cover" />}<FileBtn onUpload={onUpload} uploading={uploading} cb={(url) => set({ cards: p.cards.map((c, k) => (k === idx ? { ...c, image: url } : c)) })} children="Image" /></div>
              </div>
            ))}
            <button onClick={() => set({ cards: [...(p.cards || []), { image: '', title: 'Card', text: 'Description' }] })} className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"><Plus className="h-4 w-4" /> Add card</button>
          </div>
        </div>
      )
    case 'gallery':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gallery</p>
          <label className="block"><span className={L}>Columns</span><input type="number" min="1" max="5" className={I + ' mt-1'} value={p.columns} onChange={(e) => set({ columns: Math.max(1, Math.min(5, Number(e.target.value) || 1)) })} /></label>
          <div className="grid grid-cols-3 gap-1.5">{(p.images || []).map((src, idx) => (<div key={idx} className="relative"><img src={src} alt="" className="h-12 w-full rounded object-cover" /><button onClick={() => set({ images: p.images.filter((_, k) => k !== idx) })} className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"><Trash2 className="h-3 w-3" /></button></div>))}</div>
          <FileBtn onUpload={onUpload} uploading={uploading} cb={(url) => set({ images: [...(p.images || []), url] })} children="Add image" />
        </div>
      )
    case 'carousel':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Carousel</p>
          <div className="grid grid-cols-3 gap-1.5">{(p.images || []).map((src, idx) => (<div key={idx} className="relative"><img src={src} alt="" className="h-12 w-full rounded object-cover" /><button onClick={() => set({ images: p.images.filter((_, k) => k !== idx) })} className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"><Trash2 className="h-3 w-3" /></button></div>))}</div>
          <FileBtn onUpload={onUpload} uploading={uploading} cb={(url) => set({ images: [...(p.images || []), url] })} children="Add image" />
          <label className="block"><span className={L}>Height</span><input type="number" className={I + ' mt-1'} value={p.height} onChange={(e) => set({ height: Number(e.target.value) || 200 })} /></label>
          <label className="block"><span className={L}>Auto-rotate (ms)</span><input type="number" className={I + ' mt-1'} value={p.interval} onChange={(e) => set({ interval: Number(e.target.value) || 3500 })} /></label>
          <label className="block"><span className={L}>Corner radius</span><input type="number" className={I + ' mt-1'} value={p.rounded} onChange={(e) => set({ rounded: Number(e.target.value) })} /></label>
        </div>
      )
    case 'footer':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Footer</p>
          <label className="block"><span className={L}>Text</span><input className={I + ' mt-1'} value={p.text} onChange={(e) => set({ text: e.target.value })} /></label>
          <div><p className={L}>Links</p><div className="mt-1"><Links links={p.links} set={(links) => set({ links })} /></div></div>
          <div className="flex gap-4"><Color label="Background" value={p.bg} onChange={(v) => set({ bg: v })} /><Color label="Text" value={p.color} onChange={(v) => set({ color: v })} /></div>
        </div>
      )
    default:
      return null
  }
}

export default ComponentProps
