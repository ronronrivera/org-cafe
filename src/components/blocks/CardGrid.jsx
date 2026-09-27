const CardGrid = ({ props = {} }) => {
  const cards = Array.isArray(props.cards) ? props.cards : []
  const cols = props.columns || 3
  return (
    <section className="px-8 py-10">
      {props.title && <h2 className="mb-6 text-center text-2xl font-bold text-slate-800 md:text-3xl">{props.title}</h2>}
      <div className="mx-auto grid max-w-5xl gap-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cards.map((card, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            {card.image && <img src={card.image} alt="" className="h-40 w-full object-cover" />}
            <div className="p-4">
              <h3 className="font-semibold text-slate-800">{card.title || 'Card title'}</h3>
              {card.text && <p className="mt-1 text-sm text-slate-500">{card.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default CardGrid
