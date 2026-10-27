import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FriendId } from '../data/friends'
import { pickRideScene } from '../data/journey'
import { CHIMNEY, crewFor, loop, puff } from './art'
import { Strip, Train } from './parts'
import './journey.css'

type Props = { place: string; traveler: FriendId; night: boolean; onDone: () => void }

/**
 * The scene is laid out on a phone-sized stage (812 tall) and scaled as one piece to the screen's
 * height, so the painting, rails and train keep their proportions on any screen; wider screens
 * just see more of the repeating painting.
 */
const STAGE_H = 812
const W = 540
/** Train height on the stage, and how far below its top the wheels touch the rail. */
const H = (W * 941) / 1672
const WHEEL_BOTTOM = H * (745 / 941)

/**
 * Boarding a lesson: the train races past with the traveller driving and the friends at the
 * windows, while the painting (with its own rails) rushes the other way. Tap to skip.
 */
export function TrainRide({ place, traveler, night, onDone }: Props) {
  const [scene] = useState(() => pickRideScene(night))
  const bgRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)
  const smokeRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const rainRef = useRef<HTMLCanvasElement>(null)
  const [fit, setFit] = useState({ scale: 1, width: 375 })
  const done = useRef(false)
  const top = scene.rail * STAGE_H - WHEEL_BOTTOM

  const finish = () => {
    if (done.current) return
    done.current = true
    onDone()
  }

  useLayoutEffect(() => {
    const measure = () => {
      const scale = window.innerHeight / STAGE_H
      setFit({ scale, width: window.innerWidth / scale })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    const bg = loop(bgRef.current!, 5)
    const train = trainRef.current!
    const stopRain = scene.rain ? rain(rainRef.current!) : () => {}
    let alive = true
    const t0 = performance.now()
    let lastPuff = 0
    let lastLine = 0
    const step = (now: number) => {
      if (!alive) return
      const vw = window.innerWidth / (window.innerHeight / STAGE_H)
      // Keep the driver's cab in the middle of the stage while everyone waves.
      const center = vw / 2 - (982 / 1672) * W
      const t = now - t0
      const x =
        t < 750
          ? -W - 100 + (center + W + 100) * (1 - Math.pow(1 - t / 750, 3))
          : t < 1850
            ? center
            : center + (vw + 100 - center) * Math.pow((t - 1850) / 850, 2.2)
      train.style.left = `${x}px`
      if (now - lastPuff > 90) {
        puff(smokeRef.current!, `${x + (CHIMNEY[0] / 1672) * W}px`, `${top + (CHIMNEY[1] / 941) * H}px`, -1, '74px')
        lastPuff = now
      }
      if (!scene.rain && now - lastLine > 120) {
        speedLine(linesRef.current!, vw)
        lastLine = now
      }
      if (t < 2700) requestAnimationFrame(step)
      else finish()
    }
    requestAnimationFrame(step)
    return () => {
      alive = false
      bg.cancel()
      stopRain()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="j-overlay j-ride" onClick={finish} role="presentation">
      <div className="j-ride-stage" style={{ width: fit.width, transform: `scale(${fit.scale})` }}>
        <Strip ref={bgRef} src={scene.file} className="j-ride-bg" />
        <div className="j-speed" ref={linesRef} />
        <Train ref={trainRef} className="moving fast" crew={crewFor(traveler)} style={{ width: W, top, left: -W - 100 }} />
        <div ref={smokeRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        {scene.rain && <canvas ref={rainRef} className="j-rain" />}
        <div className="j-ride-cap">
          <span className="j-han">上车！</span>
          <b>Next stop: {place}</b>
          <small>Tap to skip</small>
        </div>
      </div>
    </div>
  )
}

function speedLine(layer: HTMLElement, vw: number) {
  const l = document.createElement('i')
  Object.assign(l.style, { top: `${60 + Math.random() * 300}px`, left: `${vw}px`, width: `${40 + Math.random() * 60}px` })
  layer.appendChild(l)
  l.animate([{ transform: 'translateX(0)', opacity: 0.9 }, { transform: `translateX(-${vw + 140}px)`, opacity: 0 }], {
    duration: 420,
  }).onfinish = () => l.remove()
}

/** Rain streaks, slanted by the train's speed, drawn on a canvas over the scene. */
function rain(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const resize = () => {
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
  }
  resize()
  const drops = Array.from({ length: 170 }, () => ({
    x: Math.random(),
    y: Math.random(),
    len: 14 + Math.random() * 16,
    speed: 0.9 + Math.random() * 0.6,
    alpha: 0.25 + Math.random() * 0.4,
  }))
  let alive = true
  let last = performance.now()
  const frame = (now: number) => {
    if (!alive) return
    const dt = Math.min(50, now - last) / 1000
    last = now
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.lineCap = 'round'
    for (const d of drops) {
      d.y += d.speed * dt * 1.6
      d.x -= d.speed * dt * 0.55
      if (d.y > 1.05) {
        d.y = -0.05
        d.x = Math.random() * 1.3
      }
      if (d.x < -0.1) d.x += 1.2
      const len = d.len * dpr
      ctx.strokeStyle = `rgba(225, 238, 255, ${d.alpha})`
      ctx.lineWidth = 1.6 * dpr
      ctx.beginPath()
      ctx.moveTo(d.x * w, d.y * h)
      ctx.lineTo(d.x * w + len * 0.34, d.y * h - len)
      ctx.stroke()
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  window.addEventListener('resize', resize)
  return () => {
    alive = false
    window.removeEventListener('resize', resize)
  }
}
