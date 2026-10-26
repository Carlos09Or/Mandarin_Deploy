import { useId } from 'react'
import { outfitFor, type FriendId, type Outfit } from '../data/friends'
import { useProgress } from '../lib/progress'
import { Mascot, type Mood } from './Mascot'
import { BandaShako, Motas, PolleraCollar, SombreroPintao, Tembleques, WavingFlag } from './Patriotic'

// Wāwa's friends. Motion lives in index.css (`.friend-*`, `.harpia-*`, `.sloth-*`, `.tucan-*`, `.fly-*`).

/** Moods a friend can show; Wāwa's extra poses ('wave', 'fire') map onto these. */
export type FriendMood = 'idle' | 'happy' | 'sad' | 'celebrate'

type Props = { size?: number; mood?: FriendMood; outfit?: Outfit }

const useOutfit = (id: FriendId, outfit?: Outfit) => {
  const saved = useProgress().outfits[id]
  return outfit ?? outfitFor(id, saved)
}

const Branch = ({ y, x1 = 18, x2 = 182 }: { y: number; x1?: number; x2?: number }) => (
  <g>
    <rect x={x1} y={y} width={x2 - x1} height="12" rx="6" fill="#8a5a34" />
    <ellipse cx={x1 + 12} cy={y - 4} rx="10" ry="5" fill="#5b8f3a" transform={`rotate(-20 ${x1 + 12} ${y - 4})`} />
    <ellipse cx={x2 - 10} cy={y - 2} rx="9" ry="4.5" fill="#6fa64a" transform={`rotate(15 ${x2 - 10} ${y - 2})`} />
  </g>
)

const Eye = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g className="friend-look">
    <g className="friend-blink">
      <circle cx={cx} cy={cy} r={r} fill="#2b2420" />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.36} fill="#fff" />
      <circle cx={cx - r * 0.3} cy={cy + r * 0.38} r={r * 0.16} fill="#fff" />
    </g>
  </g>
)

const Sparkles = () => (
  <g>
    {[
      [18, 50, 0],
      [182, 44, 0.3],
      [12, 128, 0.6],
      [188, 120, 0.9],
    ].map(([x, y, d]) => (
      <path
        key={x}
        className="wawa-spark"
        style={{ animationDelay: `${d}s` }}
        d={`M${x} ${y - 10} L${x + 3} ${y - 3} L${x + 10} ${y} L${x + 3} ${y + 3} L${x} ${y + 10} L${x - 3} ${y + 3} L${x - 10} ${y} L${x - 3} ${y - 3}Z`}
        fill="#f2b544"
      />
    ))}
  </g>
)

