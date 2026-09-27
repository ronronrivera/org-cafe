const TextBlock = ({ props = {} }) => (
  <section className="px-8 py-10" style={{ textAlign: props.align || 'left', color: props.color || '#0f172a' }}>
    <div className="mx-auto max-w-3xl">
      {props.heading && <h2 className="text-2xl font-bold md:text-3xl">{props.heading}</h2>}
      {props.body && <p className="mt-3 whitespace-pre-line leading-relaxed" style={{ color: props.bodyColor || '#475569' }}>{props.body}</p>}
    </div>
  </section>
)

export default TextBlock
