import { useEffect } from 'react'
import { word } from '../data/course'
import { speak } from '../lib/audio'
import type { Exercise } from '../lib/lesson'
import { AudioButton } from '../components/AudioButton'

type Props = {
  ex: Extract<Exercise, { kind: 'choice' }>
  selected: number | null
  onSelect: (n: number) => void
  /** Set once the answer has been checked. */
  revealed: boolean
}

const QUESTION = {
  'hanzi-es': '¿Qué significa?',
  'es-hanzi': 'Elige el hanzi correcto',
  'audio-hanzi': '¿Qué escuchas?',
  'hanzi-pinyin': '¿Cómo se pronuncia?',
}

export function Choice({ ex, selected, onSelect, revealed }: Props) {
  const w = word(ex.word)
  const hanziOptions = ex.prompt === 'es-hanzi' || ex.prompt === 'audio-hanzi'

  useEffect(() => {
    if (ex.prompt === 'audio-hanzi' || ex.prompt === 'hanzi-es') {
      const t = setTimeout(() => speak(w.hanzi), 250)
      return () => clearTimeout(t)
    }
  }, [ex, w.hanzi])

  useEffect(() => {
    if (revealed) return
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1
      if (i >= 0 && i < ex.options.length) onSelect(ex.options[i])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ex.options, onSelect, revealed])

  const label = (n: number) => {
    const o = word(n)
    if (hanziOptions) return <span className="han text-4xl sm:text-5xl">{o.hanzi}</span>
    if (ex.prompt === 'hanzi-pinyin') return <span className="text-xl font-bold">{o.pinyin}</span>
    return <span className="text-lg font-bold">{o.es}</span>
  }

  const stateClass = (n: number) => {
    if (revealed && n === ex.word) return 'tile-correct'
    if (revealed && n === selected) return 'tile-wrong'
    if (n === selected) return 'tile-selected'
    return ''
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-extrabold">{QUESTION[ex.prompt]}</h2>

      <div className="flex min-h-36 items-center justify-center gap-4">
        {ex.prompt === 'audio-hanzi' ? (
          <div className="flex items-end gap-4">
            <AudioButton text={w.hanzi} size="lg" />
            <AudioButton text={w.hanzi} slow />
          </div>
        ) : ex.prompt === 'es-hanzi' ? (
          <p className="card px-6 py-5 text-center text-3xl font-extrabold">«{w.es}»</p>
        ) : (
          <div className="flex items-center gap-4">
            {ex.prompt === 'hanzi-es' && <AudioButton text={w.hanzi} />}
            <span className="han text-7xl font-medium sm:text-8xl">{w.hanzi}</span>
          </div>
        )}
      </div>

      <div className={`grid gap-3 ${hanziOptions ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {ex.options.map((n, i) => (
          <button
            key={n}
            type="button"
            disabled={revealed}
            onClick={() => {
              onSelect(n)
              if (ex.prompt === 'es-hanzi') speak(word(n).hanzi)
            }}
            className={`tile relative flex items-center justify-center px-4 ${hanziOptions ? 'min-h-24' : 'min-h-16'} ${stateClass(n)}`}
          >
            <span className="absolute top-2 left-2.5 hidden text-xs font-bold text-muted/60 sm:block">{i + 1}</span>
            {label(n)}
          </button>
        ))}
      </div>
    </div>
  )
}
