import { getEmbedUrl } from '../lib/pageBuilder'

// Presentational render of a single canvas element. `editable` strips the live
// link behavior on buttons so clicks select instead of navigate.
const CanvasElement = ({ el, editable = false, positioned = true }) => {
  const s = el.style || {}
  const base = positioned
    ? { position: 'absolute', left: el.x, top: el.y, width: el.w }
    : { position: 'relative', width: '100%' }

  if (el.type === 'video') {
    const embed = getEmbedUrl(el.content)
    const height = Math.round((el.w * 9) / 16)
    if (!el.content) {
      return (
        <div style={{ ...base, height, borderRadius: s.radius ?? 12 }} className="flex items-center justify-center bg-slate-100 text-xs text-slate-400">
          No video
        </div>
      )
    }
    if (embed) {
      return (
        <iframe
          src={embed}
          title="video"
          style={{ ...base, height, borderRadius: s.radius ?? 12, border: 0 }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )
    }
    return (
      <video
        src={el.content}
        style={{ ...base, borderRadius: s.radius ?? 12 }}
        muted
        loop
        autoPlay
        playsInline
        controls
      />
    )
  }

  if (el.type === 'image') {
    return el.content ? (
      <img src={el.content} alt="" draggable={false} style={{ ...base, borderRadius: s.radius ?? 8, objectFit: 'cover', userSelect: 'none' }} />
    ) : (
      <div style={{ ...base, height: 160, borderRadius: s.radius ?? 8 }} className="flex items-center justify-center bg-slate-100 text-xs text-slate-400">
        No image
      </div>
    )
  }

  if (el.type === 'button') {
    const hasH = typeof el.h === 'number'
    const style = {
      ...base,
      background: s.bg,
      color: s.color,
      borderRadius: s.radius ?? 10,
      fontSize: s.fontSize,
      fontWeight: 600,
      textDecoration: 'none',
      boxSizing: 'border-box',
      cursor: editable ? 'move' : 'pointer',
      userSelect: 'none',
      ...(hasH
        ? { height: el.h, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px' }
        : { display: 'inline-block', textAlign: 'center', padding: '10px 18px' }),
    }
    if (editable) return <div style={style}>{el.content}</div>
    return (
      <a href={el.href || '#'} target="_blank" rel="noopener noreferrer" style={style}>
        {el.content}
      </a>
    )
  }

  if (el.type === 'shape') {
    const fill = s.bg || '#059669'
    if (el.shape === 'triangle') {
      return (
        <svg width={positioned ? el.w : '100%'} height={el.h} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ ...base, height: el.h, display: 'block' }}>
          <polygon points="50,0 100,100 0,100" fill={fill} />
        </svg>
      )
    }
    return (
      <div
        style={{
          ...base,
          height: el.h,
          background: fill,
          borderRadius: el.shape === 'ellipse' ? '50%' : s.radius ?? 8,
        }}
      />
    )
  }

  if (el.type === 'draw') {
    const pts = (el.points || []).map((p) => p.join(',')).join(' ')
    return (
      <svg
        viewBox={`0 0 ${el.vbW || el.w} ${el.vbH || el.h}`}
        preserveAspectRatio="none"
        width={positioned ? el.w : '100%'}
        height={el.h}
        style={{ ...base, height: el.h, display: 'block', overflow: 'visible' }}
      >
        <polyline points={pts} fill="none" stroke={s.stroke || '#111827'} strokeWidth={s.strokeWidth || 4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // text / heading
  return (
    <div
      style={{
        ...base,
        fontSize: s.fontSize,
        color: s.color,
        fontWeight: s.bold ? 700 : 400,
        textAlign: s.align || 'left',
        lineHeight: 1.3,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        userSelect: 'none',
      }}
    >
      {el.content}
    </div>
  )
}

export default CanvasElement
