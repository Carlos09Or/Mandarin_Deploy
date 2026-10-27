import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { word } from '../data/course'
import { chime, pinRandomVoice, unpinVoice } from '../lib/audio'
import { retry, type Exercise } from '../lib/lesson'
import { recordAnswer, recordTrace } from '../lib/progress'
import { AudioButton } from '../components/AudioButton'
import { IconClose } from '../components/icons'
import { Buddy } from '../components/Friends'
import type { FriendId } from '../data/friends'
import { Choice } from './Choice'
import { Intro } from './Intro'
import { Match } from './Match'
import { Sentence } from './Sentence'
import { Trace } from './Trace'

export type LessonSummary = { durationMs: number; answers: number; mistakes: number }
type Props = { exercises: Exercise[]; buddy: FriendId; onExit: () => void; onFinish: (s: LessonSummary) => void }

const PRAISE = [
  ['很好！', 'hěn hǎo', 'Very good!'],
  ['太棒了！', 'tài bàng le', 'Excellent!'],
  ['对了！', 'duì le', 'Correct!'],
  ['非常好！', 'fēicháng hǎo', 'Perfect!'],
]

type Feedback = { correct: boolean; title: string; detail?: string; sub?: string }

export function LessonPlayer({ exercises, buddy, onExit, onFinish }: Props) {
  const [queue, setQueue] = useState(exercises)
  const [pos, setPos] = useState(0)
  const [done, setDone] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [order, setOrder] = useState<number[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const stats = useRef({ answers: 0, mistakes: 0, start: 0 })

  useEffect(() => {
    stats.current.start = Date.now()
  }, [])

  // Each exercise gets one of the voices at random; replays within it keep the same voice.
  useEffect(() => {
    pinRandomVoice()
  }, [pos])
  useEffect(() => unpinVoice, [])

  const ex = queue[pos]
  const total = exercises.length
  // Lets browser tests read the current exercise; stripped from production builds.
  if (import.meta.env.DEV) Object.assign(window, { __lesson: { ex, word } })

  const advance = useCallback(() => {
    setSelected(null)
    setOrder([])
    setFeedback(null)
    if (pos + 1 >= queue.length) {
      const s = stats.current
      onFinish({ durationMs: Date.now() - s.start, answers: s.answers, mistakes: s.mistakes })
    } else {
      setPos(pos + 1)
    }
  }, [pos, queue.length, onFinish])

  const grade = useCallback(
    (correct: boolean, fb: Feedback, requeue = false) => {
      stats.current.answers++
      if (!correct) stats.current.mistakes++
      if (correct || !requeue) setDone((d) => d + 1)
      else setQueue((q) => [...q, retry(ex)])
      ;(fb.correct ? chime.correct : chime.wrong)()
      setFeedback(fb)
    },
    [ex],
  )

  const check = useCallback(() => {
    if (ex.kind === 'sentence') {
      if (!order.length) return
      const correct = order.map((i) => ex.bank[i]).join('') === ex.tokens.join('')
      const ewx = word(ex.word).example
      const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]
      grade(
        correct,
        { correct, title: correct ? `${p[0]} ${p[2]}` : 'Correct sentence:', detail: ewx.hanzi, sub: `${ewx.pinyin} · ${ewx.en}` },
        true,
      )
      return
    }
    if (ex.kind !== 'choice' || selected === null) return
    const correct = selected === ex.word
    recordAnswer(ex.word, correct)
    const w = word(ex.word)
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]
    grade(
      correct,
      correct
        ? { correct, title: `${p[0]} ${p[2]}`, detail: `${w.hanzi} · ${w.pinyin} · ${w.en}` }
        : { correct, title: 'Correct answer:', detail: `${w.hanzi} · ${w.pinyin} · ${w.en}` },
      true,
    )
  }, [ex, selected, order, grade])

  const onPrimary = () => {
    if (feedback) return advance()
    if (ex.kind === 'intro') {
      setDone((d) => d + 1)
      return advance()
    }
    check()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !confirmExit) {
        e.preventDefault()
        document.getElementById('lesson-primary')?.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmExit])

  const primaryLabel = (ex.kind === 'choice' || ex.kind === 'sentence') && !feedback ? 'Check' : 'Continue'
  const primaryDisabled =
    !feedback &&
    ((ex.kind === 'choice' && selected === null) ||
      (ex.kind === 'sentence' && order.length === 0) ||
      ex.kind === 'match' ||
      ex.kind === 'trace')
  const fbAudio =
    ex.kind === 'sentence' ? word(ex.word).example.hanzi : ex.kind === 'intro' || ex.kind === 'match' ? null : word(ex.word).hanzi

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2">
        <button type="button" aria-label="Quit lesson" onClick={() => setConfirmExit(true)} className="text-muted">
          <IconClose className="h-7 w-7" />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-jade"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, (done / total) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div className="mx-2 mt-1 h-1 rounded-full bg-white/35" />
          </motion.div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-8 sm:px-6 sm:pt-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pos}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.18 }}
            >
              {ex.kind === 'intro' && <Intro n={ex.word} />}
              {ex.kind === 'choice' && (
                <Choice ex={ex} selected={selected} onSelect={setSelected} revealed={!!feedback} />
              )}
              {ex.kind === 'sentence' && (
                <Sentence ex={ex} order={order} onOrder={setOrder} revealed={!!feedback} />
              )}
              {ex.kind === 'match' && (
                <Match
                  words={ex.words}
                  onDone={(m) =>
                    grade(m === 0, { correct: true, title: m === 0 ? 'All on the first try!' : 'All pairs matched!' })
                  }
                />
              )}
              {ex.kind === 'trace' && (
                <Trace
                  key={`${pos}-${ex.char}`}
                  char={ex.char}
                  n={ex.word}
                  guided={ex.guided}
                  onDone={(m) => {
                    recordTrace(ex.char, m)
                    grade(m < 3, {
                      correct: true,
                      title: m === 0 ? 'Perfect strokes!' : m < 3 ? 'Well written!' : 'Done. Practice it in Write.',
                      detail: `${ex.char} · ${m} ${m === 1 ? 'mistake' : 'mistakes'}`,
                    })
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer
        className={`safe-bottom border-t-2 transition-colors ${
          !feedback ? 'border-line bg-paper' : feedback.correct ? 'border-transparent bg-jade-soft' : 'border-transparent bg-wrong-soft'
        }`}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-6">
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-1 items-center gap-3 ${feedback.correct ? 'text-jade-dark' : 'text-wrong'}`}
              >
                <div className="-my-4 -ml-2 shrink-0">
                  <Buddy key={`${pos}-${feedback.correct}`} id={buddy} mood={feedback.correct ? 'happy' : 'sad'} size={72} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-extrabold">{feedback.title}</p>
                  {feedback.detail && <p className="han line-clamp-2 text-base font-semibold">{feedback.detail}</p>}
                  {feedback.sub && <p className="line-clamp-2 text-sm opacity-80">{feedback.sub}</p>}
                </div>
                {fbAudio && <AudioButton text={fbAudio} size="sm" />}
              </motion.div>
            )}
          </AnimatePresence>
          {!feedback && <div className="hidden flex-1 sm:block" />}
          <button
            id="lesson-primary"
            type="button"
            disabled={primaryDisabled}
            onClick={onPrimary}
            className={`btn w-full sm:w-44 ${feedback && !feedback.correct ? 'btn-wrong' : feedback ? 'btn-jade' : 'btn-primary'}`}
          >
            {primaryLabel}
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {confirmExit && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmExit(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="safe-bottom w-full max-w-md rounded-t-3xl bg-card p-6 text-center sm:rounded-3xl"
            >
              <p className="han text-5xl">等等！</p>
              <p className="mt-3 text-xl font-extrabold">Are you sure you want to quit?</p>
              <p className="mt-1 text-muted">You’ll lose your progress in this lesson.</p>
              <div className="mt-6 flex flex-col gap-3">
                <button type="button" className="btn btn-primary" onClick={() => setConfirmExit(false)}>
                  Keep learning
                </button>
                <button type="button" className="btn text-wrong" onClick={onExit}>
                  Quit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
