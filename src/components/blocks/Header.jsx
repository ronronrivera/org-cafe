// Site header / nav block. Props: { title, logo, links:[{label,href}], bg, color }.
const Header = ({ props = {}, editable = false }) => {
  const links = Array.isArray(props.links) ? props.links : []
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4" style={{ background: props.bg || '#0f766e', color: props.color || '#ffffff' }}>
      <div className="flex min-w-0 items-center gap-2.5">
        {props.logo && <img src={props.logo} alt="" className="h-9 w-9 rounded-md object-cover" />}
        <span className="truncate text-lg font-semibold">{props.title || 'Organization'}</span>
      </div>
      <nav className="flex items-center gap-1">
        {links.map((l, i) =>
          editable ? (
            <span key={i} className="rounded-md px-3 py-1.5 text-sm font-medium">{l.label || 'Link'}</span>
          ) : (
            <a key={i} href={l.href || '#'} className="rounded-md px-3 py-1.5 text-sm font-medium transition hover:bg-white/10">{l.label || 'Link'}</a>
          ),
        )}
      </nav>
    </header>
  )
}

export default Header
