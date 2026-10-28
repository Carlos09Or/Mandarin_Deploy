import { useEffect } from 'react'
import { CHARS, RADICALS, charsOf, word } from '../data/course'
import { speak } from '../lib/audio'
import { AudioButton } from '../components/AudioButton'
import { revealFor } from '../data/reveals'
import { Reveal } from './Reveal'

export function Intro({ n }: { n: number }) {
  const w = word(n)
  useEffect(() => {
    const t = setTimeout(() => speak(w.hanzi), 250)
    return () => clearTimeout(t)
  }, [w.hanzi])

  const parts = charsOf(w.hanzi).filter((c) => CHARS[c]?.radical)
  const reveal = revealFor(w.hanzi)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-extrabold tracking-[0.18em] text-muted uppercase">New word</p>
      <div className="card flex flex-col items-center gap-3 px-6 pt-7 pb-6 text-center">
        {reveal ? (
          <>
            <Reveal key={w.hanzi} data={reveal} />
            {w.hanzi !== reveal.char && <span className="han text-5xl font-medium">{w.hanzi}</span>}
          </>
        ) : (
          <div className="flex items-center gap-4">
            <span className="han text-7xl font-medium sm:text-8xl">{w.hanzi}</span>
          </div>
        )}
        <p className="text-2xl font-bold text-sky-dark">{w.pinyin}</p>
        <div className="flex gap-3">
          <AudioButton text={w.hanzi} />
          <AudioButton text={w.hanzi} slow />
        </div>
        <p className="mt-1 text-2xl font-extrabold">{w.en}</p>
        {reveal && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-sm font-bold">
            <span className="han text-lg">{reveal.char}</span>
            <span className="text-muted">=</span>
            {reveal.parts.map((p, i) => (
              <span key={p.glyph} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted">+</span>}
                <span className="rounded-full bg-paper px-2.5 py-1 ring-2 ring-line">
                  <span className="han text-base" style={{ color: i === 0 ? '#d21034' : '#0a426d' }}>
                    {p.glyph}
                  </span>{' '}
                  {p.sound ? '🔊 ' : ''}
                  {p.meaning}
                </span>
              </span>
            ))}
          </div>
        )}
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

      {!reveal && parts.length > 0 && (
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
