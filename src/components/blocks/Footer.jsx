const Footer = ({ props = {}, editable = false }) => {
  const links = Array.isArray(props.links) ? props.links : []
  return (
    <footer className="px-8 py-8" style={{ background: props.bg || '#0f172a', color: props.color || '#e2e8f0' }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        {links.length > 0 && (
          <nav className="flex flex-wrap items-center justify-center gap-4">
            {links.map((l, i) =>
              editable ? (
                <span key={i} className="text-sm">{l.label || 'Link'}</span>
              ) : (
                <a key={i} href={l.href || '#'} className="text-sm transition hover:underline">{l.label || 'Link'}</a>
              ),
            )}
          </nav>
        )}
        <p className="text-sm opacity-80">{props.text || '© 2026 Organization'}</p>
      </div>
    </footer>
  )
}

export default Footer
