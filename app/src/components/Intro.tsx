import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import screens from '../data/intro-screens.json'
import { asset } from '../data/journey'
import { useT } from '../i18n'
import { useProgress } from '../lib/progress'

/** A spot on the screen of the phone in the painting: shares of the screen's width and height. */
type Spot = { x: number; y: number; w: number; h: number }
type Slide = {
  image: keyof typeof screens | 'intro-1-welcome'
  /** The icon the app shows at the bottom for the tab this slide is about (its name is in the texts). */
  tabIcon?: string
  /** What to look at on the phone's screen, circled in red just outside it (`thin` for a tight space). */
  mark?: Spot & { round?: boolean; thin?: boolean }
}

// The quick tour: each slide is a painting of the four friends around a phone that shows a real screen of the app, with the
// part to look at circled in red and the tab it belongs to named above the picture. Nothing is drawn over the characters.
// The words of each slide are in i18n/en.ts and i18n/es.ts, in this same order.
const SLIDES: Slide[] = [
  { image: 'intro-1-welcome' },
  { image: 'intro-2-map', tabIcon: 'nav-map.webp', mark: { x: 0.4, y: 0.36, w: 0.2, h: 0.1, round: true } },
  // around the dots only: the lesson's name is above them and the door below
  { image: 'intro-3-doors', tabIcon: 'nav-map.webp', mark: { x: 0.262, y: 0.163, w: 0.476, h: 0.042, round: true, thin: true } },
  { image: 'intro-4-write', tabIcon: 'nav-write.webp', mark: { x: 0.055, y: 0.16, w: 0.89, h: 0.455 } },
  { image: 'intro-5-review', tabIcon: 'nav-review.webp', mark: { x: 0.03, y: 0.893, w: 0.94, h: 0.1, round: true } },
  { image: 'intro-6-profile', tabIcon: 'nav-profile.webp', mark: { x: 0.035, y: 0.282, w: 0.93, h: 0.115, round: true } },
]

/** How far a finger must travel sideways to turn the page. */
const SWIPE = 50
/** The share of the picture's width the phone should take, so the screen can be read. */
const PHONE_SHARE = 0.42
const ASPECT = 0.8 // the paintings are 4:5

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const pct = (n: number) => `${n * 100}%`

/** Where the picture sits in its frame: zoomed in on the phone (the phone's centre near the middle), never past the edges. */
function framing(image: Slide['image']) {
  const screen = image === 'intro-1-welcome' ? null : screens[image]
  if (!screen) return { s: 1, tx: 0, ty: 0, screen: null }
  const s = clamp(PHONE_SHARE / screen.w, 1.15, 2)
  const tx = clamp(0.5 - s * (screen.x + screen.w / 2), 1 - s, 0)
  const ty = clamp(0.46 - s * (screen.y + screen.h / 2), 1 - s, 0)
  return { s, tx, ty, screen }
}

/** The largest 4:5 box that fits the space it is given, so the marks drawn over the picture stay on their spot. */
function useFit() {
  const holder = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = holder.current
    if (!el) return
    const fit = () => {
      const w = Math.min(el.clientWidth, el.clientHeight * ASPECT)
      setBox({ w, h: w / ASPECT })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { holder, box }
}

/** The quick tour, over everything else. `onDone` runs when it is finished or skipped. */
export function Intro({ onDone }: { onDone: () => void }) {
  const { nickname } = useProgress()
  const t = useT().intro
  const [i, setI] = useState(0)
  // 1 when moving on, -1 when going back: the picture slides in from that side.
  const [dir, setDir] = useState(1)
  const start = useRef<number | null>(null)
  const { holder, box } = useFit()
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]
  const text = t.slides[i]
  const { s, tx, ty, screen } = framing(slide.image)

  // The first picture is the page's own; the rest, and the screens that go on their phones, are fetched while the learner reads it.
  useEffect(() => {
    SLIDES.forEach((sl) => {
      const files = [`intro/${sl.image}.webp`, ...(sl.image === 'intro-1-welcome' ? [] : [`intro/screens/${sl.image}.webp`])]
      files.forEach((f) => (new Image().src = asset(f)))
    })
  }, [])

  const go = (to: number) => {
    if (to < 0) return
    if (to >= SLIDES.length) return onDone()
    setDir(to > i ? 1 : -1)
    setI(to)
  }

  // The phone's screen as a rectangle over the framed picture (shares of the frame).
  const live = screen && { left: screen.x * s + tx, top: screen.y * s + ty, width: screen.w * s, height: screen.h * s }
  const screenFile = asset(`intro/screens/${slide.image}.webp`)

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
        <div className="flex h-10 items-center justify-between">
          {slide.tabIcon ? (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-line bg-card py-0.5 pr-3.5 pl-1.5 text-sm font-black">
              <img src={asset(slide.tabIcon)} alt="" className="h-7 w-7" draggable={false} />
              {text.tab}
            </span>
          ) : (
            <span />
          )}
          <button type="button" onClick={onDone} className="rounded-xl px-3 py-2 text-sm font-extrabold text-muted">
            {t.skip}
          </button>
        </div>

        <div ref={holder} className="flex min-h-0 flex-1 items-center justify-center">
          <div
            className="relative shrink-0 overflow-hidden rounded-[2rem] border-2 border-line bg-line shadow-[0_6px_0_var(--color-line)]"
            style={{ width: box.w, height: box.h }}
          >
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                <img
                  src={asset(`intro/${slide.image}.webp`)}
                  alt={text.alt}
                  draggable={false}
                  className="absolute max-w-none select-none"
                  style={{ width: pct(s), height: pct(s), left: pct(tx), top: pct(ty) }}
                />
                {/* The real screen, over the painting's phone at its own resolution, so it stays sharp when enlarged. Its picture is
                    cut like the phone's screen (rounded corners) and has a hole wherever a hand or a wing is in front of it, so
                    the characters stay on top; the red mark is cut by the same shape. */}
                {live && (
                  <div
                    className="absolute"
                    style={{ left: pct(live.left), top: pct(live.top), width: pct(live.width), height: pct(live.height) }}
                  >
                    <img src={screenFile} alt="" draggable={false} className="absolute inset-0 h-full w-full max-w-none select-none" />
                    {slide.mark && (
                      <div
                        className="absolute inset-0"
                        style={{
                          maskImage: `url(${screenFile})`,
                          WebkitMaskImage: `url(${screenFile})`,
                          maskSize: '100% 100%',
                          WebkitMaskSize: '100% 100%',
                        }}
                      >
                        <motion.span
                          className={`absolute border-brand ${slide.mark.thin ? 'border-2' : 'border-[3px]'} ${slide.mark.round ? 'rounded-full' : 'rounded-2xl'}`}
                          style={{
                            left: pct(slide.mark.x),
                            top: pct(slide.mark.y),
                            width: pct(slide.mark.w),
                            height: pct(slide.mark.h),
                            boxShadow: `0 0 0 ${slide.mark.thin ? 2 : 4}px rgba(224,69,58,.25)`,
                          }}
                          animate={{ opacity: [1, 0.55, 1] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
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
              <h1 className="text-[28px] leading-tight font-black">{text.title(nickname)}</h1>
              <p className="max-w-sm text-[15px] leading-snug text-muted">{text.text}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 py-2" aria-hidden="true">
            {SLIDES.map((_, n) => (
              <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-brand' : 'w-2 bg-line-dark'}`} />
            ))}
          </div>

          <button type="button" autoFocus onClick={() => go(i + 1)} className="btn btn-primary w-full">
            {last ? t.letsGo : t.next}
          </button>
        </div>
      </div>
    </div>
  )
}
