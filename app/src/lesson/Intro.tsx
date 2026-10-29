import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { word } from '../data/course'
import sprites from '../data/word-sprites.json'
import { asset } from '../data/journey'
import { whenLoaded } from '../journey/preload'
import { speak } from '../lib/audio'
import { AudioButton } from '../components/AudioButton'
import { Stage } from './Stage'
import { POSES, QUICK, file, type Friend, type Pose } from './friends'

// A new word is brought in by one of the friends holding up a sign with it. The three quick ones take
// turns and arrive from different sides; the sloth is always the last word of the lesson and takes
// his time. The pictures are cut from the design storyboards (public/journey/words).

const SPRITES = sprites as Record<string, { w: number; h: number }>

/** Everything is sized from the sign's width, `--w`, so it scales with the screen. */
const W = 'var(--w)'
/** The sign is 0.62 of its width tall, and the friends stand on its top edge. */
const SIGN_H = 0.62
const HEIGHT = SIGN_H + 0.36
/** The friends are only company for the sign: the hanzi is the star, so they are drawn small. */
const CHAR = 0.42
/** The sloth lifts the sign to the top: it travels this share of its own height. */
const LIFT = `${((HEIGHT - SIGN_H) / SIGN_H) * 100}%`
const SLOTH_UP = 0.38
/** The quick friends wait this long (seconds) after the sign pops up before they fly in. */
const ARRIVE = 0.3

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Props = {
  n: number
  /** Position of this word among the lesson's new words, how many there are, and the first one's number. */
  step: number
  count: number
  lead: number
}

