import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { word } from '../data/course'
import { prefetchClips, speak } from '../lib/audio'
import { LEARN_AHEAD, answerCard, buildQueue, dueCount, dueNow, isLearning, practiceSet } from '../lib/cards'
import { finishReviewDay, getProgress, isNight, useProgress } from '../lib/progress'
import { previewLabels, type Grade } from '../lib/srs'
import { holdUpdates } from '../lib/updates'
import { AudioButton } from '../components/AudioButton'
import { Buddy } from '../components/Friends'
import { IconClose, IconGem } from '../components/icons'

// A study session, as in Anki: a card shows one side, the learner tries to remember the other, taps "Show answer" and
// says how it went. The button decides when the card comes back (lib/srs.ts). Cards still in their first steps return
// a few cards later in the same session. Everything is saved after every answer, so leaving early loses nothing.
//
// There is no daily limit: a session holds a handful of cards (the learner's choice) and the next one can start at once.
// "Practice" is the free version: the words that most need it, as many rounds as wanted, and nothing is rescheduled.

export type SessionMode = 'study' | 'practice'
type Front = 'hanzi' | 'audio' | 'meaning'

/** A card never reviewed starts from the character; the others vary so a word is met in every way. */
const pickFront = (n: number | undefined, mode: SessionMode): Front => {
  if (n === undefined || (mode === 'study' && !getProgress().cards[n])) return 'hanzi'
  const r = Math.random()
  return r < 0.4 ? 'hanzi' : r < 0.7 ? 'audio' : 'meaning'
}

const BUTTONS: { grade: Grade; label: string; hint: string; cls: string }[] = [
  { grade: 1, label: 'Again', hint: 'soon', cls: 'bg-wrong text-white shadow-[0_4px_0_var(--color-wrong-dark)] active:shadow-[0_1px_0_var(--color-wrong-dark)]' },
  { grade: 2, label: 'Hard', hint: 'later', cls: 'bg-gold text-[#2b2420] shadow-[0_4px_0_var(--color-gold-dark)] active:shadow-[0_1px_0_var(--color-gold-dark)]' },
  { grade: 3, label: 'Good', hint: 'got it', cls: 'bg-jade text-white shadow-[0_4px_0_var(--color-jade-dark)] active:shadow-[0_1px_0_var(--color-jade-dark)]' },
  { grade: 4, label: 'Easy', hint: 'got it', cls: 'bg-sky text-white shadow-[0_4px_0_var(--color-sky-dark)] active:shadow-[0_1px_0_var(--color-sky-dark)]' },
]

/** `pool` limits the session to one deck (a whole unit); a practice round then covers all of its words. */
const startQueue = (mode: SessionMode, pool?: number[]) => {
  const p = getProgress()
  if (mode === 'practice') return practiceSet(p, pool ? pool.length : p.sessionSize, pool)
  return buildQueue(p, dueNow(p, Date.now(), pool), p.sessionSize)
}

type Props = { mode: SessionMode; pool?: number[]; onRestart: (mode: SessionMode) => void; onExit: () => void }

