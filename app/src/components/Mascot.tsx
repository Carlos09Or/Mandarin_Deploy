import { lookFor, useProgress, type Look } from '../lib/progress'

// Wāwa (蛙蛙), a Panamanian golden frog. Gold for luck in Panama and in China (金蟾).
// Poses are CSS animations in index.css (`.wawa-*`), so the drawing stays a plain SVG.

export type Mood = 'idle' | 'happy' | 'sad' | 'celebrate' | 'wave' | 'fire'

const GOLD = '#f9bf2c'
const GOLD_DARK = '#eaa31c'
const BELLY = '#ffe08a'
const INK = '#3b2a1e'

type Props = { mood?: Mood; look?: Look; size?: number; className?: string }

export function Mascot({ mood = 'idle', look, size = 160, className = '' }: Props) {
  const saved = useProgress().look
  const style = look ?? lookFor(saved)
  const openMouth = mood === 'happy' || mood === 'celebrate' || mood === 'fire'

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`wawa wawa-${mood} ${className}`}
      role="img"
      aria-label="Wāwa, la rana dorada"
    >
      <ellipse className="wawa-shadow" cx="100" cy="188" rx="52" ry="8" fill="#2b2420" opacity=".12" />

      {mood === 'celebrate' &&
        [
          [22, 46, 0],
          [178, 40, 0.3],
          [16, 128, 0.6],
          [184, 118, 0.9],
        ].map(([x, y, d]) => (
          <path
            key={x}
            className="wawa-spark"
            style={{ animationDelay: `${d}s` }}
            d={`M${x} ${y - 10} L${x + 3} ${y - 3} L${x + 10} ${y} L${x + 3} ${y + 3} L${x} ${y + 10} L${x - 3} ${y + 3} L${x - 10} ${y} L${x - 3} ${y - 3}Z`}
            fill="#f2b544"
          />
        ))}

      <g className="wawa-frog">
        <g className="wawa-breathe">
          {/* Back legs */}
          <ellipse cx="58" cy="160" rx="30" ry="20" fill={GOLD_DARK} />
          <ellipse cx="142" cy="160" rx="30" ry="20" fill={GOLD_DARK} />
          {[24, 35, 47].map((x) => (
            <circle key={x} cx={x} cy={180} r="6" fill={GOLD_DARK} />
          ))}
          {[153, 165, 176].map((x) => (
            <circle key={x} cx={x} cy={180} r="6" fill={GOLD_DARK} />
          ))}
          <ellipse cx="40" cy="176" rx="20" ry="8" fill={GOLD_DARK} />
          <ellipse cx="160" cy="176" rx="20" ry="8" fill={GOLD_DARK} />

          {/* Eye bumps, then the body over them so they merge */}
          <circle cx="68" cy="66" r="28" fill={GOLD} />
          <circle cx="132" cy="66" r="28" fill={GOLD} />
          <path
            d="M100 54 C150 54 168 88 166 122 C164 160 138 180 100 180 C62 180 36 160 34 122 C32 88 50 54 100 54Z"
            fill={GOLD}
          />
          <ellipse cx="100" cy="142" rx="42" ry="33" fill={BELLY} />

          {/* The black blotches of Atelopus zeteki */}
          <ellipse cx="45" cy="122" rx="6" ry="8" fill={INK} transform="rotate(-20 45 122)" />
          <ellipse cx="157" cy="114" rx="5" ry="7" fill={INK} transform="rotate(15 157 114)" />
          <ellipse cx="151" cy="150" rx="7" ry="5" fill={INK} />
          <ellipse cx="51" cy="153" rx="5" ry="4" fill={INK} />

          {style === 'panuelo' && (
            <g>
              <path d="M44 114 Q100 134 156 114 L158 127 Q100 148 42 127Z" fill="#e0453a" />
              <path d="M44 114 Q100 134 156 114" fill="none" stroke="#ffd36b" strokeWidth="2.5" />
              <path d="M136 130 L150 160 L131 153Z" fill="#c8352b" />
              <path d="M140 130 L162 150 L156 134Z" fill="#e0453a" />
              <circle cx="139" cy="130" r="7" fill="#c8352b" />
            </g>
          )}

          {/* Arms */}
          <g className="wawa-arm-l">
            <path d="M50 112 C38 122 36 134 42 146" fill="none" stroke={GOLD_DARK} strokeWidth="13" strokeLinecap="round" />
            <circle cx="43" cy="150" r="8.5" fill={GOLD} />
            {[35, 43, 51].map((x, i) => (
              <circle key={x} cx={x} cy={i === 1 ? 158 : 155} r="4.2" fill={GOLD} />
            ))}
          </g>
          <g className="wawa-arm-r">
            <path d="M150 112 C162 122 164 134 158 146" fill="none" stroke={GOLD_DARK} strokeWidth="13" strokeLinecap="round" />
            <circle cx="157" cy="150" r="8.5" fill={GOLD} />
            {[149, 157, 165].map((x, i) => (
              <circle key={x} cx={x} cy={i === 1 ? 158 : 155} r="4.2" fill={GOLD} />
            ))}
          </g>

          {/* Eyes */}
          {[
            ['l', 68],
            ['r', 132],
          ].map(([side, cx]) => (
            <g key={side} className={`wawa-eye wawa-eye-${side}`}>
              <circle cx={cx} cy="64" r="20" fill="#fff" />
              <g className="wawa-pupil">
                <circle cx={side === 'l' ? 71 : 129} cy="67" r="12" fill="#2b2420" />
                <circle cx={side === 'l' ? 76 : 134} cy="61" r="5" fill="#fff" />
                <circle cx={side === 'l' ? 67 : 125} cy="72" r="2.2" fill="#fff" />
              </g>
            </g>
          ))}
          {mood === 'sad' && (
            <g stroke="#b9800f" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M52 42 Q66 40 80 33" />
              <path d="M148 42 Q134 40 120 33" />
            </g>
          )}

          <ellipse cx="54" cy="102" rx="11" ry="7" fill="#ff8a73" opacity=".55" />
          <ellipse cx="146" cy="102" rx="11" ry="7" fill="#ff8a73" opacity=".55" />
          <circle cx="93" cy="89" r="2" fill="#c98a14" />
          <circle cx="107" cy="89" r="2" fill="#c98a14" />

          {openMouth ? (
            <g>
              <path d="M76 98 Q100 134 124 98Z" fill="#7a2a1e" />
              <ellipse cx="100" cy="116" rx="11" ry="6" fill="#ff7f7f" />
            </g>
          ) : mood === 'sad' ? (
            <path d="M84 112 Q100 101 116 112" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          ) : (
            <path d="M78 99 Q100 119 122 99" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          )}
          {mood === 'sad' && <path d="M160 46 Q166 56 160 60 Q154 56 160 46Z" fill="#8fd3ff" />}

          {style === 'sombrero' && (
            // Sombrero pintao: the woven black-and-white hat from Coclé
            <g transform="rotate(-8 100 30)">
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
          )}
        </g>
      </g>
    </svg>
  )
}

