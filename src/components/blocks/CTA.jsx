const CTA = ({ props = {}, editable = false }) => (
  <section className="flex flex-col items-center gap-4 px-8 py-12 text-center" style={{ background: props.bg || '#059669', color: props.color || '#ffffff' }}>
    <h2 className="text-2xl font-bold md:text-3xl">{props.text || 'Ready to join us?'}</h2>
    {props.buttonLabel && (
      <a href={editable ? undefined : props.buttonHref || '#'} onClick={editable ? (e) => e.preventDefault() : undefined} className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
        {props.buttonLabel}
      </a>
    )}
  </section>
)

export default CTA
