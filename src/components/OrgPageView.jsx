import { useEffect, useRef, useState } from 'react'
import CanvasElement from './CanvasElement'
import { normalizeConfig } from '../lib/pageBuilder'

// Read-only render of a multi-page canvas. Each page scales by its OWN width to
// fit the viewport (pages can be different widths).
const OrgPageView = ({ config }) => {
  const cfg = normalizeConfig(config)
  const wrapRef = useRef(null)
  const [containerW, setContainerW] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setContainerW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const bgStyle = (bg) =>
    bg?.type === 'image' && bg.image
      ? { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: bg?.color || '#ffffff' }

  const backdrop = cfg.background ?? { type: 'color', color: '#e2e8f0' }
  const backdropStyle =
    backdrop.type === 'image' && backdrop.image
      ? { backgroundImage: `url(${backdrop.image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
      : { backgroundColor: backdrop.color || '#e2e8f0' }

  return (
    <div ref={wrapRef} className="w-full" style={{ paddingTop: 24, paddingBottom: 24, minHeight: '100vh', ...backdropStyle }}>
      {cfg.pages.map((page, idx) => {
        const scale = containerW ? Math.min(1, containerW / page.width) : 1
        return (
          <div key={page.id} className="mx-auto" style={{ width: page.width * scale, height: page.height * scale, marginTop: idx === 0 ? 0 : 24 }}>
            <div
              style={{
                width: page.width,
                height: page.height,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'relative',
                overflow: 'hidden',
                ...bgStyle(page.background),
              }}
            >
              {page.elements.map((el) => (
                <CanvasElement key={el.id} el={el} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OrgPageView
