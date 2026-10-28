import { useEffect, useRef, useState } from 'react'
import { tokenPinyin, word } from '../data/course'
import { speak } from '../lib/audio'
import type { Exercise } from '../lib/lesson'
import { AudioButton } from '../components/AudioButton'
import { Stage } from './Stage'

type Props = {
  ex: Extract<Exercise, { kind: 'cloze' }>
  /** Index into `ex.options`; null until the learner has touched the wheel. */
  selected: number | null
  onSelect: (i: number) => void
  revealed: boolean
}

const ROW = 64

export function Cloze({ ex, selected, onSelect, revealed }: Props) {
  const w = word(ex.word)
  const wheel = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(0)
  const end = /[。？！]$/.exec(w.example.hanzi)?.[0] ?? ''
  const answer = ex.tokens[ex.blank]

  useEffect(() => {
    const t = setTimeout(() => speak(w.example.hanzi), 300)
    return () => clearTimeout(t)
  }, [w.example.hanzi])

  const go = (i: number) => {
    const c = Math.max(0, Math.min(ex.options.length - 1, i))
    wheel.current?.scrollTo({ top: c * ROW, behavior: 'smooth' })
    setLive(c)
    onSelect(c)
  }

  useEffect(() => {
    if (revealed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') go(live - 1)
      else if (e.key === 'ArrowDown') go(live + 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const picked = ex.options[selected ?? live]
  const holeState = !revealed
    ? 'border-gold bg-gold/10'
    : ex.options[selected ?? live] === answer
      ? 'border-jade bg-jade-soft'
      : 'border-wrong bg-wrong-soft'

  return (
    <Stage eyebrow="Complete the sentence" title="Pick the missing word.">
      <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-5 pt-4">
        {ex.tokens.map((t, i) => {
          const isHole = i === ex.blank
          const shown = selected !== null || revealed
          const text = isHole ? picked : t
          const item = (
            <span className="flex flex-col items-center">
              {isHole ? (
                <span className={`han flex h-[72px] min-w-[92px] items-center justify-center rounded-2xl border-2 px-3 text-4xl font-bold transition-colors ${holeState}`}>
                  {shown ? picked : <span className="text-2xl tracking-widest text-line-dark">- - -</span>}
                </span>
              ) : (
                <span className="han text-4xl leading-[72px] font-bold">{t}</span>
              )}
              <span className="mt-1 h-5 text-sm font-bold text-sky-dark">{!isHole || shown ? tokenPinyin(text) : ''}</span>
            </span>
          )
          // The full stop stays glued to the last word instead of wrapping onto a line of its own.
          return i === ex.tokens.length - 1 && end ? (
            <span key={i} className="flex items-start whitespace-nowrap">
              {item}
              <span className="han -ml-1 text-4xl leading-[72px] font-bold">{end}</span>
            </span>
          ) : (
            <span key={i}>{item}</span>
          )
        })}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <div className="relative w-44 overflow-hidden rounded-3xl border-2 border-line bg-card" style={{ height: ROW * 3 }}>
          <div className="pointer-events-none absolute inset-x-2 rounded-2xl bg-jade-soft" style={{ top: ROW, height: ROW }} />
          <div
            ref={wheel}
            className="wheel relative h-full snap-y snap-mandatory overflow-y-scroll"
            style={revealed ? { pointerEvents: 'none' } : undefined}
            onScroll={(e) => {
              const i = Math.max(0, Math.min(ex.options.length - 1, Math.round(e.currentTarget.scrollTop / ROW)))
              if (i !== live) {
                setLive(i)
                onSelect(i)
              }
            }}
          >
            <div style={{ height: ROW }} />
            {ex.options.map((o, i) => (
              <button
                key={o}
                type="button"
                onClick={() => go(i)}
                style={{ height: ROW }}
                className={`han flex w-full snap-center items-center justify-center text-4xl font-bold transition-opacity ${
                  i === live ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {o}
              </button>
            ))}
            <div style={{ height: ROW }} />
          </div>
        </div>
        <p className="px-4 text-center text-lg font-semibold text-muted">{w.example.en}</p>
        <AudioButton text={w.example.hanzi} size="sm" />
      </div>
    </Stage>
  )
}