const Drop = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x} ${y} Q${x + 6} ${y + 10} ${x} ${y + 14} Q${x - 6} ${y + 10} ${x} ${y}Z`} fill="#8fd3ff" />
)

/** Yīngyīng, the harpy eagle (national bird): split crest, black chest band, yellow talons. */
export function Harpia({ size = 140, mood = 'idle', outfit }: Props) {
  const look = useOutfit('harpia', outfit)
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`friend friend-${mood}`} aria-label="Yīngyīng, el águila harpía">
      <Branch y={166} />
      {mood === 'celebrate' && <Sparkles />}
      <g className="friend-body">
        <path d="M88 160 L100 192 L112 160Z" fill="#3d3f45" />
        {look === 'bandera' && <WavingFlag x1={148} y1={168} x2={166} y2={52} />}
        <g className="harpia-wing-l">
          <ellipse cx="62" cy="130" rx="18" ry="38" fill="#4a4e57" transform="rotate(12 62 130)" />
        </g>
        <g className="harpia-wing-r">
          <ellipse cx="138" cy="130" rx="18" ry="38" fill="#4a4e57" transform="rotate(-12 138 130)" />
        </g>
        <ellipse cx="100" cy="128" rx="42" ry="44" fill="#8e939c" />
        <ellipse cx="100" cy="142" rx="30" ry="28" fill="#f6f3ee" />
        <path d="M66 110 Q100 128 134 110 Q134 122 100 136 Q66 122 66 110Z" fill="#3d3f45" />
        <ellipse cx="86" cy="168" rx="9" ry="6" fill="#f2b544" />
        <ellipse cx="114" cy="168" rx="9" ry="6" fill="#f2b544" />
        {[80, 86, 92, 108, 114, 120].map((x, i) => (
          <circle key={x} cx={x} cy={i % 3 === 1 ? 175 : 173} r="2.4" fill="#2b2420" />
        ))}

        <g className="harpia-head">
          {look !== 'banda' &&
            // The split crest: a fan of pointed feathers, longest at the sides
            [
              [-58, 27],
              [-38, 24],
              [-18, 19],
              [0, 14],
              [18, 19],
              [38, 24],
              [58, 27],
            ].map(([angle, len], i) => (
              <path
                key={angle}
                d={`M94 38 Q100 ${38 - len * 2.7} 106 38Z`}
                fill={i % 2 ? '#5a5e66' : '#3d3f45'}
                transform={`rotate(${angle} 100 42)`}
              />
            ))}
          <circle cx="100" cy="72" r="42" fill="#b9bec6" />
          <ellipse cx="100" cy="80" rx="33" ry="28" fill="#e6e8ec" />
          <Eye cx={84} cy={74} r={11} />
          <Eye cx={116} cy={74} r={11} />
          <path
            d={mood === 'sad' ? 'M72 64 L92 57 M128 64 L108 57' : 'M72 60 L92 65 M128 60 L108 65'}
            stroke="#3d3f45"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="72" cy="91" rx="8" ry="5" fill="#ff8a73" opacity=".45" />
          <ellipse cx="128" cy="91" rx="8" ry="5" fill="#ff8a73" opacity=".45" />
          <path d="M90 84 Q100 78 110 84 Q110 96 102 104 Q100 106 99 103 Q96 98 90 84Z" fill="#3a3a40" />
          <path d="M94 85 Q100 82 105 85" stroke="#8e939c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {look === 'banda' && <BandaShako cx={100} cy={40} scale={1.05} />}
          {mood === 'sad' && <Drop x={140} y={46} />}
        </g>
      </g>
    </svg>
  )
}

/** Lǎnlǎn, the sloth: hangs from a branch, swaying slowly, asleep unless something happens. */
export function Sloth({ size = 140, mood = 'idle', outfit }: Props) {
  const look = useOutfit('sloth', outfit)
  const awake = mood !== 'idle'
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`friend friend-${mood}`} aria-label="Lǎnlǎn, el perezoso">
      {mood === 'celebrate' && <Sparkles />}
      <g className="sloth-swing">
        <path d="M78 96 Q64 62 72 32 M122 96 Q136 62 128 32" stroke="#a07d58" strokeWidth="16" strokeLinecap="round" fill="none" />
        <ellipse cx="84" cy="166" rx="10" ry="8" fill="#a07d58" />
        <ellipse cx="116" cy="166" rx="10" ry="8" fill="#a07d58" />
        <ellipse cx="100" cy="128" rx="36" ry="40" fill="#b8936d" />
        <ellipse cx="100" cy="136" rx="22" ry="26" fill="#d9bf9c" />
        {look === 'montuno' && (
          // Camisilla: the pleated white shirt of the montuno, embroidered at the collar
          <g>
            <path d="M68 104 Q100 114 132 104 L135 152 Q100 166 65 152Z" fill="#fbfaf3" />
            <path d="M90 116 L90 156 M110 116 L110 156 M100 118 L100 160" stroke="#e7e1d3" strokeWidth="1.5" />
            <path
              d="M72 108 L77 113 L82 108 L87 113 L92 108 L97 113 L102 108 L107 113 L112 108 L117 113 L122 108 L127 113"
              stroke="#e0453a"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            {[80, 92, 104, 116].map((x) => (
              <circle key={x} cx={x} cy={118} r="1.6" fill="#2a6fd4" />
            ))}
          </g>
        )}
        {look === 'pollera' && (
          <g>
            <PolleraCollar x1={70} x2={130} y={106} dip={6} />
            <Motas cx={100} cy={122} gap={22} r={8} />
          </g>
        )}
        <circle cx="100" cy="86" r="30" fill="#b8936d" />
        <ellipse cx="100" cy="90" rx="24" ry="18" fill="#f0dfc6" />
        <path d="M78 88 Q86 78 96 88 Q88 96 78 88Z M122 88 Q114 78 104 88 Q112 96 122 88Z" fill="#5b4636" />
        {awake ? (
          <>
            <circle cx="87" cy="88" r="4" fill="#fff" />
            <circle cx="113" cy="88" r="4" fill="#fff" />
            <g className="friend-look">
              <circle cx="87.5" cy="88.5" r="2.4" fill="#2b2420" />
              <circle cx="112.5" cy="88.5" r="2.4" fill="#2b2420" />
            </g>
          </>
        ) : (
          <path d="M82 87 Q87 91 92 87 M108 87 Q113 91 118 87" stroke="#f0dfc6" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        )}
        <ellipse cx="100" cy="96" rx="5" ry="3.5" fill="#3d2e22" />
        {mood === 'happy' || mood === 'celebrate' ? (
          <path d="M93 101 Q100 110 107 101Z" fill="#7a2a1e" />
        ) : mood === 'sad' ? (
          <path d="M94 106 Q100 101 106 106" stroke="#3d2e22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M94 102 Q100 106 106 102" stroke="#3d2e22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        <ellipse cx="82" cy="99" rx="5" ry="3" fill="#ff8a73" opacity=".5" />
        <ellipse cx="118" cy="99" rx="5" ry="3" fill="#ff8a73" opacity=".5" />
        {look === 'montuno' && <SombreroPintao cx={100} cy={60} scale={0.72} />}
        {look === 'pollera' && <Tembleques cx={100} cy={78} r={30} />}
        {mood === 'sad' && <Drop x={130} y={64} />}
      </g>
      <Branch y={24} x1={6} x2={194} />
      {[66, 72, 78, 122, 128, 134].map((x, i) => (
        <circle key={x} cx={x} cy={i % 3 === 1 ? 23 : 25} r="3" fill="#4a3a2a" />
      ))}
      {mood === 'idle' &&
        [
          [134, 74, 15, 0],
          [146, 60, 12, 1],
          [156, 48, 9, 2],
        ].map(([x, y, fs, d]) => (
          <text
            key={x}
            x={x}
            y={y}
            className="sloth-z"
            style={{ animationDelay: `${d}s`, fontSize: fs, fontWeight: 900 }}
            fill="#8b7f75"
          >
            z
          </text>
        ))}
    </svg>
  )
}

/** Zuǐzuǐ, the keel-billed toucan: rainbow bill, yellow bib, blue feet; plays with a berry. */
export function Tucan({ size = 140, mood = 'idle', outfit }: Props) {
  const look = useOutfit('tucan', outfit)
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`friend friend-${mood}`} aria-label="Zuǐzuǐ, el tucán">
      <defs>
        <clipPath id={`bill-${id}`}>
          <path d="M112 64 Q152 52 186 80 Q182 92 168 94 Q140 98 112 94 Q106 80 112 64Z" />
        </clipPath>
      </defs>
      <Branch y={166} x1={14} x2={168} />
      {mood === 'celebrate' && <Sparkles />}
      <g className="tucan-body">
        <path d="M70 150 L56 190 L78 186 L86 156Z" fill="#1f1f24" />
        <ellipse cx="88" cy="128" rx="32" ry="42" fill="#1f1f24" />
        <ellipse cx="84" cy="164" rx="12" ry="6" fill="#e0453a" />
        <ellipse cx="80" cy="168" rx="7" ry="5" fill="#3b8fd9" />
        <ellipse cx="98" cy="168" rx="7" ry="5" fill="#3b8fd9" />
        <ellipse cx="98" cy="104" rx="22" ry="22" fill="#ffd43b" />
        <path d="M78 120 Q98 130 116 118" stroke="#e0453a" strokeWidth="3" fill="none" strokeLinecap="round" />
        {look === 'pollera' && (
          <g>
            <PolleraCollar x1={76} x2={120} y={96} dip={5} />
            <Motas cx={98} cy={112} gap={18} r={7} />
          </g>
        )}
        <circle cx="92" cy="76" r="28" fill="#1f1f24" />
        <ellipse cx="104" cy="90" rx="14" ry="12" fill="#ffd43b" />
        <circle cx="104" cy="72" r="10" fill="#7bd389" />
        <Eye cx={106} cy={73} r={5.5} />
        {/* Carries the flags of Panama and China crossed in its bill, the way toucans carry fruit */}
        {look === 'banderas' && (
          <g>
            <WavingFlag x1={150} y1={84} x2={124} y2={20} w={34} />
            <WavingFlag x1={146} y1={84} x2={174} y2={26} w={34} country="china" delay={0.4} />
          </g>
        )}
        <g clipPath={`url(#bill-${id})`}>
          <rect x="100" y="50" width="36" height="50" fill="#7cc04b" />
          <rect x="136" y="50" width="24" height="50" fill="#f2802a" />
          <rect x="160" y="50" width="30" height="50" fill="#e0453a" />
          <path d="M112 93 Q142 97 176 90" stroke="#3b8fd9" strokeWidth="6" fill="none" />
        </g>
        <path d="M114 86 Q146 88 180 82" stroke="#1f1f24" strokeWidth="1.4" fill="none" />
        <path d="M112 64 Q152 52 186 80 Q182 92 168 94 Q140 98 112 94" stroke="#1f1f24" strokeWidth="1.5" fill="none" />
        {look === 'pollera' && <Tembleques cx={90} cy={66} r={26} count={6} />}
        {mood === 'sad' && <Drop x={70} y={46} />}
      </g>
      {mood === 'idle' && look !== 'banderas' && (
        <g className="tucan-berry">
          <circle cx="182" cy="76" r="6" fill="#8a3fbf" />
          <circle cx="184" cy="74" r="1.8" fill="#fff" opacity=".8" />
        </g>
      )}
    </svg>
  )
}

