import { useMemo, useState } from 'react'
import { WORDS, plainPinyin, word } from '../data/course'
import { weakestWords } from '../lib/lesson'
import { learnedWords, useProgress } from '../lib/progress'
import { WordSheet } from '../components/WordSheet'
import { AudioButton } from '../components/AudioButton'

type Props = { onReview: (pool: number[]) => void; onWrite: (char: string, n: number) => void }

const MIN_WORDS = 4

export function Review({ onReview, onWrite }: Props) {
  const progress = useProgress()
  const learned = learnedWords(progress)
  const learnedSet = new Set(learned)
  const [scope, setScope] = useState<'learned' | 'all'>(learned.length ? 'learned' : 'all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const weak = weakestWords(progress, learned.filter((n) => (progress.words[n]?.wrong ?? 0) > 0), 6)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = scope === 'learned' ? WORDS.filter((w) => learnedSet.has(w.n)) : WORDS
    if (!q) return pool
    const qp = plainPinyin(q)
    return pool.filter(
      (w) => w.hanzi.includes(q) || w.es.toLowerCase().includes(q) || (qp && plainPinyin(w.pinyin).startsWith(qp)),
    )
  }, [scope, query, learned.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6 pb-10">
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="han flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-4xl text-sky-dark">
          复
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black">Repaso inteligente</h2>
          <p className="text-muted">
            {learned.length >= MIN_WORDS
              ? `Practica las palabras que más te cuestan entre tus ${learned.length} aprendidas.`
              : 'Completa tu primera lección para desbloquear el repaso.'}
          </p>
        </div>
        <button
          type="button"
          disabled={learned.length < MIN_WORDS}
          onClick={() => onReview(learned)}
          className="btn btn-primary sm:w-40"
        >
          Repasar
        </button>
      </section>

      {weak.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-extrabold tracking-widest text-muted uppercase">Para reforzar</h3>
          <div className="flex flex-wrap gap-2">
            {weak.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setOpen(n)}
                className="tile flex items-baseline gap-2 border-wrong/30 px-3 py-2"
              >
                <span className="han text-xl">{word(n).hanzi}</span>
                <span className="text-sm text-muted">{word(n).es}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-2xl font-black">Diccionario</h3>
          <div className="flex rounded-2xl border-2 border-line bg-card p-1 text-sm font-extrabold">
            {(['learned', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`flex-1 rounded-xl px-4 py-2 ${scope === s ? 'bg-sky-soft text-sky-dark' : 'text-muted'}`}
              >
                {s === 'learned' ? `Aprendidas (${learned.length})` : 'Todas (300)'}
              </button>
            ))}
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por hanzi, pinyin o español"
          className="w-full rounded-2xl border-2 border-line bg-card px-4 py-3 text-base outline-none focus:border-sky"
        />
        {list.length === 0 ? (
          <p className="py-8 text-center text-muted">
            {scope === 'learned' && !query ? 'Aún no has aprendido palabras. ¡Empieza tu primera lección!' : 'Sin resultados.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {list.map((w) => (
              <div
                key={w.n}
                role="button"
                tabIndex={0}
                onClick={() => setOpen(w.n)}
                onKeyDown={(e) => e.key === 'Enter' && setOpen(w.n)}
                className="tile relative flex flex-col items-center gap-1 px-2 pt-9 pb-3 text-center"
              >
                <span className="absolute top-2 right-2">
                  <AudioButton text={w.hanzi} size="sm" />
                </span>
                {!learnedSet.has(w.n) && scope === 'all' && (
                  <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-line-dark" title="Aún no aprendida" />
                )}
                <span className="han text-4xl">{w.hanzi}</span>
                <span className="text-sm font-bold text-sky-dark">{w.pinyin}</span>
                <span className="line-clamp-2 text-sm leading-tight">{w.es}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <WordSheet
        n={open}
        onClose={() => setOpen(null)}
        onWrite={(c, n) => {
          setOpen(null)
          onWrite(c, n)
        }}
      />
    </div>
  )
}
