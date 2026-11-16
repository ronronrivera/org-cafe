import campusPhoto from '../assets/csu.png'

// Small grid of dots used as a decorative accent.
export const Dots = ({ cols = 3, rows = 6, className = '' }) => (
  <div
    aria-hidden
    className={'pointer-events-none absolute grid gap-x-6 gap-y-6 ' + className}
    style={{ gridTemplateColumns: `repeat(${cols}, 0.375rem)` }}
  >
    {Array.from({ length: cols * rows }, (_, i) => (
      <span key={i} className="h-1.5 w-1.5 rounded-full bg-current" />
    ))}
  </div>
)

// The landing-page hero backdrop: green gradient, tinted campus photo on the
// right, layered waves, and a curved white bottom edge. Place it as the first
// child of a `relative overflow-hidden` container; content goes after it with
// `relative` so it stacks on top.
const HeroBackground = () => (
  <>
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#03765b] to-[#058a69]" />
    {/* Campus photo, tinted and faded into the gradient on its left edge */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] md:block"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 45%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 45%)',
      }}
    >
      <img src={campusPhoto} alt="" className="h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-emerald-700/35 mix-blend-multiply" />
    </div>

    {/* Layered waves: dark corner, bright blade, wedge, and the teal band over the curved bottom edge */}
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 600"
      preserveAspectRatio="none"
    >
      <path d="M0 0H206C180 170 120 320 39 384H0Z" fill="#034a3a" />
      <path d="M0 384H39L440 220L212 431L0 450Z" fill="#05604b" />
      <path d="M206 0H300C270 190 170 330 39 384C120 320 180 170 206 0Z" fill="#22b38a" />
      <path d="M0 470C120 400 260 420 480 480C760 555 1100 560 1440 470V600H0Z" fill="#4fc6a5" />
      <path d="M0 545C200 500 380 520 600 560C900 610 1200 590 1440 520V600H0Z" fill="#f8fafc" />
    </svg>

    <Dots cols={5} rows={4} className="left-5 top-20 hidden text-emerald-400 md:grid" />
  </>
)

export default HeroBackground
