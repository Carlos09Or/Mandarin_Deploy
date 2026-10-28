import { useEffect, useRef } from 'react'
import { word } from '../data/course'
import { speak } from '../lib/audio'
import type { Exercise } from '../lib/lesson'
import { AudioButton } from '../components/AudioButton'
import { BigHanzi, Stage } from './Stage'

type Props = {
  ex: Extract<Exercise, { kind: 'pinyin' }>
  value: string
  onChange: (v: string) => void
  /** The learner gave up: show the answer. */
  onGiveUp: () => void
  revealed: boolean
}

export function Pinyin({ ex, value, onChange, onGiveUp, revealed }: Props) {
  const w = word(ex.word)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => speak(w.hanzi), 250)
    return () => clearTimeout(t)
  }, [w.hanzi])

  useEffect(() => {
    if (!revealed) input.current?.focus()
  }, [revealed])

  return (
    <Stage eyebrow="Type it" title="What is the pinyin?">
      <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-3">
        <BigHanzi hanzi={w.hanzi} />
        <div className="flex items-center gap-2">
          <p className="text-xl font-extrabold text-muted">{w.en}</p>
          <AudioButton text={w.hanzi} size="sm" />
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-2">
        <input
          ref={input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={revealed}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Pinyin"
          className="w-full rounded-2xl border-2 border-line bg-card px-5 py-4 text-3xl font-extrabold caret-jade outline-none focus:border-jade"
        />
        <div className="flex items-center justify-between px-1 text-sm font-bold text-muted">
          <span>Tone marks are optional.</span>
          {!revealed && (
            <button type="button" onClick={onGiveUp} className="font-extrabold text-sky-dark">
              I don’t know
            </button>
          )}
        </div>
      </div>
    </Stage>
  )
}