export function Intro({ n, step, count, lead }: Props) {
  const w = word(n)
  const friend: Friend = count > 1 && step === count - 1 ? 'sloth' : QUICK[(lead + step) % QUICK.length]
  const fromLeft = (lead + step) % 2 === 0
  const sloth = friend === 'sloth'

  const [ready, setReady] = useState(false)
  /** The quick friends stay out of sight until the sign is up, then fly in. */
  const [arrived, setArrived] = useState(false)
  const [pose, setPose] = useState<Pose>(sloth ? 'peek' : 'enter')
  const [lifted, setLifted] = useState(false)
  const [shown, setShown] = useState(false)
  const [instant, setInstant] = useState(false)
  const timers = useRef<number[]>([])
  const spoke = useRef(false)

  const say = () => {
    if (spoke.current) return
    spoke.current = true
    speak(w.hanzi)
  }
  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => {
    let alive = true
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(() => alive && fn(), ms))
    const blink = () =>
      at(2400, () => {
        setPose('idle')
        at(700, () => {
          setPose('settled')
          blink()
        })
      })

    void whenLoaded(POSES[friend].map((p) => file(friend, p)), 2500).then(() => {
      if (!alive) return
      if (reduced()) return finish()
      setReady(true)
      if (sloth) {
        // He rises behind the sign, strains, then lifts it over his head.
        at(550, () => setPose('effort'))
        at(1050, () => setLifted(true))
        at(1250, () => setPose('up-effort'))
        at(1900, () => {
          setPose('up-done')
          setShown(true)
          say()
        })
      } else {
        // The sign pops up first; the friend arrives a moment later and lands on it.
        setShown(true)
        say()
        at(ARRIVE * 1000, () => setArrived(true))
        at(ARRIVE * 1000 + 560, () => setPose('alert'))
        at(ARRIVE * 1000 + 1150, () => {
          setPose('settled')
          blink()
        })
      }
    })
    return () => {
      alive = false
      clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** A tap (or reduced motion) jumps to the end of the show. */
  function finish() {
    clear()
    setInstant(true)
    setReady(true)
    setArrived(true)
    setLifted(true)
    setShown(true)
    setPose(sloth ? 'up-done' : 'settled')
    say()
  }

  const len = [...w.hanzi].length
  // as big as the sign allows, always on one line (the inner width is a bit under one `--w`)
  const hanziSize = len === 1 ? 0.56 : len === 2 ? 0.43 : len === 3 ? 0.29 : 0.22
  const spring = { type: 'spring' as const, stiffness: 260, damping: 18 }

  // Quick friends fly in from a side (the bird dives from above); each lands on the sign's top edge.
  const dx = fromLeft ? -440 : 440
  const start = friend === 'harpia' ? { x: dx / 3, y: -460 } : { x: dx, y: 0 }
  const size = SPRITES[`${friend}-${pose}`]
  // Starts sunk behind the sign (the sprite is bottom-aligned, so 60% of its height is enough).
  const peekRise = '60%'

  return (
    <Stage eyebrow="New word">
      <div
        className="-mx-5 flex flex-1 flex-col items-center justify-center gap-3 overflow-x-clip px-5 text-center"
        style={{ ['--w' as string]: 'clamp(224px, 64vw, 270px)' }}
        onClick={() => (!shown || pose === 'enter' || pose === 'alert') && finish()}
      >
        <div className="relative shrink-0" style={{ width: W, height: `calc(${W} * ${HEIGHT})` }}>
          {/* the sign */}
          <motion.div
            className="absolute inset-x-0 z-20 flex items-center justify-center rounded-2xl border-2 border-line-dark bg-card shadow-[0_3px_0_var(--color-line)]"
            style={sloth ? { top: 0, height: `calc(${W} * ${SIGN_H})` } : { bottom: 0, height: `calc(${W} * ${SIGN_H})` }}
            initial={sloth ? { y: LIFT, scale: 1 } : { scale: 0.7, opacity: 0 }}
            animate={
              sloth
                ? { y: lifted ? 0 : LIFT, x: ready && !lifted && pose === 'effort' ? [0, -3, 3, -3, 3, 0] : 0 }
                : { scale: shown ? 1 : 0.7, opacity: shown ? 1 : 0 }
            }
            transition={
              instant
                ? { duration: 0 }
                : sloth
                  ? { y: { duration: 0.7, ease: [0.45, 0, 0.3, 1] }, x: { duration: 0.3, repeat: lifted ? 0 : 1 } }
                  : spring
            }
          >
            <motion.span
              className="han leading-none font-medium whitespace-nowrap text-[#15110e]"
              style={{ fontSize: `calc(${W} * ${hanziSize})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: shown ? 1 : 0 }}
              transition={{ duration: instant ? 0 : 0.25 }}
            >
              {w.hanzi}
            </motion.span>
          </motion.div>

          {/* the sound buttons, on the side of the sign */}
          <motion.div
            className="absolute z-20 flex flex-col items-center justify-center gap-2"
            style={{ left: `calc(100% + 10px)`, ...(sloth ? { top: 0 } : { bottom: 0 }), height: `calc(${W} * ${SIGN_H})` }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: shown ? 1 : 0, x: shown ? 0 : -6 }}
            transition={{ duration: instant ? 0 : 0.3, delay: instant ? 0 : 0.15 }}
          >
            <AudioButton text={w.hanzi} size="sm" />
            <AudioButton text={w.hanzi} size="sm" slow />
          </motion.div>

          {/* the quick friends: fly in, land on the sign, blink */}
          {!sloth && (
            <div
              className="absolute z-10"
              style={{ bottom: `calc(${W} * ${SIGN_H} - 2px)`, [fromLeft ? 'left' : 'right']: '3%' }}
            >
              <motion.div
                initial={{ ...start, opacity: 0 }}
                // driven by state on both sides: the first exercise of a lesson mounts with `initial` switched off
                animate={arrived ? { x: 0, y: 0, opacity: 1 } : { ...start, opacity: 0 }}
                transition={
                  instant
                    ? { duration: 0 }
                    : {
                        duration: friend === 'harpia' ? 0.5 : 0.56,
                        ease: friend === 'harpia' ? 'easeIn' : 'easeOut',
                        opacity: { duration: 0.12 },
                      }
                }
              >
                <motion.div
                  animate={arrived && friend !== 'harpia' && !instant ? { y: [0, -36, 0] } : undefined}
                  transition={{ duration: 0.56, ease: 'easeInOut' }}
                >
                  <img
                    src={asset(file(friend, pose))}
                    alt=""
                    draggable={false}
                    className="pointer-events-none block max-w-none select-none"
                    style={{
                      width: `calc(${W} * ${size.w * CHAR})`,
                      transform: pose === 'enter' && friend !== 'harpia' && !fromLeft ? 'scaleX(-1)' : undefined,
                    }}
                  />
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* the sloth: peeks over the sign, strains, then holds it above his head */}
          {sloth && (
            <>
              <div className="absolute left-1/2 z-10 -translate-x-1/2" style={{ bottom: `calc(${W} * ${SIGN_H} - 2px)` }}>
                <motion.img
                  src={asset(file('sloth', pose === 'effort' ? 'effort' : 'peek'))}
                  alt=""
                  draggable={false}
                  className="pointer-events-none block max-w-none select-none"
                  style={{ width: `calc(${W} * ${SPRITES['sloth-peek'].w * CHAR})` }}
                  initial={{ y: peekRise }}
                  animate={{ y: ready ? 0 : peekRise, opacity: lifted ? 0 : 1 }}
                  transition={instant ? { duration: 0 } : { y: { duration: 0.4, ease: 'easeOut' }, opacity: { duration: 0.12 } }}
                />
              </div>
              <motion.div
                className="absolute left-1/2 z-10 -translate-x-1/2"
                style={{ top: `calc(${W} * ${SIGN_H})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: lifted ? 1 : 0 }}
                transition={{ duration: instant ? 0 : 0.2, delay: lifted && !instant ? 0.2 : 0 }}
              >
                <img
                  src={asset(file('sloth', pose === 'up-done' ? 'up-done' : 'up-effort'))}
                  alt=""
                  draggable={false}
                  className="pointer-events-none block max-w-none select-none"
                  style={{ width: `calc(${W} * ${SPRITES['sloth-up-done'].w * SLOTH_UP})` }}
                />
              </motion.div>
            </>
          )}
        </div>

        <motion.div
          className="flex flex-col items-center gap-1"
          style={{ width: W }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 8 }}
          transition={{ duration: instant ? 0 : 0.3 }}
        >
          <p className="text-[1.7rem] leading-tight font-extrabold text-sky-dark">{w.pinyin}</p>
          <p className="text-2xl leading-tight font-extrabold text-brand-dark">{w.en}</p>
        </motion.div>
      </div>
    </Stage>
  )
}
