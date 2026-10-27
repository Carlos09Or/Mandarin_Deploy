import { useEffect, useRef } from 'react'
import { loop } from './art'
import { Strip } from './parts'
import './journey.css'

type Props = { progress: number; station?: string; arrived?: boolean }

/** Seconds per loop, as if at full speed: the near layer passes faster, which reads as depth. */
const FAR = 9
const NEAR = 1.5

/**
 * The lesson's progress bar is a train window: each right answer moves the landscape on,
 * and the station sign slides in when the lesson ends.
 */
export function LandscapeStrip({ progress, station, arrived }: Props) {
  const farRef = useRef<HTMLDivElement>(null)
  const nearRef = useRef<HTMLDivElement>(null)
  const anims = useRef<Animation[]>([])
  const shown = useRef(0)

  useEffect(() => {
    anims.current = [loop(farRef.current!, FAR), loop(nearRef.current!, NEAR)]
    anims.current.forEach((a) => a.pause())
    return () => anims.current.forEach((a) => a.cancel())
  }, [])

  useEffect(() => {
    const [far, near] = anims.current
    if (!far) return
    const from = shown.current
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 900)
      const v = from + (progress - from) * (1 - Math.pow(1 - k, 3))
      shown.current = v
      far.currentTime = v * FAR * 1000 * 0.35
      near.currentTime = v * NEAR * 1000 * 2.2
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="j-window" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
      <Strip ref={farRef} src="ride-landscape.webp" className="far" />
      <Strip ref={nearRef} src="ride-foreground.webp" className="near" />
      <div className="j-glass" />
      {station && <div className={`j-sign ${arrived ? 'on' : ''}`}>{station}</div>}
    </div>
  )
}
