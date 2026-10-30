import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { plainPinyin, word } from '../data/course'
import { chime, pinRandomVoice, unpinVoice } from '../lib/audio'
import { retry, type Exercise } from '../lib/lesson'
import { isNight, recordAnswer, recordTrace, useProgress } from '../lib/progress'
import { AudioButton } from '../components/AudioButton'
import { IconClose } from '../components/icons'
import { Buddy } from '../components/Friends'
import type { FriendId } from '../data/friends'
import { Choice } from './Choice'
import { Cloze } from './Cloze'
import { Intro } from './Intro'
import { Match } from './Match'
import { Pinyin } from './Pinyin'
import { Sentence } from './Sentence'
import { ToneExercise } from './Tone'
import { Trace } from './Trace'

export type LessonSummary = { durationMs: number; answers: number; mistakes: number }
type Props = {
  exercises: Exercise[]
  buddy: FriendId
  /** The stop this lesson rides to, announced when the lesson ends. */
  station?: string
  onExit: () => void
  onFinish: (s: LessonSummary) => void
}

const PRAISE = [
  ['很好！', 'hěn hǎo', 'Very good!'],
  ['太棒了！', 'tài bàng le', 'Excellent!'],
  ['对了！', 'duì le', 'Correct!'],
  ['非常好！', 'fēicháng hǎo', 'Perfect!'],
]

type Feedback = { correct: boolean; title: string; detail?: string; sub?: string }

/** Pinyin as typed: tone marks, numbers, spaces and v-for-ü don't matter. */
const plain = (s: string) => plainPinyin(s.replace(/v/gi, 'u'))
const readings = (pinyin: string) => pinyin.split('/').map(plain)

