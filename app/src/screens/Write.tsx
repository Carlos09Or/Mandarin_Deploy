import { useState } from 'react'
import { WORDS, charsOf, word } from '../data/course'
import { learnedWords, useProgress } from '../lib/progress'

type Props = { onWrite: (char: string, n: number) => void }

/** Every character of the course, each paired with the first word that uses it. */
const ALL_CHARS: [string, number][] = []
for (const w of WORDS) for (const c of charsOf(w.hanzi)) if (!ALL_CHARS.some(([x]) => x === c)) ALL_CHARS.push([c, w.n])

export function Write({ onWrite }: Props) {
  const progress = useProgress()
  const learned = new Set(learnedWords(progress))
  const [showAll, setShowAll] = useState(false)

  const unlocked = new Map<string, number>()
  for (const n of learned) for (const c of charsOf(word(n).hanzi)) if (!unlocked.has(c)) unlocked.set(c, n)
  const chars = showAll ? ALL_CHARS : [...unlocked.entries()]
  const clean = Object.values(progress.chars).filter((c) => c.clean > 0).length

  return (
    <div className="flex flex-col gap-6 pb-10">
      <section className="card flex items-center gap-4 p-5">
        <div className="han flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-jade-soft text-4xl text-jade-dark">
          写
        </div>
        <div>
          <h2 className="text-xl font-black">Escritura</h2>
          <p className="text-muted">
            Primero calcas el carácter y luego lo escribes dos veces de memoria, con el orden de trazos correcto.
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted">
          {unlocked.size} caracteres desbloqueados · {clean} escritos sin errores
        </p>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="rounded-xl px-3 py-1.5 text-sm font-extrabold text-sky-dark hover:bg-sky-soft"
        >
          {showAll ? 'Solo los míos' : 'Ver los 248'}
        </button>
      </div>

      {chars.length === 0 ? (
        <p className="py-10 text-center text-muted">Completa una lección para desbloquear tus primeros caracteres.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {chars.map(([c, n]) => {
            const stat = progress.chars[c]
            return (
              <button
                key={c}
                type="button"
                onClick={() => onWrite(c, n)}
                className={`tile relative flex aspect-square items-center justify-center ${stat?.clean ? 'border-jade/50' : ''}`}
              >
                <span className="han text-4xl">{c}</span>
                {stat && (
                  <span
                    className={`absolute right-1.5 bottom-1 text-[11px] font-black ${stat.clean ? 'text-jade' : 'text-muted'}`}
                  >
                    ×{stat.traced}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
