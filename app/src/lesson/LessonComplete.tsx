import { AnimatePresence, animate, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { word } from '../data/course'
import { chime } from '../lib/audio'
import { useProgress, type Reward } from '../lib/progress'
import { IconGem } from '../components/icons'
import type { LessonSummary } from './LessonPlayer'

type Props = { summary: LessonSummary; reward: Reward; newWords: number[]; onContinue: () => void }

/** End of a lesson in two steps: how it went, then the gems it earned. */
export function LessonComplete({ summary, reward, newWords, onContinue }: Props) {
  const [step, setStep] = useState<'summary' | 'reward'>('summary')
  useEffect(() => chime.done(), [])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper">
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
        <AnimatePresence mode="wait">
          {step === 'summary' ? (
            <motion.div key="summary" exit={{ opacity: 0, x: -40 }} className="flex w-full flex-col items-center gap-8">
              <SummaryStep summary={summary} xp={reward.xp} newWords={newWords} />
            </motion.div>
          ) : (
            <motion.div
              key="reward"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex w-full flex-col items-center gap-7"
            >
              <RewardStep reward={reward} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="safe-bottom border-t-2 border-line">
        <div className="mx-auto flex w-full max-w-2xl justify-end px-4 py-4 sm:px-6 sm:py-6">
          <button
            type="button"
            autoFocus
            onClick={() => (step === 'summary' ? setStep('reward') : onContinue())}
            className="btn btn-primary w-full sm:w-44"
          >
            {step === 'summary' ? 'Ver recompensa' : 'Continuar'}
          </button>
        </div>
      </footer>
    </div>
  )
}

function SummaryStep({ summary, xp, newWords }: { summary: LessonSummary; xp: number; newWords: number[] }) {
  const accuracy = summary.answers ? Math.round(((summary.answers - summary.mistakes) / summary.answers) * 100) : 100
  const mins = Math.floor(summary.durationMs / 60000)
  const secs = Math.round((summary.durationMs % 60000) / 1000)
  const tiles = [
    { label: 'Precisión', value: `${accuracy}%`, color: 'bg-jade', dark: 'text-jade-dark' },
    { label: 'Tiempo', value: `${mins}:${String(secs).padStart(2, '0')}`, color: 'bg-sky', dark: 'text-sky-dark' },
    { label: 'XP', value: `+${xp}`, color: 'bg-gold', dark: 'text-gold-dark' },
  ]

  return (
    <>
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
          {accuracy === 100 ? '¡Lección perfecta!' : '¡Terminaste la lección!'}
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
            className={`overflow-hidden rounded-2xl ${t.color}`}
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
    </>
  )
}

function RewardStep({ reward }: { reward: Reward }) {
  const total = useProgress().gems
  const [shown, setShown] = useState(0)

  useEffect(() => {
    chime.correct()
    const controls = animate(0, reward.gems, {
      duration: 0.9,
      delay: 0.35,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [reward.gems])

  return (
    <>
      <div className="relative flex h-40 w-40 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-sky-soft"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.15, 1] }}
          transition={{ duration: 0.5 }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-sky"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos((i / 8) * Math.PI * 2) * 90,
              y: Math.sin((i / 8) * Math.PI * 2) * 90,
              opacity: 0,
            }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0, y: [0, -6, 0] }}
          transition={{ scale: { type: 'spring', stiffness: 260, damping: 11 }, y: { repeat: Infinity, duration: 2, delay: 0.8 } }}
        >
          <IconGem className="h-24 w-24 drop-shadow-[0_6px_0_rgba(28,127,181,0.35)]" />
        </motion.div>
      </div>

      <div>
        <p className="text-sm font-extrabold tracking-widest text-sky-dark uppercase">Recompensa</p>
        <p className="text-5xl font-black text-sky-dark">+{shown}</p>
        <p className="font-bold text-muted">gemas</p>
      </div>

      <div className="w-full max-w-xs overflow-hidden rounded-2xl border-2 border-line bg-card text-left">
        {reward.parts.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="flex items-center justify-between border-b-2 border-line px-4 py-2.5 last:border-b-0"
          >
            <span className="font-bold">{p.label}</span>
            <span className="flex items-center gap-1 font-black text-sky-dark">
              +{p.gems} <IconGem className="h-4 w-4" />
            </span>
          </motion.div>
        ))}
      </div>

      <p className="max-w-xs text-sm text-muted">
        Tienes <b className="text-sky-dark">{total} gemas</b>. Pronto podrás canjearlas por beneficios que active tu
        profesor.
      </p>
    </>
  )
}