export function CardSession({ mode, pool, onRestart, onExit }: Props) {
  const progress = useProgress()
  const night = isNight(progress)
  const [queue, setQueue] = useState<number[]>(() => startQueue(mode, pool))
  const [answered, setAnswered] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [front, setFront] = useState<Front>(() => pickFront(queue[0], mode))
  const [gems, setGems] = useState(0)

  const n = queue[0] as number | undefined
  const finished = n === undefined
  useEffect(() => holdUpdates(), [])
  useEffect(() => void prefetchClips(queue.slice(0, 12)), []) // eslint-disable-line react-hooks/exhaustive-deps

  // The word is said when its card turns up (listening and the character) or when the answer is shown (the meaning).
  useEffect(() => {
    if (n === undefined) return
    if (front !== 'meaning' && !revealed) {
      const t = setTimeout(() => speak(word(n).hanzi), 250)
      return () => clearTimeout(t)
    }
    if (front === 'meaning' && revealed) speak(word(n).hanzi)
  }, [n, front, revealed])

  const labels = useMemo(
    () => (mode === 'study' && n !== undefined ? previewLabels(progress.cards[n], new Date(), progress.retention) : null),
    [n, revealed], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const answer = (grade: Grade) => {
    if (n === undefined) return
    const rest = queue.slice(1)
    if (mode === 'study') {
      const now = Date.now()
      answerCard(n, grade)
      const card = getProgress().cards[n]
      // A card in its first steps comes back soon: a few cards later, or later still if it was answered well.
      if (card && isLearning(card.state) && card.due - now < LEARN_AHEAD) {
        rest.splice(Math.min(card.due - now < 5 * 60_000 ? 3 : 8, rest.length), 0, n)
      }
      if (!rest.length) setGems(finishReviewDay())
    } else if (grade <= 2) {
      // Practice: a word that was not got right stays in the round, sooner if it was missed outright.
      rest.splice(Math.min(grade === 1 ? 3 : 6, rest.length), 0, n)
    }
    setQueue(rest)
    setAnswered((a) => a + 1)
    setRevealed(false)
    setFront(pickFront(rest[0], mode))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setRevealed(true)
      } else if (revealed && /^[1-4]$/.test(e.key)) answer(Number(e.key) as Grade)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Anki's three counters: new, still learning, to review. The card on screen is underlined.
  const counts = { fresh: 0, learning: 0, review: 0 }
  for (const q of queue) {
    const c = progress.cards[q]
    if (!c) counts.fresh++
    else if (isLearning(c.state)) counts.learning++
    else counts.review++
  }
  const current = n === undefined ? null : !progress.cards[n] ? 'fresh' : isLearning(progress.cards[n].state) ? 'learning' : 'review'
  const counter = (key: keyof typeof counts, color: string) => (
    <span className={`${color} ${current === key ? 'underline decoration-2 underline-offset-4' : ''}`}>{counts[key]}</span>
  )

  const w = n === undefined ? null : word(n)

  return (
    <div className={`fixed inset-0 z-40 flex flex-col bg-paper ${night ? 'lesson-night' : ''}`}>
      <header className="mx-auto flex w-full max-w-lg items-center gap-4 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2">
        <button type="button" aria-label="Leave the review" onClick={onExit} className="text-muted">
          <IconClose className="h-7 w-7" />
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-jade"
            initial={false}
            animate={{ width: `${Math.max(4, (answered / (answered + queue.length || 1)) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </header>

      {finished ? (
        <Done mode={mode} pool={pool} total={answered} gems={gems} onRestart={onRestart} onExit={onExit} />
      ) : (
        <>
          <p className="mx-auto flex w-full max-w-lg justify-center gap-2 px-4 pb-1 text-base font-black">
            {mode === 'study' ? (
              <>
                {counter('fresh', 'text-sky-dark')}
                <span className="text-muted">·</span>
                {counter('learning', 'text-brand')}
                <span className="text-muted">·</span>
                {counter('review', 'text-jade-dark')}
              </>
            ) : (
              <span className="text-sky-dark">Practice · {queue.length} left</span>
            )}
          </p>
          <main className="flex flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-5 py-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${answered}`}
                  className="card flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setRevealed(true)}
                >
                  {front === 'hanzi' && (
                    <>
                      <p className="han text-8xl leading-tight">{w!.hanzi}</p>
                      <AudioButton text={w!.hanzi} size="md" />
                    </>
                  )}
                  {front === 'meaning' && <p className="text-4xl leading-tight font-black">{w!.en}</p>}
                  {front === 'audio' && !revealed && <AudioButton text={w!.hanzi} size="lg" />}

                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex w-full flex-col items-center gap-2 border-t-2 border-line pt-4"
                    >
                      {front !== 'hanzi' && <p className="han text-6xl leading-tight">{w!.hanzi}</p>}
                      <p className="text-2xl font-black text-sky-dark">{w!.pinyin}</p>
                      {front !== 'meaning' && <p className="text-xl">{w!.en}</p>}
                      {front !== 'hanzi' && <AudioButton text={w!.hanzi} size="md" />}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <footer className="safe-bottom">
            <div className="mx-auto w-full max-w-lg px-5 py-4">
              {!revealed ? (
                <button type="button" autoFocus onClick={() => setRevealed(true)} className="btn btn-ghost w-full">
                  Show answer
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {BUTTONS.map((b) => (
                    <button
                      key={b.grade}
                      type="button"
                      onClick={() => answer(b.grade)}
                      className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2.5 text-[15px] font-extrabold select-none active:translate-y-[3px] ${b.cls}`}
                    >
                      {b.label}
                      <span className="text-xs font-bold opacity-90">{labels ? labels[b.grade] : b.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

/** The session is over; another can follow at once. */
function Done({ mode, pool, total, gems, onRestart, onExit }: { mode: SessionMode; pool?: number[]; total: number; gems: number; onRestart: (m: SessionMode) => void; onExit: () => void }) {
  const progress = useProgress()
  const left = dueCount(dueNow(progress, Date.now(), pool))
  const more = mode === 'study' && left > 0
  const title = mode === 'practice' ? 'Round done!' : more ? 'Nice work!' : total ? 'All caught up!' : 'Nothing to review'
  const text =
    mode === 'practice'
      ? 'Practice as often as you like: it never changes when your cards come back.'
      : more
        ? `${left} more ${left === 1 ? 'card is' : 'cards are'} waiting. Keep going or take a break.`
        : total
          ? 'Every card comes back right when you are about to forget it. Want to practice some more?'
          : 'Come back when your cards are due.'
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 text-center">
        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}>
          <Buddy id={progress.traveler} mood="celebrate" size={160} />
        </motion.div>
        <div>
          <h1 className="text-3xl font-black text-gold-dark">{title}</h1>
          <p className="mt-1 max-w-sm text-muted">{text}</p>
        </div>
        {gems > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="card flex items-center gap-2 px-5 py-3 text-xl font-black text-sky-dark"
          >
            <IconGem className="h-7 w-7" />+{gems}
          </motion.div>
        )}
      </main>
      <footer className="safe-bottom border-t-2 border-line">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 py-4">
          {(total > 0 || mode === 'practice' || more) && (
            <button type="button" autoFocus onClick={() => onRestart(more ? 'study' : 'practice')} className="btn btn-primary w-full">
              {more ? `Study ${Math.min(left, progress.sessionSize)} more` : 'Practice again'}
            </button>
          )}
          <button type="button" onClick={onExit} className="btn btn-ghost w-full">
            Continue
          </button>
        </div>
      </footer>
    </>
  )
}
