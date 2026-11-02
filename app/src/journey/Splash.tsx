import { useEffect, useRef, useState } from 'react'
import { asset } from '../data/journey'
import { getProgress, isNight } from '../lib/progress'
import { preloadJourney } from './preload'
import { whenFirstView } from './sharp'
import './journey.css'

/** Never block the app for longer than this, even on a very slow connection. */
const MAX_WAIT = 25000
/** The bar always takes at least this long to fill, so the screen never just flashes by; less once the learner has been here before. */
const MIN_SHOW = 3500
const MIN_SHOW_AGAIN = 800
/** Once the map's first view is up, the screen waits this long at most for the sharp pieces on screen, so the map opens sharp. */
const SHARP_WAIT = 3500
/** The bar waits this long at most for the painting, so a picture that never arrives cannot keep the app shut. */
const ART_WAIT = 2500
const SEEN = 'mj.opened'
const hasOpened = () => {
  try {
    return localStorage.getItem(SEEN) === '1'
  } catch {
    return false
  }
}

/**
 * The loading screen: a still painting of the four friends watching the train cross the bay, at
 * sunrise by day and under the moon at night, with a bar that fills while the journey's pictures
 * load. Then the app opens with everything ready.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [night] = useState(() => isNight(getProgress()))
  const [shown, setShown] = useState(0)
  const [painted, setPainted] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const loaded = useRef(0)
  const art = asset(night ? 'splash-night.webp' : 'splash-day.webp')
  const blur = (window as Window & { __boot?: { blur?: string } }).__boot?.blur
  const pct = Math.round(shown * 100)

  useEffect(() => {
    // The plain copy from index.html did its job: this screen is now on top of it.
    document.getElementById('boot')?.remove()
    let alive = true
    let t0 = 0
    const minShow = hasOpened() ? MIN_SHOW_AGAIN : MIN_SHOW
    let give = 0
    // The painting comes first: the bar appears, its clock starts and the map starts loading only once the painting is
    // on screen, so on a slow line the map's pictures never take the connection from it. It was asked for in index.html.
    const painting = new Image()
    painting.src = art
    const shownArt = painting.decode().catch(() => undefined)
    void Promise.race([shownArt, new Promise((r) => setTimeout(r, ART_WAIT))]).then(() => {
      if (!alive) return
      setPainted(true)
      t0 = performance.now()
      give = window.setTimeout(() => (loaded.current = 1), MAX_WAIT)
      // The first views of the map load behind this screen; the bar stops short of full until the sharp pieces on screen are in too.
      preloadJourney((s) => (loaded.current = Math.min(s, 0.9)))
        .then(() => whenFirstView(SHARP_WAIT))
        .then(() => (loaded.current = 1))
      requestAnimationFrame(step)
    })
    // The bar shows whichever is behind: what has loaded, or the minimum time.
    const step = (now: number) => {
      if (!alive) return
      const share = Math.min(loaded.current, (now - t0) / minShow)
      setShown(share)
      if (share < 1) return void requestAnimationFrame(step)
      setLeaving(true)
      try {
        localStorage.setItem(SEEN, '1')
      } catch {
        /* private window: the long splash simply shows again next time */
      }
      setTimeout(() => alive && onDone(), 500)
    }
    return () => {
      alive = false
      clearTimeout(give)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`j-splash ${night ? 'night' : ''} ${leaving ? 'leaving' : ''}`} role="status" aria-label="Loading">
      {/* A blurred copy fills any screen shape the painting does not reach. Until the painting arrives, the tiny copy
          inlined in index.html stands in for it. */}
      <div className="j-splash-fill" style={{ backgroundImage: [`url(${art})`, blur && `url(${blur})`].filter(Boolean).join(', ') }} />
      <img
        className="j-splash-art"
        src={art}
        alt=""
        fetchPriority="high"
        decoding="async"
        style={blur ? { backgroundImage: `url(${blur})` } : undefined}
      />
      <div className={`j-splash-top ${painted ? 'on' : ''}`}>
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
