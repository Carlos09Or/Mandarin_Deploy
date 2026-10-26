import { useMemo, useState } from 'react'
import { word } from '../data/course'
import { chime, speak } from '../lib/audio'

type Props = { words: number[]; onDone: (mistakes: number) => void }

const shuffled = (a: number[]) => [...a].sort(() => Math.random() - 0.5)

export function Match({ words, onDone }: Props) {
  const left = useMemo(() => shuffled(words), [words])
  const right = useMemo(() => shuffled(words), [words])
  const [pickL, setPickL] = useState<number | null>(null)
  const [pickR, setPickR] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<[number, number] | null>(null)
  const [mistakes, setMistakes] = useState(0)

  const pick = (side: 'l' | 'r', n: number) => {
    const l = side === 'l' ? n : pickL
    const r = side === 'r' ? n : pickR
    if (l === null || r === null) {
      if (side === 'l') setPickL(n)
      else setPickR(n)
      return
    }
    if (l === r) {
      chime.correct()
      const next = new Set(matched).add(l)
      setMatched(next)
      setPickL(null)
      setPickR(null)
      if (next.size === words.length) onDone(mistakes)
      return
    }
    chime.wrong()
    setMistakes((m) => m + 1)
    setPickL(l)
    setPickR(r)
    setWrong([l, r])
    setTimeout(() => {
      setWrong(null)
      setPickL(null)
      setPickR(null)
    }, 550)
  }

  const cls = (n: number, side: 'l' | 'r') => {
    if (matched.has(n)) return 'opacity-35 border-line shadow-none'
    if (wrong && (side === 'l' ? wrong[0] : wrong[1]) === n) return 'tile-wrong shake'
    if ((side === 'l' ? pickL : pickR) === n) return 'tile-selected'
    return ''
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-extrabold">Une las parejas</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {left.map((n) => (
            <button
              key={n}
              type="button"
              disabled={matched.has(n) || !!wrong}
              onClick={() => {
                speak(word(n).hanzi)
                pick('l', n)
              }}
              className={`tile min-h-16 px-3 ${cls(n, 'l')}`}
            >
              <span className="han text-3xl">{word(n).hanzi}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {right.map((n) => (
            <button
              key={n}
              type="button"
              disabled={matched.has(n) || !!wrong}
              onClick={() => pick('r', n)}
              className={`tile min-h-16 px-3 text-base leading-tight font-bold ${cls(n, 'r')}`}
            >
              {word(n).es}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
