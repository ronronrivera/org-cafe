import { useEffect, useRef, useState } from 'react'
import CanvasElement from './CanvasElement'
import Block from './blocks/Block'
import { normalizeConfig } from '../lib/pageBuilder'

// Read-only render of a multi-page, multi-section design. Canvas sections scale
// by their page width; component blocks flow responsively.
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
      {cfg.pages.map((page, pi) => {
        const scale = containerW ? Math.min(1, containerW / page.width) : 1
        const colW = page.width * scale
        return (
          <div key={page.id} className="mx-auto" style={{ width: colW, marginTop: pi === 0 ? 0 : 24 }}>
            {page.sections.map((section, si) => (
              <div key={section.id} style={{ height: section.height * scale, marginTop: si === 0 ? 0 : 16 }}>
                <div
                  style={{
                    width: page.width,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'relative',
                    ...(section.kind === 'canvas'
                      ? { height: section.height, overflow: 'hidden', ...bgStyle(section.background) }
                      : {}),
                  }}
                >
                  {section.kind === 'component' && <Block section={section} />}
                  {(section.elements || []).map((el) => (
                    <CanvasElement key={el.id} el={el} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default OrgPageView
