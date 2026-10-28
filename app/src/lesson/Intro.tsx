import { useEffect } from 'react'
import { CHARS, RADICALS, charsOf, word } from '../data/course'
import { speak } from '../lib/audio'
import { AudioButton } from '../components/AudioButton'
import { BigHanzi, Stage } from './Stage'

export function Intro({ n }: { n: number }) {
  const w = word(n)
  useEffect(() => {
    const t = setTimeout(() => speak(w.hanzi), 250)
    return () => clearTimeout(t)
  }, [w.hanzi])

  const parts = charsOf(w.hanzi).filter((c) => CHARS[c]?.radical)

  return (
    <Stage eyebrow="New word">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <BigHanzi hanzi={w.hanzi} />

        <div className="flex items-center gap-3">
          <p className="text-3xl font-extrabold text-sky-dark">{w.pinyin}</p>
          <AudioButton text={w.hanzi} size="sm" />
          <AudioButton text={w.hanzi} size="sm" slow />
        </div>
        <p className="text-3xl font-extrabold">{w.en}</p>

        {parts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {parts.map((c) => (
              <span key={c} className="rounded-full bg-jade-soft px-3 py-1.5 text-sm font-bold text-jade-dark">
                <span className="han text-base">{c}</span> → radical <span className="han">{CHARS[c].radical}</span>
                {RADICALS[CHARS[c].radical!] ? ` (${RADICALS[CHARS[c].radical!]})` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* The word in use, in the thumb's reach like the answers of the exercises that follow */}
      <div className="flex items-start gap-3 rounded-3xl bg-line/60 px-4 py-3">
        <AudioButton text={w.example.hanzi} size="sm" />
        <div className="min-w-0">
          <p className="han text-xl leading-snug font-medium">{w.example.hanzi}</p>
          <p className="text-sm font-semibold text-sky-dark">{w.example.pinyin}</p>
          <p className="text-sm text-muted">{w.example.en}</p>
        </div>
      </div>
    </Stage>
  )
}
