import { useEffect, useRef } from 'react'
import type { FriendId } from '../data/friends'
import { CHIMNEY, crewFor, loop, puff } from './art'
import { Strip, Train } from './parts'
import './journey.css'

type Props = { place: string; traveler: FriendId; onDone: () => void }

/** Train width on screen, and where its wheels meet the rails (fraction of the screen height). */
const W = 540
const RAIL = 0.69

/**
 * Boarding a lesson: the train races past with the traveller driving and the friends at the
 * windows, while the landscape and the track rush the other way. Tap to skip.
 */
export function TrainRide({ place, traveler, onDone }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const farRef = useRef<HTMLDivElement>(null)
  const nearRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)
  const smokeRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    onDone()
  }

  useEffect(() => {
    const anims = [loop(farRef.current!, 4), loop(nearRef.current!, 1.5), loop(trackRef.current!, 0.26)]
    const root = rootRef.current!
    const train = trainRef.current!
    const h = (W * 941) / 1672
    let alive = true
    const t0 = performance.now()
    let lastPuff = 0
    let lastLine = 0
    const step = (now: number) => {
      if (!alive) return
      const vw = root.clientWidth
      const top = root.clientHeight * RAIL - h * (745 / 941)
      // Keep the driver's cab in the middle of the screen while everyone waves.
      const center = vw / 2 - (982 / 1672) * W
      const t = now - t0
      const x =
        t < 750
          ? -W - 100 + (center + W + 100) * (1 - Math.pow(1 - t / 750, 3))
          : t < 1850
            ? center
            : center + (vw + 100 - center) * Math.pow((t - 1850) / 850, 2.2)
      train.style.left = `${x}px`
      train.style.top = `${top}px`
      if (now - lastPuff > 90) {
        puff(smokeRef.current!, `${x + (CHIMNEY[0] / 1672) * W}px`, `${top + (CHIMNEY[1] / 941) * h}px`, -1, '74px')
        lastPuff = now
      }
      if (now - lastLine > 120) {
        speedLine(linesRef.current!, vw, root.clientHeight * 0.45)
        lastLine = now
      }
      if (t < 2700) requestAnimationFrame(step)
      else finish()
    }
    requestAnimationFrame(step)
    return () => {
      alive = false
      anims.forEach((a) => a.cancel())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="j-overlay j-ride" ref={rootRef} onClick={finish} role="presentation">
      <div className="j-ride-sky">
        <Strip ref={farRef} src="ride-landscape.webp" className="far" />
      </div>
      <div className="j-ride-mid">
        <Strip ref={nearRef} src="ride-foreground.webp" className="near" />
      </div>
      <div className="j-ground" />
      <div className="j-track">
        <i ref={trackRef} />
      </div>
      <div className="j-speed" ref={linesRef} />
      <Train ref={trainRef} className="moving fast" crew={crewFor(traveler)} style={{ width: W, left: -W - 100 }} />
      <div ref={smokeRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div className="j-ride-cap">
        <span className="j-han">上车！</span>
        <b>Next stop: {place}</b>
        <small>Tap to skip</small>
      </div>
    </div>
  )
}

function speedLine(layer: HTMLElement, vw: number, maxY: number) {
  const l = document.createElement('i')
  Object.assign(l.style, { top: `${60 + Math.random() * maxY}px`, left: `${vw}px`, width: `${40 + Math.random() * 60}px` })
  layer.appendChild(l)
  l.animate([{ transform: 'translateX(0)', opacity: 0.9 }, { transform: `translateX(-${vw + 140}px)`, opacity: 0 }], {
    duration: 420,
  }).onfinish = () => l.remove()
}