/** Wāwa catching a fly with her tongue. */
export function FlyScene({ size = 120 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Mascot mood="idle" size={size} />
      <svg viewBox="0 0 200 200" width={size} height={size} className="friend absolute inset-0" aria-hidden>
        <path className="fly-tongue" d="M100 106 L186 56" stroke="#ff7f7f" strokeWidth="7" strokeLinecap="round" />
        <g className="fly">
          <ellipse className="fly-wing" cx="-4" cy="-8" rx="7" ry="4.5" fill="#cfe9ff" stroke="#9cc6ee" strokeWidth="1" transform="rotate(-30 -4 -8)" />
          <ellipse className="fly-wing" cx="5" cy="-8" rx="7" ry="4.5" fill="#cfe9ff" stroke="#9cc6ee" strokeWidth="1" transform="rotate(30 5 -8)" />
          <ellipse cx="0" cy="0" rx="7.5" ry="6" fill="#2b2420" />
          <circle cx="5" cy="-1.5" r="2.2" fill="#e0453a" />
        </g>
        <text x="150" y="18" className="fly-yum" fill="#e0453a" style={{ fontSize: 20, fontWeight: 900 }}>
          ¡ñam!
        </text>
      </svg>
    </div>
  )
}

/** Any character showing a mood: Wāwa uses her own drawing, the others theirs. */
export function Buddy({ id, mood = 'idle', size = 140, outfit }: { id: FriendId; mood?: Mood; size?: number; outfit?: Outfit }) {
  if (id === 'wawa') return <Mascot mood={mood} size={size} look={outfit} />
  const m: FriendMood = mood === 'fire' ? 'celebrate' : mood === 'wave' ? 'idle' : mood
  if (id === 'harpia') return <Harpia size={size} mood={m} outfit={outfit} />
  if (id === 'sloth') return <Sloth size={size} mood={m} outfit={outfit} />
  return <Tucan size={size} mood={m} outfit={outfit} />
}

/** The animated scene for a friend beside the lesson path. */
export function FriendScene({ id, size = 160 }: { id: FriendId; size?: number }) {
  if (id === 'wawa') return <FlyScene size={size * 0.9} />
  return <Buddy id={id} size={size} />
}
