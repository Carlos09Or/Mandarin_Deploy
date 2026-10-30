import { AnimatePresence, animate, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { word } from '../data/course'
import { chime } from '../lib/audio'
import { isNight, today, useProgress, type Reward } from '../lib/progress'
import { IconFlame, IconGem } from '../components/icons'
import { Mascot } from '../components/Mascot'
import { Buddy } from '../components/Friends'
import type { FriendId } from '../data/friends'
import type { LessonSummary } from './LessonPlayer'

type Props = { summary: LessonSummary; reward: Reward; newWords: number[]; buddy: FriendId; onContinue: () => void }

type Step = 'summary' | 'streak' | 'reward'

/** End of a lesson: how it went, the streak (first lesson of the day), then the gems it earned. */
export function LessonComplete({ summary, reward, newWords, buddy, onContinue }: Props) {
  const steps: Step[] = reward.streakUp ? ['summary', 'streak', 'reward'] : ['summary', 'reward']
  const [i, setI] = useState(0)
  const step = steps[i]
  useEffect(() => chime.done(), [])
  const progress = useProgress()

  return (
    <div className={`fixed inset-0 z-40 flex flex-col bg-paper ${isNight(progress) ? 'lesson-night' : ''}`}>
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
        <AnimatePresence mode="wait">
          {step === 'summary' ? (
            <motion.div key="summary" exit={{ opacity: 0, x: -40 }} className="flex w-full flex-col items-center gap-8">
              <SummaryStep summary={summary} xp={reward.xp} newWords={newWords} buddy={buddy} />
            </motion.div>
          ) : step === 'streak' ? (
            <motion.div
              key="streak"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex w-full flex-col items-center gap-6"
            >
              <StreakStep streak={reward.streak} />
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
            onClick={() => (i + 1 < steps.length ? setI(i + 1) : onContinue())}
            className="btn btn-primary w-full sm:w-44"
          >
            {steps[i + 1] === 'reward' ? 'See reward' : 'Continue'}
          </button>
        </div>
      </footer>
    </div>
  )
}

function SummaryStep({
  summary,
  xp,
  newWords,
  buddy,
}: {
  summary: LessonSummary
  xp: number
  newWords: number[]
  buddy: FriendId
}) {
  const accuracy = summary.answers ? Math.round(((summary.answers - summary.mistakes) / summary.answers) * 100) : 100
  const mins = Math.floor(summary.durationMs / 60000)
  const secs = Math.round((summary.durationMs % 60000) / 1000)
  const tiles = [
    { label: 'Accuracy', value: `${accuracy}%`, color: 'bg-jade', dark: 'text-jade-dark' },
    { label: 'Time', value: `${mins}:${String(secs).padStart(2, '0')}`, color: 'bg-sky', dark: 'text-sky-dark' },
    { label: 'XP', value: `+${xp}`, color: 'bg-gold', dark: 'text-gold-dark' },
  ]

  return (
    <>
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        className="relative mt-14"
      >
        <Buddy id={buddy} mood="celebrate" size={160} />
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 12 }}
          className="han absolute top-2 -right-16 rounded-2xl border-2 border-line bg-card px-3 py-1.5 text-2xl font-bold text-brand"
        >
          {accuracy === 100 ? '太棒了！' : '很好！'}
        </motion.span>
      </motion.div>
      <div>
        <h1 className="text-3xl font-black text-gold-dark">
          {accuracy === 100 ? 'Perfect lesson!' : 'Lesson complete!'}
        </h1>
        <p className="mt-1 text-muted">{accuracy === 100 ? 'Not a single mistake.' : 'Every review brings you closer to mastering them.'}</p>
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
          <p className="mb-3 text-sm font-extrabold tracking-widest text-muted uppercase">New words</p>
          <div className="flex flex-wrap justify-center gap-2">
            {newWords.map((n) => (
              <span key={n} className="card flex max-w-32 flex-col items-center rounded-2xl px-3 py-1.5">
                <span className="han text-xl">{word(n).hanzi}</span>
                <span className="text-xs leading-tight text-muted">{word(n).en}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function StreakStep({ streak }: { streak: number }) {
  const dailyXp = useProgress().dailyXp
  const [shown, setShown] = useState(Math.max(0, streak - 1))
  useEffect(() => {
    const t = setTimeout(() => {
      setShown(streak)
      chime.correct()
    }, 600)
    return () => clearTimeout(t)
  }, [streak])

  const days = [...Array(7)].map((_, k) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - k))
    return { label: WEEK[d.getDay()], done: (dailyXp[today(d)] ?? 0) > 0, isToday: k === 6 }
  })

  return (
    <>
      <div className="relative flex items-end justify-center">
        <Mascot mood="fire" size={150} />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 12 }}
          className="relative -ml-6 flex items-center justify-center"
        >
          <IconFlame className="h-28 w-28 text-brand drop-shadow-[0_5px_0_rgba(179,50,42,0.35)]" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={shown}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              className="absolute top-12 text-3xl font-black text-white"
            >
              {shown}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>
      <div>
        <h1 className="text-3xl font-black text-brand">
          {streak === 1 ? 'You started a streak!' : `${streak}-day streak!`}
        </h1>
        <p className="mt-1 text-muted">
          {streak === 1 ? 'Come back tomorrow to keep it growing.' : 'Wāwa is proud of you. Don’t break it tomorrow!'}
        </p>
      </div>
      <div className="flex gap-2">
        {days.map((d, k) => (
          <div key={k} className="flex flex-col items-center gap-1.5">
            <span className={`text-xs font-extrabold ${d.isToday ? 'text-brand' : 'text-muted'}`}>{d.label}</span>
            <motion.span
              initial={d.isToday ? { scale: 0.4 } : false}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 400, damping: 10 }}
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                d.done ? 'bg-brand text-white' : 'bg-line text-transparent'
              }`}
            >
              <IconFlame className="h-5 w-5" />
            </motion.span>
          </div>
        ))}
      </div>
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
        <p className="text-sm font-extrabold tracking-widest text-sky-dark uppercase">Reward</p>
        <p className="text-5xl font-black text-sky-dark">+{shown}</p>
        <p className="font-bold text-muted">gems</p>
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
        You have <b className="text-sky-dark">{total} gems</b>. Soon you’ll be able to trade them for rewards your
        teacher sets up.
      </p>
    </>
  )
}
