import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { asset } from '../data/journey'
import { useProgress } from '../lib/progress'

type Slide = { image: string; alt: string; title: (name: string) => string; text: string }

// The quick tour: five short screens, each a painting of the four friends and one line about how the app works.
const SLIDES: Slide[] = [
  {
    image: 'intro/intro-1-welcome.webp',
    alt: 'The four friends smiling together at sunrise, with the little train on the bridge behind them',
    title: (name) => (name ? `Hi, ${name}!` : 'Hi there!'),
    text: 'We are Wāwa, Yīngyīng, Lǎnlǎn and Zuǐzuǐ, your travel buddies. Let’s learn Mandarin together, one stop at a time.',
  },
  {
    image: 'intro/intro-2-journey.webp',
    alt: 'The friends walking along the station platform towards the steam train',
    title: () => 'Travel through Panama',
    text: 'Every province is a stop on the map. Hop on the train and visit real places as you learn.',
  },
  {
    image: 'intro/intro-3-doors.webp',
    alt: 'Wāwa in front of a red door with five blank tokens floating above it',
    title: () => 'Open a door, learn 5 words',
    text: 'Each lesson is a door with five new words. Meet them, hear them and use them.',
  },
  {
    image: 'intro/intro-4-practice.webp',
    alt: 'The friends listening, writing and building at a table, while Wāwa points to them',
    title: () => 'Listen, tap and write',
    text: 'Match pairs, listen, build sentences and trace characters. Every lesson mixes them up.',
  },
  {
    image: 'intro/intro-5-review.webp',
    alt: 'Wāwa cheering beside blue gems, study cards and a streak flame',
    title: () => 'Review and earn gems',
    text: 'Review cards bring each word back right before you forget it. Keep your streak going!',
  },
]

/** How far a finger must travel sideways to turn the page. */
const SWIPE = 50

/** The quick tour, over everything else. `onDone` runs when it is finished or skipped. */
export function Intro({ onDone }: { onDone: () => void }) {
  const { nickname } = useProgress()
  const [i, setI] = useState(0)
  // 1 when moving on, -1 when going back: the picture slides in from that side.
  const [dir, setDir] = useState(1)
  const start = useRef<number | null>(null)
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]

  // The first picture is the page's own; the rest are fetched while the learner reads it.
  useEffect(() => {
    SLIDES.forEach((s) => {
      const img = new Image()
      img.src = asset(s.image)
    })
  }, [])

  const go = (to: number) => {
    if (to < 0) return
    if (to >= SLIDES.length) return onDone()
    setDir(to > i ? 1 : -1)
    setI(to)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-paper"
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerUp={(e) => {
        if (start.current === null) return
        const dx = e.clientX - start.current
        start.current = null
        if (Math.abs(dx) > SWIPE) go(i + (dx < 0 ? 1 : -1))
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1)
        if (e.key === 'ArrowLeft') go(i - 1)
      }}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex h-10 items-center justify-end">
          <button type="button" onClick={onDone} className="rounded-xl px-3 py-2 text-sm font-extrabold text-muted">
            Skip
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border-2 border-line bg-line shadow-[0_6px_0_var(--color-line)]">
          <AnimatePresence initial={false} custom={dir}>
            <motion.img
              key={i}
              src={asset(slide.image)}
              alt={slide.alt}
              draggable={false}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 h-full w-full object-cover select-none"
            />
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-2 pt-5 text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-[8.5rem] flex-col items-center gap-2"
            >
              <h1 className="text-[28px] leading-tight font-black">{slide.title(nickname)}</h1>
              <p className="max-w-sm text-[15px] leading-snug text-muted">{slide.text}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 py-2" aria-hidden="true">
            {SLIDES.map((_, n) => (
              <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-brand' : 'w-2 bg-line-dark'}`} />
            ))}
          </div>

          <button type="button" autoFocus onClick={() => go(i + 1)} className="btn btn-primary w-full">
            {last ? 'Let’s go!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
