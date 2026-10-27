import { useEffect } from 'react'
import { CHARS, RADICALS, charsOf, word } from '../data/course'
import { speak } from '../lib/audio'
import { AudioButton } from '../components/AudioButton'

export function Intro({ n }: { n: number }) {
  const w = word(n)
  useEffect(() => {
    const t = setTimeout(() => speak(w.hanzi), 250)
    return () => clearTimeout(t)
  }, [w.hanzi])

  const parts = charsOf(w.hanzi).filter((c) => CHARS[c]?.radical)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-extrabold tracking-widest text-brand uppercase">New word</p>
      <div className="card flex flex-col items-center gap-3 px-6 pt-7 pb-6 text-center">
        <div className="flex items-center gap-4">
          <span className="han text-7xl font-medium sm:text-8xl">{w.hanzi}</span>
        </div>
        <p className="text-2xl font-bold text-sky-dark">{w.pinyin}</p>
        <div className="flex gap-3">
          <AudioButton text={w.hanzi} />
          <AudioButton text={w.hanzi} slow />
        </div>
        <p className="mt-1 text-2xl font-extrabold">{w.en}</p>
      </div>

      <div className="card px-5 py-4">
        <div className="flex items-start gap-3">
          <AudioButton text={w.example.hanzi} size="sm" />
          <div className="min-w-0">
            <p className="han text-xl leading-snug">{w.example.hanzi}</p>
            <p className="text-sm font-semibold text-sky-dark">{w.example.pinyin}</p>
            <p className="text-sm text-muted">{w.example.en}</p>
          </div>
        </div>
      </div>

      {parts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {parts.map((c) => (
            <span key={c} className="rounded-full bg-jade-soft px-3 py-1.5 text-sm font-bold text-jade-dark">
              <span className="han text-base">{c}</span> → radical <span className="han">{CHARS[c].radical}</span>
              {RADICALS[CHARS[c].radical!] ? ` (${RADICALS[CHARS[c].radical!]})` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
