const Gallery = ({ props = {} }) => {
  const images = Array.isArray(props.images) ? props.images : []
  const cols = props.columns || 3
  if (images.length === 0) {
    return <div className="px-8 py-10 text-center text-sm text-slate-400">Gallery — add images in the panel</div>
  }
  return (
    <section className="px-8 py-10">
      <div className="mx-auto grid max-w-5xl gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {images.map((src, i) => (
          <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
        ))}
      </div>
    </section>
  )
}

export default Gallery
