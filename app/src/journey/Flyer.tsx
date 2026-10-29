import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { FriendId } from '../data/friends'
import { FLIGHT_POSES, asset, type FlightPose } from '../data/journey'
import './journey.css'

export type FlyerHandle = {
  /** Flies the traveller from the corner of the map into `badge`; resolves once the badge has taken them in. */
  fly: (badge: HTMLElement) => Promise<void>
}
type Props = { friend: FriendId; active: boolean }

/** The crouch before take-off, the flight itself (as long as the distance asks) and the slip into the badge. */
const CROUCH = 230
const SLIP = 380
const flightMs = (dist: number) => Math.min(1450, Math.max(1000, 900 + dist * 0.8))
const WING_MS = 105
/** Size of the traveller when it reaches the badge, relative to the corner. */
const FAR = 0.42
const TRAIL = 12

const calm = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const smooth = (t: number) => t * t * (3 - 2 * t)
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** A quick swell of the badge, keeping its own centring transform. */
function pulse(badge: HTMLElement, to: number, ms: number) {
  const at = (k: number) => `translate(-50%, -50%) scale(${k})`
  badge.animate([{ transform: at(1) }, { transform: at(to), offset: 0.4 }, { transform: at(1) }], { duration: ms, easing: 'ease-out' })
}

/** A small ring that spreads from the badge, over the flight layer. */
function ring(layer: HTMLElement, x: number, y: number) {
  const r = document.createElement('div')
  r.className = 'j-ring'
  r.style.left = `${x}px`
  r.style.top = `${y}px`
  layer.appendChild(r)
  r.animate(
    [
      { transform: 'translate(-50%, -50%) scale(.7)', opacity: 0.9 },
      { transform: 'translate(-50%, -50%) scale(2.1)', opacity: 0 },
    ],
    { duration: 520, easing: 'ease-out' },
  ).onfinish = () => r.remove()
}

/**
 * The traveller waiting in the bottom-left corner of the map. Tapping a badge makes them crouch, take off, fly over
 * the map in a curve (smaller and smaller, as if heading into the distance) and slip into the badge. The path is
 * worked out every frame from where the corner and the badge really are on screen, so it still lands when the
 * window is resized or the map camera moves. All the pictures share one canvas centred on the backpack
 * (data/journey.ts FLIGHT_POSES), so changing pose never makes the traveller jump.
 */
