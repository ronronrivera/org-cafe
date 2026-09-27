const Hero = ({ props = {}, editable = false }) => {
  const bgStyle = props.image
    ? { backgroundImage: `url(${props.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: props.bgColor || '#0f766e' }
  const alignItems = props.align === 'left' ? 'flex-start' : 'center'
  const textAlign = props.align === 'left' ? 'left' : 'center'
  return (
    <section className="relative flex flex-col justify-center overflow-hidden px-8" style={{ minHeight: props.height || 380, color: props.color || '#ffffff', alignItems, textAlign, ...bgStyle }}>
      {props.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(props.overlay ?? 35) / 100})` }} />}
      <div className="relative max-w-3xl">
        <h1 className="text-3xl font-bold md:text-5xl">{props.heading || 'Welcome'}</h1>
        {props.subheading && <p className="mt-3 text-base opacity-90 md:text-lg">{props.subheading}</p>}
        {props.buttonLabel && (
          <a href={editable ? undefined : props.buttonHref || '#'} onClick={editable ? (e) => e.preventDefault() : undefined} className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            {props.buttonLabel}
          </a>
        )}
      </div>
    </section>
  )
}

export default Hero
