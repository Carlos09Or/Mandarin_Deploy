import { useEffect, useRef, useState } from 'react'
import { asset } from '../data/journey'
import { getProgress, isNight } from '../lib/progress'
import { preloadJourney } from './preload'
import './journey.css'

/** Never block the app for longer than this, even on a very slow connection. */
const MAX_WAIT = 25000
/** The bar always takes at least this long to fill, so the screen never just flashes by. */
const MIN_SHOW = 1600

/**
 * The loading screen: a still painting of the four friends watching the train cross the bay, at
 * sunrise by day and under the moon at night, with a bar that fills while the journey's pictures
 * load. Then the app opens with everything ready.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [night] = useState(() => isNight(getProgress()))
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const loaded = useRef(0)
  const art = asset(night ? 'splash-night.webp' : 'splash-day.webp')
  const pct = Math.round(shown * 100)

  useEffect(() => {
    // The plain copy from index.html did its job: this screen is now on top of it.
    document.getElementById('boot')?.remove()
    let alive = true
    const t0 = performance.now()
    const give = setTimeout(() => (loaded.current = 1), MAX_WAIT)
    preloadJourney((s) => (loaded.current = s)).then(() => (loaded.current = 1))
    // The bar shows whichever is behind: what has loaded, or the minimum time.
    const step = (now: number) => {
      if (!alive) return
      const share = Math.min(loaded.current, (now - t0) / MIN_SHOW)
      setShown(share)
      if (share < 1) return void requestAnimationFrame(step)
      setLeaving(true)
      setTimeout(() => alive && onDone(), 500)
    }
    requestAnimationFrame(step)
    return () => {
      alive = false
      clearTimeout(give)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`j-splash ${night ? 'night' : ''} ${leaving ? 'leaving' : ''}`} role="status" aria-label="Loading">
      {/* A blurred copy fills any screen shape the painting does not reach. */}
      <div className="j-splash-fill" style={{ backgroundImage: `url(${art})` }} />
      <img className="j-splash-art" src={art} alt="" fetchPriority="high" decoding="async" />
      <div className="j-splash-top">
        <div className="j-splash-logo">
          <img src={`${import.meta.env.BASE_URL}brand/wordmark.webp`} alt="Mandarin Journey · Panama to China" />
        </div>
        <div className="j-splash-load">
          <div className="j-splash-row">
            <span className="j-splash-label">
              <b className="j-han">{leaving ? '上车！' : '加载中'}</b>
              <small>{leaving ? 'shàng chē · All aboard!' : 'jiāzài zhōng · Loading'}</small>
            </span>
            <span className="j-splash-pct">{pct}%</span>
          </div>
          <div className="j-splash-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
