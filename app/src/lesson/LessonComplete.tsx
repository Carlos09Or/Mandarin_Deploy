import { motion } from 'motion/react'
import { useEffect } from 'react'
import { word } from '../data/course'
import { chime } from '../lib/audio'
import type { LessonSummary } from './LessonPlayer'

type Props = { summary: LessonSummary; xp: number; newWords: number[]; onContinue: () => void }

export function LessonComplete({ summary, xp, newWords, onContinue }: Props) {
  useEffect(() => chime.done(), [])
  const accuracy = summary.answers ? Math.round(((summary.answers - summary.mistakes) / summary.answers) * 100) : 100
  const mins = Math.floor(summary.durationMs / 60000)
  const secs = Math.round((summary.durationMs % 60000) / 1000)

  const tiles = [
    { label: 'XP ganados', value: `+${xp}`, color: 'bg-gold', dark: 'text-gold-dark' },
    { label: 'Precisión', value: `${accuracy}%`, color: 'bg-jade', dark: 'text-jade-dark' },
    { label: 'Tiempo', value: `${mins}:${String(secs).padStart(2, '0')}`, color: 'bg-sky', dark: 'text-sky-dark' },
  ]

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10 text-center">
        <motion.div
          initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 12 }}
          className="flex h-36 w-36 items-center justify-center rounded-[2.5rem] bg-brand text-white shadow-[0_8px_0_var(--color-brand-dark)]"
        >
          <span className="han text-7xl">{accuracy === 100 ? '棒' : '好'}</span>
        </motion.div>
        <div>
          <h1 className="text-3xl font-black text-gold-dark">
            {accuracy === 100 ? '¡Lección perfecta!' : '¡Lección completada!'}
          </h1>
          <p className="mt-1 text-muted">{accuracy === 100 ? 'Sin un solo error.' : 'Cada repaso te acerca a dominarlas.'}</p>
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-3">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.12 }}
              className={`overflow-hidden rounded-2xl border-2 ${t.color} border-transparent`}
            >
              <p className="py-1 text-[11px] font-extrabold tracking-wider text-white uppercase">{t.label}</p>
              <p className={`m-0.5 rounded-[14px] bg-card py-3 text-2xl font-black ${t.dark}`}>{t.value}</p>
            </motion.div>
          ))}
        </div>

        {newWords.length > 0 && (
          <div className="w-full max-w-md">
            <p className="mb-3 text-sm font-extrabold tracking-widest text-muted uppercase">Palabras nuevas</p>
            <div className="flex flex-wrap justify-center gap-2">
              {newWords.map((n) => (
                <span key={n} className="card flex items-baseline gap-2 rounded-2xl px-3 py-2">
                  <span className="han text-xl">{word(n).hanzi}</span>
                  <span className="text-sm text-muted">{word(n).es}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="safe-bottom border-t-2 border-line">
        <div className="mx-auto flex w-full max-w-2xl justify-end px-4 py-4 sm:px-6 sm:py-6">
          <button type="button" autoFocus onClick={onContinue} className="btn btn-primary w-full sm:w-44">
            Continuar
          </button>
        </div>
      </footer>
    </div>
  )
}
