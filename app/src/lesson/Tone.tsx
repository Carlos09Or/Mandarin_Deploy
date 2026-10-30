import { motion } from 'motion/react'
import { useEffect } from 'react'
import { plainPinyin, word } from '../data/course'
import { speak } from '../lib/audio'
import type { Exercise } from '../lib/lesson'
import { TONE_COLOR, type Tone } from '../lib/tones'
import { AudioButton } from '../components/AudioButton'
import { Stage } from './Stage'

type Props = {
  ex: Extract<Exercise, { kind: 'tone' }>
  selected: number | null
  onSelect: (tone: number) => void
  revealed: boolean
}

const TONES: Tone[] = [1, 2, 3, 4]

// The staff: five pitch levels, drawn from 5 (high) down to 1 (low).
const W = 300
const H = 160
const y = (level: number) => 24 + (5 - level) * 28
const X0 = 48
const X1 = W - 28

/** One path per tone: high flat, rising 3 to 5, dipping 2 to 1 to 4, falling 5 to 1. */
const CONTOUR: Record<Tone, { d: string; start: [number, number]; end: [number, number] }> = {
  1: { d: `M ${X0} ${y(5)} L ${X1} ${y(5)}`, start: [X0, y(5)], end: [X1, y(5)] },
  2: { d: `M ${X0} ${y(3)} C 130 ${y(3)}, 190 ${y(4.6)}, ${X1} ${y(5)}`, start: [X0, y(3)], end: [X1, y(5)] },
  3: {
    d: `M ${X0} ${y(2)} C 90 ${y(2)}, 110 ${y(1)}, 150 ${y(1)} C 200 ${y(1)}, 215 ${y(3.8)}, ${X1} ${y(4)}`,
    start: [X0, y(2)],
    end: [X1, y(4)],
  },
  4: { d: `M ${X0} ${y(5)} C 120 ${y(5)}, 200 ${y(2)}, ${X1} ${y(1)}`, start: [X0, y(5)], end: [X1, y(1)] },
}

/** The arrow on each tone's button. */
function Glyph({ tone }: { tone: Tone }) {
  const paths: Record<Tone, string> = {
    1: 'M6 20 H34',
    2: 'M8 30 L32 10 M22 10 H32 V20',
    3: 'M6 12 C10 30, 20 30, 24 22 S30 12, 34 10 M28 10 H34 V16',
    4: 'M8 10 L32 30 M32 20 V30 H22',
  }
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[tone]} />
    </svg>
  )
}

export function ToneExercise({ ex, selected, onSelect, revealed }: Props) {
  const w = word(ex.word)
  // Once checked, the staff always shows the right contour.
  const shown = (revealed ? ex.tone : selected) as Tone | null

  useEffect(() => {
    const t = setTimeout(() => speak(w.hanzi), 250)
    return () => clearTimeout(t)
  }, [w.hanzi])

  useEffect(() => {
    if (revealed) return
    const onKey = (e: KeyboardEvent) => {
      const t = Number(e.key)
      if (t >= 1 && t <= 4) onSelect(t)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSelect, revealed])

  const state = (t: Tone) => {
    if (revealed && t === ex.tone) return 'opt-correct'
    if (revealed && t === selected) return 'opt-wrong'
    return t === selected ? 'opt-selected' : ''
  }

  return (
    <Stage eyebrow="Tones" title="Which tone is it?">
      <div className="flex items-center justify-center gap-5">
        <AudioButton text={w.hanzi} size="lg" />
        <p className="text-5xl font-extrabold">{plainPinyin(w.pinyin)}</p>
      </div>

      <div className="rounded-3xl border-2 border-line bg-card p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
          {[1, 2, 3, 4, 5].map((level) => (
            <g key={level}>
              <text x="10" y={y(level) + 5} fontSize="14" fontWeight="700" style={{ fill: 'var(--color-tone-label)' }}>
                {level}
              </text>
              <line x1="34" x2={W - 8} y1={y(level)} y2={y(level)} style={{ stroke: 'var(--color-tone-line)' }} strokeWidth="2" strokeDasharray="5 6" />
            </g>
          ))}
          {shown && (
            <g key={shown} style={{ color: TONE_COLOR[shown] }}>
              <motion.path
                d={CONTOUR[shown].d}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
              <circle cx={CONTOUR[shown].start[0]} cy={CONTOUR[shown].start[1]} r="8" fill="currentColor" />
              <motion.circle
                cx={CONTOUR[shown].end[0]}
                cy={CONTOUR[shown].end[1]}
                r="8"
                fill="currentColor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              />
            </g>
          )}
        </svg>
      </div>

      <div className="grid grid-cols-4 gap-3 pb-2">
        {TONES.map((t) => (
          <button
            key={t}
            type="button"
            disabled={revealed}
            aria-label={`Tone ${t}`}
            onClick={() => onSelect(t)}
            style={state(t) === '' || state(t) === 'opt-selected' ? { color: TONE_COLOR[t] } : undefined}
            className={`opt min-h-20 px-0 ${state(t)}`}
          >
            <Glyph tone={t} />
          </button>
        ))}
      </div>
    </Stage>
  )
}
