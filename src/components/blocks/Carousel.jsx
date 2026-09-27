import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'

// A pre-built, configurable component block. Props: { images: [url], height, interval, rounded }.
const Carousel = ({ props = {}, editable = false }) => {
  const images = Array.isArray(props.images) ? props.images : []
  const height = props.height || 360
  const rounded = props.rounded ?? 16
  const interval = props.interval || 3500
  const [i, setI] = useState(0)

  useEffect(() => {
    if (editable || images.length < 2) return
    const t = setInterval(() => setI((v) => (v + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [editable, images.length, interval])

  const go = (d) => setI((v) => (v + d + images.length) % images.length)

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400" style={{ height }}>
        <Images className="h-5 w-5" /> Carousel — add images in the panel
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden" style={{ height, borderRadius: rounded }}>
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <span key={idx} className={'h-2 w-2 rounded-full ' + (idx === i ? 'bg-white' : 'bg-white/50')} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Carousel
