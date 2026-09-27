const ButtonBlock = ({ props = {}, editable = false }) => {
  const align = props.align || 'center'
  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
  return (
    <div className="px-8 py-6" style={{ display: 'flex', justifyContent: justify }}>
      <a
        href={editable ? undefined : props.href || '#'}
        onClick={editable ? (e) => e.preventDefault() : undefined}
        target={editable ? undefined : '_blank'}
        rel="noopener noreferrer"
        className="inline-block transition hover:opacity-90"
        style={{ background: props.bg || '#059669', color: props.color || '#ffffff', borderRadius: props.radius ?? 10, padding: '12px 24px', fontSize: props.size || 16, fontWeight: 600, textDecoration: 'none' }}
      >
        {props.label || 'Button'}
      </a>
    </div>
  )
}

export default ButtonBlock
