import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { FriendId } from '../data/friends'
import { FLIGHT_POSES, asset, type FlightPose } from '../data/journey'
import './journey.css'

export type FlyerHandle = {
  /** Flies the traveller from the corner of the map into `badge`; resolves once the badge has taken them in. */
  fly: (badge: HTMLElement) => Promise<void>
}
type Props = {
  friend: FriendId
  active: boolean
  /** Called with true when a flight starts and false when it ends, so the rest of the map can stand still meanwhile. */
  onFlight?: (on: boolean) => void
}

/** The crouch before take-off, the flight itself (as long as the distance asks) and the slip into the badge. */
const CROUCH = 230
const SLIP = 380
const flightMs = (dist: number) => Math.min(1450, Math.max(1000, 900 + dist * 0.8))
const WING_MS = 105
/** Size of the traveller when it reaches the badge, relative to the corner. */
const FAR = 0.42
/** Points the curve is cut into; the browser blends between them, so more only adds weight. */
const CROUCH_STEPS = 6
const FLY_STEPS = 40
const SLIP_STEPS = 10
/** Sparkles that follow the traveller along the same curve, each a little later than the one before. */
const SPARKS = 8
const SPARK_LAG = 38

const calm = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const smooth = (t: number) => t * t * (3 - 2 * t)
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const move = (x: number, y: number, rot: number, scale: number) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${Math.max(scale, 0.001).toFixed(3)})`

/** A quick swell of the badge, keeping its own centring transform. */
function pulse(badge: HTMLElement, to: number, ms: number) {
  const at = (k: number) => `translate(-50%, -50%) scale(${k})`
  badge.animate([{ transform: at(1) }, { transform: at(to), offset: 0.4 }, { transform: at(1) }], { duration: ms, easing: 'ease-out' })
}

/**
 * The traveller waiting in the bottom-left corner of the map. Tapping a badge makes them crouch, take off, fly over
 * the map in a curve (smaller and smaller, as if heading into the distance) and slip into the badge.
 *
 * The whole flight is handed to the browser as Web Animations on `transform` and `opacity` only, so it runs on the
 * graphics card and a busy main thread (a phone drawing a huge map) cannot make it stutter; nothing is worked out
 * frame by frame. Where the corner and the badge are on screen is read once at take-off, and the badge once more
 * when the traveller gets there (the map camera may have moved), which the last part, the slip, absorbs.
 * All the pictures share one canvas centred on the backpack (data/journey.ts FLIGHT_POSES), so changing pose never
 * makes the traveller jump.
 */
export const Flyer = forwardRef<FlyerHandle, Props>(function Flyer({ friend, active, onFlight }, ref) {
  const layerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const flying = useRef(false)
  const timers = useRef<number[]>([])
  const anims = useRef<Animation[]>([])
  /** Ends a flight that was cut short (the map was shown again), so whoever waits for it is not left waiting. */
  const abort = useRef<(() => void) | null>(null)

  const play = (target: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
    const a = target.animate(frames, { fill: 'forwards', ...options })
    anims.current.push(a)
    return a
  }
  const stopAnimations = () => {
    const list = anims.current
    anims.current = []
    list.forEach((a) => a.cancel())
  }

  /** Back in the corner, standing; a small hop in when the map shows again. */
  const settle = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    stopAnimations()
    abort.current?.()
    abort.current = null
    if (flying.current) onFlight?.(false)
    flying.current = false
    const el = bodyRef.current
    if (!el) return
    el.classList.remove('go', 'arrive')
    el.style.opacity = ''
    el.style.transition = ''
    el.dataset.pose = 'rest'
    void el.offsetWidth
    el.classList.add('arrive')
  }
  // Decode every pose ahead of time: a picture first shown in mid-flight would otherwise stall that frame.
  useEffect(() => {
    bodyRef.current?.querySelectorAll('img').forEach((img) => void img.decode().catch(() => undefined))
  }, [friend])
  useEffect(() => {
    if (active) settle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, friend])
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      stopAnimations()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useImperativeHandle(ref, () => ({
    fly: (badge) =>
      new Promise<void>((resolve) => {
        const el = bodyRef.current
        const layer = layerRef.current
        if (!el || !layer || flying.current) return resolve()
        flying.current = true
        el.classList.remove('arrive')
        el.classList.add('go')
        pulse(badge, 1.2, 180)
        const centre = () => {
          const r = badge.getBoundingClientRect()
          return [r.left + r.width / 2, r.top + r.height / 2]
        }
        const finish = () => {
          pulse(badge, 1.14, 280)
          timers.current.push(window.setTimeout(resolve, 200))
        }

        if (calm()) {
          // No travelling: the badge answers and the traveller simply goes in.
          el.style.transition = 'opacity .2s'
          el.style.opacity = '0'
          timers.current.push(window.setTimeout(finish, 220))
          return
        }

        // Where the corner, the badge and the layer are on screen, read once: reading them forces a layout of the page.
        const L = layer.getBoundingClientRect()
        const S = [L.left + el.offsetLeft + el.offsetWidth / 2, L.top + el.offsetTop + el.offsetHeight / 2]
        const E = centre()
        const dx = E[0] - S[0]
        const dy = E[1] - S[1]
        const FLY = flightMs(Math.hypot(dx, dy))
        const first = CROUCH + FLY
        onFlight?.(true)

        // The curve bows up and away from the straight line, like a bird gaining height first.
        let nx = dy * 0.28
        let ny = -dx * 0.28
        if (ny > 0) {
          nx = -nx
          ny = -ny
        }
        const C = [S[0] + dx / 2 + nx, S[1] + dy / 2 + ny]

        // Where the traveller is (relative to the corner), how big and how tilted, at evenly spaced instants: first the
        // crouch (it ends where the flight begins), then each point of the curve.
        const frames: Keyframe[] = []
        for (let i = 0; i < CROUCH_STEPS; i++) {
          // Sink a little, spring back.
          const sink = Math.sin(Math.PI * (i / CROUCH_STEPS))
          frames.push({ offset: (CROUCH * (i / CROUCH_STEPS)) / first, transform: move(0, sink * 5, 0, 1 - sink * 0.05) })
        }
        const track: [number, number][] = []
        for (let i = 0; i <= FLY_STEPS; i++) {
          const u = i / FLY_STEPS
          const k = inOut(u)
          const m = 1 - k
          const x = m * m * S[0] + 2 * m * k * C[0] + k * k * E[0] - S[0]
          const y = m * m * S[1] + 2 * m * k * C[1] + k * k * E[1] - S[1]
          const tx = 2 * m * (C[0] - S[0]) + 2 * k * (E[0] - C[0])
          const ty = 2 * m * (C[1] - S[1]) + 2 * k * (E[1] - C[1])
          const banking = u > 0.38 && u < 0.62 && dx > 0
          const rot = banking ? 0 : clamp((Math.atan2(tx, -ty) * 180) / Math.PI, -50, 50) * 0.4
          const scale = 1 - (1 - FAR) * smooth(u)
          frames.push({ offset: (CROUCH + FLY * u) / first, transform: move(x, y, rot, scale) })
          track.push([S[0] - L.left + x, S[1] - L.top + y])
        }

        // Which picture shows when: crouch, then wings up, down, up..., banking through the middle of the turn.
        const poseAt = (t: number): FlightPose => {
          if (t < CROUCH) return 'crouch'
          const air = t - CROUCH
          const u = air / FLY
          if (u > 0.38 && u < 0.62 && dx > 0) return 'bank'
          if (air < 140) return 'up'
          return (['mid', 'down', 'mid', 'up'] as const)[Math.floor(air / WING_MS) % 4]
        }
        const cuts = new Set([0, CROUCH, CROUCH + 140, CROUCH + FLY * 0.38, CROUCH + FLY * 0.62, first])
        for (let t = CROUCH + WING_MS; t < first; t += WING_MS) cuts.add(t)
        const marks = [...cuts].filter((t) => t >= 0 && t <= first).sort((a, b) => a - b)
        const shown = marks.slice(0, -1).map((t, i) => ({ t, pose: poseAt((t + marks[i + 1]) / 2) }))
        const imgs = [...el.querySelectorAll<HTMLImageElement>('img')]
        for (const img of imgs) {
          const steps: Keyframe[] = shown.map((s) => ({ offset: s.t / first, opacity: img.className === `f-${s.pose}` ? 1 : 0, easing: 'step-end' }))
          steps.push({ offset: 1, opacity: img.className === `f-${shown[shown.length - 1].pose}` ? 1 : 0 })
          play(img, steps, { duration: first })
        }

        // Sparkles along the same curve, each one a little behind the one before and a little smaller.
        layer.querySelectorAll<HTMLElement>('.j-spark').forEach((dot, i) => {
          const size = 1 - i / (SPARKS + 2)
          const trail = track.map(([x, y], j) => ({
            transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(size * (1 - (j / FLY_STEPS) * 0.5)).toFixed(2)})`,
            opacity: j === 0 || j === FLY_STEPS ? 0 : 0.85 * size,
          }))
          play(dot, trail, { duration: FLY, delay: CROUCH + i * SPARK_LAG })
        })

        let over = false
        const end = () => {
          if (over) return
          over = true
          abort.current = null
          resolve()
        }
        abort.current = end

        // Into the badge: the badge swells, the traveller shrinks fast onto its centre and is gone.
        const slip = () => {
          if (over) return
          const F = centre()
          const fx = F[0] - S[0]
          const fy = F[1] - S[1]
          const goIn: Keyframe[] = []
          for (let i = 0; i <= SLIP_STEPS; i++) {
            const v = i / SLIP_STEPS
            goIn.push({ transform: move(dx + (fx - dx) * v, dy + (fy - dy) * v, 0, FAR * (1 - v ** 2.2)), opacity: clamp(1 - (v - 0.7) / 0.3, 0, 1) })
          }
          const last = play(el, goIn, { duration: SLIP })
          for (const img of imgs) play(img, [{ opacity: img.className === 'f-tuck' ? 1 : 0 }, { opacity: img.className === 'f-tuck' ? 1 : 0 }], { duration: SLIP })
          const burst = layer.querySelector<HTMLElement>('.j-burst')
          if (burst) {
            const bx = F[0] - L.left
            const by = F[1] - L.top
            play(
              burst,
              [
                { transform: `translate(${bx}px, ${by}px) scale(.7)`, opacity: 0.9 },
                { transform: `translate(${bx}px, ${by}px) scale(2.1)`, opacity: 0 },
              ],
              { duration: 520, easing: 'ease-out' },
            )
          }
          last.onfinish = () => {
            if (over) return
            flying.current = false
            onFlight?.(false)
            finish()
            end()
          }
        }

        const main = play(el, frames, { duration: first })
        main.onfinish = slip
      }),
  }))

  return (
    <div className="j-flight" ref={layerRef} aria-hidden="true">
      {Array.from({ length: SPARKS }, (_, i) => (
        <i key={i} className="j-spark" />
      ))}
      <i className="j-burst" />
      <div className="j-flyer" ref={bodyRef} data-pose="rest" data-friend={friend}>
        <div className="j-flyer-bob">
          {FLIGHT_POSES.map((p) => (
            <img key={`${friend}-${p}`} className={`f-${p}`} src={asset(`flight/${friend}-${p}.webp`)} alt="" draggable={false} />
          ))}
        </div>
      </div>
    </div>
  )
})