export function LessonPlayer({ exercises, buddy, station, onExit, onFinish }: Props) {
  const [queue, setQueue] = useState(exercises)
  const [pos, setPos] = useState(0)
  const [done, setDone] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [order, setOrder] = useState<number[]>([])
  const [typed, setTyped] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [arrived, setArrived] = useState(false)
  const stats = useRef({ answers: 0, mistakes: 0, start: 0 })
  const night = isNight(useProgress())

  useEffect(() => {
    stats.current.start = Date.now()
  }, [])

  // Each exercise gets one of the voices at random; replays within it keep the same voice.
  useEffect(() => {
    pinRandomVoice()
  }, [pos])
  useEffect(() => unpinVoice, [])

  const ex = queue[pos]
  // The lesson's new words, in order: each one is brought in by a different friend (see Intro).
  const intros = queue.filter((e): e is Extract<Exercise, { kind: 'intro' }> => e.kind === 'intro')
  const introStep = intros.indexOf(ex as (typeof intros)[number])
  const total = exercises.length
  // Lets browser tests read the current exercise or jump to the end; stripped from production builds.
  if (import.meta.env.DEV)
    Object.assign(window, { __lesson: { ex, word, finish: () => onFinish({ durationMs: 95000, answers: 12, mistakes: 1 }) } })

  const advance = useCallback(() => {
    setSelected(null)
    setOrder([])
    setTyped('')
    setFeedback(null)
    if (pos + 1 >= queue.length) {
      const s = stats.current
      const summary = { durationMs: Date.now() - s.start, answers: s.answers, mistakes: s.mistakes }
      if (!station) return onFinish(summary)
      // Pull into the station before the score screen.
      setArrived(true)
      setTimeout(() => onFinish(summary), 1300)
    } else {
      setPos(pos + 1)
    }
  }, [pos, queue.length, onFinish, station])

  // Dev only: lets browser tests step past an exercise.
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign((window as unknown as { __lesson: object }).__lesson, { next: advance })
  }, [advance])

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
    if (ex.kind === 'cloze') {
      if (selected === null) return
      const correct = ex.options[selected] === ex.tokens[ex.blank]
      const ewx = word(ex.word).example
      const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]
      grade(
        correct,
        { correct, title: correct ? `${p[0]} ${p[2]}` : 'Correct sentence:', detail: ewx.hanzi, sub: `${ewx.pinyin} · ${ewx.en}` },
        true,
      )
      return
    }
    if (ex.kind === 'tone') {
      if (selected === null) return
      const correct = selected === ex.tone
      const w = word(ex.word)
      const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]
      grade(
        correct,
        {
          correct,
          title: correct ? `${p[0]} ${p[2]}` : `Correct answer: tone ${ex.tone}`,
          detail: `${w.hanzi} · ${w.pinyin} · ${w.en}`,
        },
        true,
      )
      return
    }
    if (ex.kind === 'pinyin') {
      if (!typed.trim()) return
      const w = word(ex.word)
      const correct = readings(w.pinyin).includes(plain(typed))
      recordAnswer(ex.word, correct)
      const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]
      grade(
        correct,
        { correct, title: correct ? `${p[0]} ${p[2]}` : 'Correct answer:', detail: `${w.hanzi} · ${w.pinyin} · ${w.en}` },
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
  }, [ex, selected, order, typed, grade])

  const giveUp = () => {
    if (ex.kind !== 'pinyin' || feedback) return
    const w = word(ex.word)
    recordAnswer(ex.word, false)
    grade(false, { correct: false, title: 'Correct answer:', detail: `${w.hanzi} · ${w.pinyin} · ${w.en}` }, true)
  }

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

  const primaryLabel = ex.kind !== 'intro' && !feedback ? 'Check' : 'Continue'
  const primaryDisabled =
    !feedback &&
    ((ex.kind === 'choice' && selected === null) ||
      (ex.kind === 'sentence' && order.length === 0) ||
      (ex.kind === 'pinyin' && !typed.trim()) ||
      ((ex.kind === 'cloze' || ex.kind === 'tone') && selected === null) ||
      ex.kind === 'match' ||
      ex.kind === 'trace')
  const fbAudio =
    ex.kind === 'sentence' || ex.kind === 'cloze'
      ? word(ex.word).example.hanzi
      : ex.kind === 'intro' || ex.kind === 'match'
        ? null
        : word(ex.word).hanzi

  return (
    <div className={`fixed inset-0 z-40 flex flex-col bg-paper ${night ? 'lesson-night' : ''}`}>
      <header className="mx-auto flex w-full max-w-lg items-center gap-4 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2">
        <button type="button" aria-label="Quit lesson" onClick={() => setConfirmExit(true)} className="text-muted">
          <IconClose className="h-7 w-7" />
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-jade"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, (done / total) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div className="mx-2 mt-[3px] h-[3px] rounded-full bg-white/35" />
          </motion.div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 pt-6 pb-6 sm:pt-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pos}
              className="flex flex-1 flex-col"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.18 }}
            >
              {ex.kind === 'intro' && <Intro n={ex.word} step={introStep} count={intros.length} lead={intros[0].word} />}
              {ex.kind === 'choice' && (
                <Choice ex={ex} selected={selected} onSelect={setSelected} revealed={!!feedback} />
              )}
              {ex.kind === 'sentence' && (
                <Sentence ex={ex} order={order} onOrder={setOrder} revealed={!!feedback} />
              )}
              {ex.kind === 'pinyin' && (
                <Pinyin ex={ex} value={typed} onChange={setTyped} onGiveUp={giveUp} revealed={!!feedback} />
              )}
              {ex.kind === 'cloze' && (
                <Cloze ex={ex} selected={selected} onSelect={setSelected} revealed={!!feedback} />
              )}
              {ex.kind === 'tone' && (
                <ToneExercise ex={ex} selected={selected} onSelect={setSelected} revealed={!!feedback} />
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
                  guide={ex.guide}
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
        className={`safe-bottom transition-colors ${
          !feedback ? 'bg-paper' : feedback.correct ? 'rounded-t-3xl bg-jade-soft' : 'rounded-t-3xl bg-wrong-soft'
        }`}
      >
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-5 py-4">
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
                    <button
            id="lesson-primary"
            type="button"
            disabled={primaryDisabled}
            onClick={onPrimary}
            className={`btn w-full ${feedback && !feedback.correct ? 'btn-wrong' : 'btn-jade'}`}
          >
            {primaryLabel}
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {arrived && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper/90 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.p className="han text-6xl font-black text-brand" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
              到了！
            </motion.p>
            <p className="mt-2 text-xl font-black">{station}</p>
            <p className="font-bold text-muted">dào le · you arrived</p>
          </motion.div>
        )}
      </AnimatePresence>

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