export const Flyer = forwardRef<FlyerHandle, Props>(function Flyer({ friend, active }, ref) {
  const layerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<SVGSVGElement>(null)
  const raf = useRef(0)
  const flying = useRef(false)
  const timers = useRef<number[]>([])

  const pose = (p: FlightPose) => {
    const el = bodyRef.current
    if (el && el.dataset.pose !== p) el.dataset.pose = p
  }
  const drawTrail = (pts: [number, number][], fade: number) => {
    const lines = trailRef.current?.children
    if (!lines) return
    for (let i = 0; i < lines.length; i++) {
      const a = pts[pts.length - 1 - (i + 1)]
      const b = pts[pts.length - 1 - i]
      const l = lines[i] as SVGLineElement
      if (!a || !b) {
        l.setAttribute('stroke-opacity', '0')
        continue
      }
      const k = 1 - i / lines.length
      l.setAttribute('x1', a[0].toFixed(1))
      l.setAttribute('y1', a[1].toFixed(1))
      l.setAttribute('x2', b[0].toFixed(1))
      l.setAttribute('y2', b[1].toFixed(1))
      l.setAttribute('stroke-width', (1 + k * 3.2).toFixed(1))
      l.setAttribute('stroke-opacity', (k * 0.5 * fade).toFixed(2))
    }
  }

  /** Back in the corner, standing; a small hop in when the map shows again. */
  const settle = () => {
    cancelAnimationFrame(raf.current)
    timers.current.forEach(clearTimeout)
    timers.current = []
    flying.current = false
    const el = bodyRef.current
    if (!el) return
    el.classList.remove('go', 'arrive')
    el.style.transform = ''
    el.style.opacity = ''
    pose('rest')
    drawTrail([], 0)
    void el.offsetWidth
    el.classList.add('arrive')
  }
  useEffect(() => {
    if (active) settle()
    else cancelAnimationFrame(raf.current)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, friend])

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

        const home = () => {
          const l = layer.getBoundingClientRect()
          return [l.left + el.offsetLeft + el.offsetWidth / 2, l.top + el.offsetTop + el.offsetHeight / 2]
        }
        const [s0, e0] = [home(), centre()]
        const FLY = flightMs(Math.hypot(e0[0] - s0[0], e0[1] - s0[1]))
        const total = CROUCH + FLY + SLIP
        const pts: [number, number][] = []
        const t0 = performance.now()
        let ringed = false

        const step = (now: number) => {
          const t = now - t0
          const S = home()
          const E = centre()
          const L = layer.getBoundingClientRect()
          const dx = E[0] - S[0]
          const dy = E[1] - S[1]
          // The curve bows up and away from the straight line, like a bird gaining height first.
          let nx = dy * 0.28
          let ny = -dx * 0.28
          if (ny > 0) {
            nx = -nx
            ny = -ny
          }
          const C = [S[0] + dx / 2 + nx, S[1] + dy / 2 + ny]
          let x = 0
          let y = 0
          let scale = 1
          let rot = 0
          let fade = 1

          if (t < CROUCH) {
            // Crouch: sink a little, spring back.
            const u = t / CROUCH
            const sink = Math.sin(Math.PI * u)
            y = sink * 5
            scale = 1 - sink * 0.05
            pose('crouch')
          } else if (t < CROUCH + FLY) {
            const u = (t - CROUCH) / FLY
            const k = inOut(u)
            const m = 1 - k
            x = m * m * S[0] + 2 * m * k * C[0] + k * k * E[0] - S[0]
            y = m * m * S[1] + 2 * m * k * C[1] + k * k * E[1] - S[1]
            scale = 1 - (1 - FAR) * smooth(u)
            const tx = 2 * m * (C[0] - S[0]) + 2 * k * (E[0] - C[0])
            const ty = 2 * m * (C[1] - S[1]) + 2 * k * (E[1] - C[1])
            rot = clamp((Math.atan2(tx, -ty) * 180) / Math.PI, -50, 50) * 0.4
            const air = t - CROUCH
            if (u > 0.38 && u < 0.62 && dx > 0) {
              pose('bank')
              rot = 0
            } else pose(air < 140 ? 'up' : (['mid', 'down', 'mid', 'up'] as const)[Math.floor(air / WING_MS) % 4])
          } else {
            // Into the badge: the badge swells, the traveller shrinks fast onto its centre and is gone.
            const v = clamp((t - CROUCH - FLY) / SLIP, 0, 1)
            x = dx
            y = dy
            scale = FAR * (1 - v ** 2.2)
            fade = 1 - v
            pose('tuck')
            if (!ringed) {
              ringed = true
              ring(layer, E[0] - L.left, E[1] - L.top)
            }
            el.style.opacity = String(clamp(1 - (v - 0.7) / 0.3, 0, 1))
          }

          el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${Math.max(scale, 0.001).toFixed(3)})`
          if (t >= CROUCH && t < CROUCH + FLY) pts.push([S[0] + x - L.left, S[1] + y - L.top])
          else if (t >= CROUCH + FLY) pts.shift()
          if (pts.length > TRAIL + 1) pts.shift()
          drawTrail(pts, fade)

          if (t < total) raf.current = requestAnimationFrame(step)
          else {
            el.style.opacity = '0'
            drawTrail([], 0)
            flying.current = false
            finish()
          }
        }
        raf.current = requestAnimationFrame(step)
      }),
  }))

  return (
    <div className="j-flight" ref={layerRef} aria-hidden="true">
      <svg className="j-trail" ref={trailRef}>
        {Array.from({ length: TRAIL }, (_, i) => (
          <line key={i} stroke="#fff6d8" strokeLinecap="round" strokeOpacity="0" />
        ))}
      </svg>
      <div className="j-flyer" ref={bodyRef} data-pose="rest">
        <div className="j-flyer-bob">
          {FLIGHT_POSES.map((p) => (
            <img key={`${friend}-${p}`} className={`f-${p}`} src={asset(`flight/${friend}-${p}.webp`)} alt="" draggable={false} />
          ))}
        </div>
      </div>
    </div>
  )
})
