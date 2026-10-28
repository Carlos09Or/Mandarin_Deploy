import { useEffect } from 'react'
import { word } from '../data/course'
import { speak } from '../lib/audio'
import type { Exercise } from '../lib/lesson'
import { AudioButton } from '../components/AudioButton'
import { BigHanzi, Stage } from './Stage'

type Props = {
  ex: Extract<Exercise, { kind: 'choice' }>
  selected: number | null
  onSelect: (n: number) => void
  /** Set once the answer has been checked. */
  revealed: boolean
}

const TEXT = {
  'hanzi-en': { eyebrow: 'Recall', title: 'Find the meaning.' },
  'en-hanzi': { eyebrow: 'Recall', title: 'Find the character.' },
  'audio-hanzi': { eyebrow: 'Listen', title: 'What do you hear?' },
  'hanzi-pinyin': { eyebrow: 'Pronunciation', title: 'How is it pronounced?' },
}

export function Choice({ ex, selected, onSelect, revealed }: Props) {
  const w = word(ex.word)
  const hanziOptions = ex.prompt === 'en-hanzi' || ex.prompt === 'audio-hanzi'

  useEffect(() => {
    if (ex.prompt === 'audio-hanzi' || ex.prompt === 'hanzi-en') {
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
    if (hanziOptions) return <span className="han text-4xl">{o.hanzi}</span>
    if (ex.prompt === 'hanzi-pinyin') return <span className="text-xl font-bold">{o.pinyin}</span>
    return <span>{o.en}</span>
  }

  const stateClass = (n: number) => {
    if (revealed && n === ex.word) return 'opt-correct'
    if (revealed && n === selected) return 'opt-wrong'
    if (n === selected) return 'opt-selected'
    return ''
  }

  return (
    <Stage eyebrow={TEXT[ex.prompt].eyebrow} title={TEXT[ex.prompt].title}>
      <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-3">
        {ex.prompt === 'audio-hanzi' ? (
          <div className="flex items-end gap-4">
            <AudioButton text={w.hanzi} size="lg" />
            <AudioButton text={w.hanzi} slow />
          </div>
        ) : ex.prompt === 'en-hanzi' ? (
          <p className="px-4 text-center text-4xl leading-tight font-extrabold">{w.en}</p>
        ) : (
          <>
            <BigHanzi hanzi={w.hanzi} />
            {ex.prompt === 'hanzi-en' && (
              <div className="flex items-center gap-2">
                <p className="text-xl font-extrabold text-sky-dark">{w.pinyin}</p>
                <AudioButton text={w.hanzi} size="sm" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-2">
        {ex.options.map((n) => (
          <button
            key={n}
            type="button"
            disabled={revealed}
            onClick={() => {
              onSelect(n)
              if (ex.prompt === 'en-hanzi') speak(word(n).hanzi)
            }}
            className={`opt ${hanziOptions ? 'min-h-20' : ''} ${stateClass(n)}`}
          >
            {label(n)}
          </button>
        ))}
      </div>
    </Stage>
  )
}
