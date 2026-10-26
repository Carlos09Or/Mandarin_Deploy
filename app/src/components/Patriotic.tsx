// Panamanian patriotic pieces shared by every character's outfits, drawn for a 200×200 viewBox.

const BLUE = '#005293'
const RED = '#d21034'

/** Points of a five-pointed star. */
const star = (cx: number, cy: number, r: number) =>
  [...Array(10)]
    .map((_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2
      const d = i % 2 ? r * 0.42 : r
      return `${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`
    })
    .join(' ')

/** The flag of Panama: white with a blue star, red, blue, white with a red star. */
export function PanamaFlag({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = Math.min(w, h) * 0.17
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fff" />
      <rect x={x + w / 2} y={y} width={w / 2} height={h / 2} fill={RED} />
      <rect x={x} y={y + h / 2} width={w / 2} height={h / 2} fill={BLUE} />
      <polygon points={star(x + w / 4, y + h / 4, r)} fill={BLUE} />
      <polygon points={star(x + (3 * w) / 4, y + (3 * h) / 4, r)} fill={RED} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#c9c2b8" strokeWidth="1" />
    </g>
  )
}

/** A flag on a pole that waves. The pole runs from (x1, y1) at the bottom to (x2, y2) at the top. */
export function WavingFlag({ x1, y1, x2, y2, w = 42 }: { x1: number; y1: number; x2: number; y2: number; w?: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8a5a34" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={x2} cy={y2 - 2} r="3.5" fill="#f2b544" />
      <g className="flag-wave">
        <PanamaFlag x={x2} y={y2} w={w} h={w * 0.66} />
      </g>
    </g>
  )
}

/** Sombrero pintao, the woven black-and-white hat from Coclé, centred on (cx, cy) at its brim. */
export function SombreroPintao({ cx, cy, scale = 1, tilt = -8 }: { cx: number; cy: number; scale?: number; tilt?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale}) rotate(${tilt}) translate(-100 -33)`}>
      <ellipse cx="100" cy="33" rx="47" ry="9.5" fill="#f4e7c6" stroke="#b89c62" strokeWidth="2" />
      <ellipse cx="100" cy="33" rx="39" ry="7" fill="none" stroke="#2b2420" strokeWidth="1.6" strokeDasharray="5 3" />
      <ellipse cx="100" cy="33" rx="31" ry="5.2" fill="none" stroke="#2b2420" strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M77 33 C77 15 83 8 100 8 C117 8 123 15 123 33Z" fill="#f4e7c6" stroke="#b89c62" strokeWidth="2" />
      <path
        d="M85 12 L85 23 M93 9.5 L93 23 M100 8.5 L100 23 M107 9.5 L107 23 M115 12 L115 23"
        stroke="#2b2420"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
      <rect x="77" y="23" width="46" height="7" rx="2" fill="#2b2420" />
    </g>
  )
}

const TEMBLEQUE_COLORS = ['#ff6fae', '#fff6dc', '#ffd23f', '#7fd0f5', '#fff6dc', '#ff6fae', '#ffd23f']

/** Tembleques: the beaded flowers that tremble in a pollera headdress, in an arc over (cx, cy). */
export function Tembleques({ cx, cy, r, count = 7 }: { cx: number; cy: number; r: number; count?: number }) {
  return (
    <g>
      {[...Array(count)].map((_, i) => {
        const a = Math.PI + (Math.PI * (i + 0.5)) / count
        const x = cx + r * Math.cos(a)
        const y = cy + r * Math.sin(a)
        const c = TEMBLEQUE_COLORS[i % TEMBLEQUE_COLORS.length]
        return (
          <g key={i} className="tembleque" style={{ animationDelay: `${(i % 3) * 0.12}s` }}>
            <line x1={cx + (r - 10) * Math.cos(a)} y1={cy + (r - 10) * Math.sin(a)} x2={x} y2={y} stroke="#f2b544" strokeWidth="1.5" />
            {[0, 72, 144, 216, 288].map((d) => (
              <circle
                key={d}
                cx={x + 4.2 * Math.cos((d * Math.PI) / 180)}
                cy={y + 4.2 * Math.sin((d * Math.PI) / 180)}
                r="3.4"
                fill={c}
                stroke="#e3c27a"
                strokeWidth="0.6"
              />
            ))}
            <circle cx={x} cy={y} r="2.4" fill="#f2b544" />
          </g>
        )
      })}
    </g>
  )
}

/** Motas: the two big wool pompoms on the front of a pollera. */
export function Motas({ cx, cy, gap, r = 8, color = '#e0453a' }: { cx: number; cy: number; gap: number; r?: number; color?: string }) {
  return (
    <g>
      {[cx - gap / 2, cx + gap / 2].map((x) => (
        <g key={x}>
          {[...Array(10)].map((_, i) => (
            <circle
              key={i}
              cx={x + r * 0.8 * Math.cos((i * Math.PI) / 5)}
              cy={cy + r * 0.8 * Math.sin((i * Math.PI) / 5)}
              r={r * 0.42}
              fill={color}
            />
          ))}
          <circle cx={x} cy={cy} r={r * 0.8} fill={color} />
          <circle cx={x - r * 0.25} cy={cy - r * 0.25} r={r * 0.22} fill="#fff" opacity=".35" />
        </g>
      ))}
    </g>
  )
}

/** The ruffled, lace-edged collar of a pollera, along a curve from x1 to x2 dipping to `dip`. */
export function PolleraCollar({ x1, x2, y, dip }: { x1: number; x2: number; y: number; dip: number }) {
  const n = 9
  return (
    <g>
      {[...Array(n)].map((_, i) => {
        const t = i / (n - 1)
        const x = x1 + (x2 - x1) * t
        const yy = y + dip * 4 * t * (1 - t)
        return <circle key={i} cx={x} cy={yy} r="5.5" fill="#fffdf6" stroke="#e7dccb" strokeWidth="0.8" />
      })}
      <path
        d={`M${x1} ${y - 2} Q${(x1 + x2) / 2} ${y - 2 + dip * 2} ${x2} ${y - 2}`}
        fill="none"
        stroke={RED}
        strokeWidth="1.6"
        strokeDasharray="3 2"
      />
    </g>
  )
}

/** School marching-band shako (banda de guerra), as in the November parades, brim at (cx, cy). */
export function BandaShako({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(-100 -40)`}>
      <ellipse cx="100" cy="2" rx="5.5" ry="12" fill={RED} />
      <ellipse cx="100" cy="-6" rx="3.5" ry="5" fill="#fff" />
      <path d="M77 40 L81 8 Q100 4 119 8 L123 40Z" fill="#1f3a6e" />
      <path d="M81 8 Q100 4 119 8 L118.4 13 Q100 9 81.6 13Z" fill="#f2b544" />
      <polygon points={star(100, 24, 8)} fill="#f2b544" />
      <path d="M78 34 Q100 38 122 34" stroke="#f2b544" strokeWidth="2" fill="none" />
      <ellipse cx="100" cy="41" rx="28" ry="5.5" fill="#111827" />
    </g>
  )
}
