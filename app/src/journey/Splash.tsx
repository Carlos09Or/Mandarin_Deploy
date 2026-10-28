import { useEffect, useRef, useState } from 'react'
import { asset } from '../data/journey'
import { preloadJourney } from './preload'
import './journey.css'

/** Never block the app for longer than this, even on a very slow connection. */
const MAX_WAIT = 25000
/** The train always takes at least this long to cross, so the screen never just flashes by. */
const MIN_SHOW = 3200
/** Where the painted rails run in ride-bg-papercut.webp (fraction of its height). */
const RAIL = 473 / 667

/**
 * The loading screen: the felt train crosses the painted track at a steady pace while the
 * journey's pictures load, then leaves the station and the app opens with everything ready.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const loaded = useRef(0)

  useEffect(() => {
    let alive = true
    const t0 = performance.now()
    const give = setTimeout(() => (loaded.current = 1), MAX_WAIT)
    preloadJourney((s) => (loaded.current = s)).then(() => (loaded.current = 1))
    // The train shows whichever is behind: what has loaded, or the minimum time.
    const step = (now: number) => {
      if (!alive) return
      const share = Math.min(loaded.current, (now - t0) / MIN_SHOW)
      setShown(share)
      if (share < 1) return void requestAnimationFrame(step)
      setLeaving(true)
      setTimeout(() => alive && onDone(), 1000)
    }
    requestAnimationFrame(step)
    return () => {
      alive = false
      clearTimeout(give)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`j-splash ${leaving ? 'leaving' : ''}`} role="status" aria-label="Loading">
      <div className="j-splash-sky" style={{ backgroundImage: `url(${asset('ride-bg-papercut.webp')})` }} />
      <div className="j-splash-logo">
        <span className="j-han">汉</span>
        <b>Mandarin Journey</b>
        <small>
          Panama → <span className="j-han">中国</span>
        </small>
      </div>
      <div className="j-splash-track" style={{ top: `${RAIL * 100}%` }}>
        <img
          className="j-splash-train"
          src={asset('train-felt.webp')}
          alt=""
          style={{ left: leaving ? '115%' : `calc(${shown} * (100% - min(62%, 420px) * 0.88) - min(62%, 420px) * 0.12)` }}
        />
      </div>
      <p className="j-splash-text">
        {leaving ? (
          <>
            <span className="j-han">上车！</span> All aboard!
          </>
        ) : (
          <>Loading the journey… {Math.round(shown * 100)}%</>
        )}
      </p>
    </div>
  )
}
