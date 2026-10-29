import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FRIENDS, FRIEND_IDS } from '../data/friends'
import {
  BADGE_AT, BOAT_SIZE, SEA_BOATS, CLOUDS, EXTRA_HOLE, ORIGIN, REGIONS, VB, asset, hasContent, provinceById, type Province, type SeaBoat,
} from '../data/journey'
import { getProgress, isNight, markRevealed, setTraveler, useProgress } from '../lib/progress'
import { Face } from './parts'
import { currentProvince, isUnlocked, openProvinces, provinceDone } from './stops'
import { toast } from './toast'
import './journey.css'

/** Something the map should play when it opens: a hop from one province to the next. */
export type MapEvent = { hopFrom: string; hopTo: string }

/**
 * `active` is false while the map is hidden behind another tab, a route or the loading screen.
 * The map stays mounted all the time, so its artwork never loads twice; it only replays what
 * changed (newly unlocked provinces, a hop after a trip) when it becomes visible again.
 */
type Props = { active: boolean; onOpen: (p: Province) => void; event: MapEvent | null; onEventDone: () => void }

const pct = ([x, y]: readonly [number, number]) => ({ left: `${((x - VB.x) / VB.w) * 100}%`, top: `${((y - VB.y) / VB.h) * 100}%` })
const regionById = new Map(REGIONS.map((r) => [r.id, r]))
const badgeAt = (id: string) => BADGE_AT[id] ?? regionById.get(id)!.c
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function MapHome({ active, onOpen, event, onEventDone }: Props) {
  const progress = useProgress()
  const scrollRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<SVGPathElement>(null)
  // Provinces whose fog is gone on screen (revealed before, or just animated).
  const [shown, setShown] = useState(() => new Set(progress.revealed))
  const [pinAt, setPinAt] = useState(() => event?.hopFrom ?? currentProvince(progress).id)
  const [picking, setPicking] = useState(false)
  const busy = useRef(false)
  const activeRef = useRef(active)
  const shownRef = useRef(shown)
  useLayoutEffect(() => {
    activeRef.current = active
    shownRef.current = shown
  }, [active, shown])

  const placePin = ([x, y]: readonly [number, number]) => {
    if (pinRef.current) Object.assign(pinRef.current.style, pct([x, y - 9]))
  }
  // The camera: the map is zoomed in and follows the traveller; it can't be dragged around.
  // `zoom` below 1 pulls the camera back a little (used for the first approach).
  const centerOn = ([x, y]: readonly [number, number], smooth = true, zoom = 1, ms = 1200) => {
    const box = scrollRef.current
    const stage = stageRef.current
    if (!box || !stage) return
    const sw = stage.offsetWidth * zoom
    const sh = stage.offsetHeight * zoom
    const px = ((x - VB.x) / VB.w) * sw
    const py = ((y - VB.y) / VB.h) * sh
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
    const tx = clamp(box.clientWidth / 2 - px, box.clientWidth - sw, 0)
    const ty = clamp(box.clientHeight * 0.55 - py, box.clientHeight - sh, 0)
    stage.style.transition = smooth ? `transform ${ms}ms cubic-bezier(.4,0,.2,1)` : 'none'
    stage.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`
  }
  const pinAtRef = useRef(pinAt)
  pinAtRef.current = pinAt

  // Opening a province: the fog clears in a circle from its origin and its clouds fly away.
  const reveal = (id: string) =>
    new Promise<void>((resolve) => {
      const r = regionById.get(id)!
      const circle = svgRef.current!.querySelector<SVGCircleElement>(`#j-clip-${id} circle`)!
      const o = ORIGIN[id] ?? r.c
      const bb = svgRef.current!.querySelector<SVGGElement>(`#j-hole-${id}`)!.getBBox()
      const corners = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]
      const far = Math.max(...corners.map(([x, y]) => Math.hypot(x - o[0], y - o[1]))) + 10
      layerRef.current!.querySelectorAll<HTMLElement>(`[data-cloud="${id}"]`).forEach((c, i) => {
        const dx = Number(c.dataset.dx) || 1
        const dy = Number(c.dataset.dy) || 1
        const n = Math.hypot(dx, dy) || 1
        setTimeout(() => {
          c.style.transform = `translate(calc(-50% + ${(dx / n) * 260}px), calc(-50% + ${(dy / n) * 160 - 40}px)) scale(1.35)`
          c.style.opacity = '0'
        }, i * 90)
      })
      centerOn(o)
      setTimeout(() => {
        setShown((s) => new Set(s).add(id))
        const p = provinceById(id)
        toast(`${p.name} unlocked!<span class="j-han">${p.zh}</span>`)
      }, 900)
      const t0 = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, Math.max(0, (now - t0) / 1700))
        circle.setAttribute('r', (far * (1 - Math.pow(1 - k, 3))).toFixed(1))
        if (k < 1) requestAnimationFrame(step)
        else resolve()
      }
      requestAnimationFrame(step)
    })

  // The traveller hops from one badge to another along a gentle curve.
  const hop = (from: string, to: string) =>
    new Promise<void>((resolve) => {
      const a = badgeAt(from)
      const b = badgeAt(to)
      const mx = (a[0] + b[0]) / 2
      const my = Math.max(a[1], b[1]) + 16
      const rail = railRef.current!
      rail.setAttribute('d', `M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`)
      const len = rail.getTotalLength()
      const hops = Math.max(2, Math.round(len / 22))
      centerOn([mx, my])
      const t0 = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, Math.max(0, (now - t0) / (380 * hops)))
        const pt = rail.getPointAtLength(len * k)
        placePin([pt.x, pt.y - Math.abs(Math.sin(Math.PI * k * hops)) * 7])
        if (k < 1) requestAnimationFrame(step)
        else {
          setPinAt(to)
          resolve()
        }
      }
      requestAnimationFrame(step)
    })

  // Before anything shows (even behind the loading screen) the camera already looks at the
  // traveller, a little zoomed out; the first time the map shows it glides in from there.
  const approached = useRef(false)
  useLayoutEffect(() => {
    centerOn(badgeAt(pinAtRef.current), false, 0.82)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // First paint: open the fog that was already cleared.
  useEffect(() => {
    const svg = svgRef.current!
    for (const id of getProgress().revealed) {
      svg.querySelector(`#j-clip-${id} circle`)?.setAttribute('r', '2000')
      layerRef.current!.querySelectorAll<HTMLElement>(`[data-cloud="${id}"]`).forEach((c) => (c.style.opacity = '0'))
    }
  }, [])

  // Each time the map shows: centre on the traveller, then play anything new.
  useEffect(() => {
    if (!active) return
    const now = getProgress()
    const from = event?.hopFrom ?? pinAt
    placePin(badgeAt(from))
    if (!approached.current) {
      approached.current = true
      requestAnimationFrame(() => centerOn(badgeAt(from), true, 1, 1600))
    } else centerOn(badgeAt(from), false)
    const pending = openProvinces(now).filter((p) => !now.revealed.includes(p.id))
    if (!pending.length && !event) return
    let alive = true
    ;(async () => {
      busy.current = true
      await sleep(600)
      for (const p of pending) {
        if (!alive) return
        await reveal(p.id)
        markRevealed(p.id)
      }
      if (event && alive) {
        await hop(event.hopFrom, event.hopTo)
        onEventDone()
      }
      busy.current = false
    })()
    return () => {
      alive = false
      busy.current = false
    }
    // Replays when the map becomes visible or a trip ends, not on every progress change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, event])

  useEffect(() => placePin(badgeAt(pinAt)), [pinAt])
  useEffect(() => startSea(layerRef.current!, svgRef.current!, activeRef, shownRef), [])
  useEffect(() => {
    const keep = () => centerOn(badgeAt(pinAtRef.current), false)
    window.addEventListener('resize', keep)
    return () => window.removeEventListener('resize', keep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tap = (id: string) => {
    const p = provinceById(id)
    if (!p || busy.current) return
    if (!isUnlocked(p, progress) || !shown.has(id)) {
      toast(hasContent(p) ? `${p.name} · finish the province before it` : `${p.name} · coming soon`)
      return
    }
    if (pinAt !== id) {
      busy.current = true
      hop(pinAt, id).then(() => (busy.current = false))
      return
    }
    onOpen(p)
  }

  return (
    <div className={`j-map ${isNight(progress) ? 'night' : ''}`}>
      <div className="j-map-scroll" ref={scrollRef}>
        <div className="j-stage" ref={stageRef}>
          <svg ref={svgRef} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} preserveAspectRatio="none">
            <defs>
              <filter id="j-soft" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2.2" />
              </filter>
              {REGIONS.map((r) => {
                const o = ORIGIN[r.id] ?? r.c
                return (
                  <clipPath key={r.id} id={`j-clip-${r.id}`}>
                    <circle cx={o[0]} cy={o[1]} r="0" />
                  </clipPath>
                )
              })}
              <mask id="j-fog" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}>
                <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="#fff" />
                <g filter="url(#j-soft)">
                  {REGIONS.map((r) => {
                    const e = EXTRA_HOLE[r.id]
                    return (
                      <g key={r.id} id={`j-hole-${r.id}`} clipPath={`url(#j-clip-${r.id})`}>
                        <path d={r.d} fill="#000" stroke="#000" strokeWidth="7" strokeLinejoin="round" />
                        {e && <ellipse {...e} fill="#000" />}
                      </g>
                    )
                  })}
                </g>
              </mask>
            </defs>
            <image href={asset('map-illustrated-clean.webp')} x={VB.x} y={VB.y} width={VB.w} height={VB.h} preserveAspectRatio="none" />
            <image
              href={asset('map-fog-clean.webp')}
              x={VB.x - 1.3}
              y={VB.y}
              width={VB.w}
              height={VB.h}
              preserveAspectRatio="none"
              mask="url(#j-fog)"
            />
            <path ref={railRef} fill="none" stroke="none" />
          </svg>
          <div ref={layerRef}>
            {Object.entries(CLOUDS).map(([id, set]) =>
              set.map(([img, dx, dy, w], i) => {
                const c = regionById.get(id)!.c
                return (
                  <div
                    key={`${id}${i}`}
                    className="j-cloud"
                    data-cloud={id}
                    data-dx={dx}
                    data-dy={dy}
                    style={{ ...pct([c[0] + dx, c[1] + dy]), width: w }}
                  >
                    <img src={asset(`${img}.webp`)} alt="" draggable={false} />
                  </div>
                )
              }),
            )}
            {REGIONS.filter((r) => r.unit).map((r) => {
              const p = provinceById(r.id)
              const at = badgeAt(r.id)
              const done = provinceDone(p, progress)
              const open = shown.has(r.id) && isUnlocked(p, progress)
              return (
                <div key={r.id}>
                  <button
                    type="button"
                    className={`j-badge ${done ? 'done' : open ? 'open' : 'locked'}`}
                    style={pct(at)}
                    onClick={() => tap(r.id)}
                    aria-label={`${p.name}${open ? '' : ' (locked)'}`}
                  >
                    {done ? '✓' : r.unit}
                  </button>
                  {open && (
                    <div className="j-label" style={pct([at[0], at[1] + 12])}>
                      {p.name}
                      <span className="j-han">{p.zh}</span>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="j-pin" ref={pinRef}>
              <div className="j-pin-bubble">
                <Face id={progress.traveler} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="j-map-bar">
        <div className={`j-titlebar ${isNight(progress) ? 'night' : ''}`}>
          <button type="button" className="j-round" onClick={() => setPicking(true)} aria-label="Choose your traveller">
            <Face id={progress.traveler} />
          </button>
        </div>
      </div>

      {picking && (
        <>
          <div className="j-sheet-bg" onClick={() => setPicking(false)} />
          <div className="j-sheet" role="dialog" aria-label="Choose your traveller">
            <h3>Who's travelling?</h3>
            <p>Your character marks where you are on the map and drives the train.</p>
            <div className="j-picks">
              {FRIEND_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`j-pick ${progress.traveler === id ? 'on' : ''}`}
                  onClick={() => {
                    setTraveler(id)
                    setTimeout(() => setPicking(false), 250)
                  }}
                >
                  <Face id={id} />
                  <b>{FRIENDS[id].name}</b>
                  <span className="j-han">{FRIENDS[id].hanzi}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---- The living sea: sailing boats with foam, and ripples on open water ----

function startSea(layer: HTMLElement, svg: SVGSVGElement, active: { current: boolean }, shown: { current: Set<string> }) {
  let alive = true
  for (const boat of SEA_BOATS) setSail(boat)

  // Each boat belongs to a province's waters and comes out when that province's fog clears. Some
  // cross the sea again and again, some drop anchor on the way, some just stay where they are.
  function setSail(boat: SeaBoat) {
    const sail = new Image()
    const anchor = new Image()
    let ready = 0
    const go = () => ++ready === 2 && alive && launch(boat, sail.src, anchor.src)
    sail.onload = anchor.onload = go
    sail.src = asset(`boats/${boat.kind}-sail.webp`)
    anchor.src = asset(`boats/${boat.kind}-anchor.webp`)
  }
  function launch(boat: SeaBoat, sailSrc: string, anchorSrc: string) {
    const el = document.createElement('div')
    el.className = 'j-boat'
    el.innerHTML = `<img src="${boat.at ? anchorSrc : sailSrc}" alt="" draggable="false">`
    const img = el.firstElementChild as HTMLImageElement
    el.style.width = `${BOAT_SIZE[boat.kind] * 100}%`
    layer.appendChild(el)
    let out = false
    const appear = () => {
      const on = shown.current.has(boat.province)
      if (on !== out) el.classList.toggle('on', (out = on))
    }
    if (boat.at) {
      // At anchor: bobbing where it is, facing whichever way it was drawn.
      Object.assign(el.style, pct(boat.at))
      if (boat.flip) el.style.transform = 'translate(-50%, -60%) scaleX(-1)'
      const wait = () => {
        if (!alive) return
        appear()
        setTimeout(wait, 500)
      }
      wait()
      return
    }
    const [ax, ay] = boat.from!
    const [bx, by] = boat.to!
    // Sprites face left; flip the ones heading right.
    if (bx > ax) el.style.transform = 'translate(-50%, -60%) scaleX(-1)'
    const len = Math.hypot(bx - ax, by - ay) || 1
    const dir = [(bx - ax) / len, (by - ay) / len]
    const secs = boat.secs!
    const rest = boat.rest ?? 0
    const stop = boat.stop ?? 1
    const cycle = secs + rest
    const t0 = performance.now() - Math.random() * cycle * 1000
    let lastFoam = 0
    let anchored = false
    const sailOn = (now: number) => {
      if (!alive) return
      // While the map is hidden, keep the loop alive but skip the work.
      if (!active.current) {
        requestAnimationFrame(sailOn)
        return
      }
      appear()
      // The line is sailed in `secs`; a boat that calls in waits `rest` seconds at `stop` of the way.
      const t = (((now - t0) / 1000) % cycle + cycle) % cycle
      const resting = rest > 0 && t >= secs * stop && t < secs * stop + rest
      const k = resting ? stop : t < secs * stop ? t / secs : (t - rest) / secs
      if (resting !== anchored) {
        anchored = resting
        img.src = resting ? anchorSrc : sailSrc
      }
      const x = ax + (bx - ax) * k
      const y = ay + (by - ay) * k
      Object.assign(el.style, pct([x, y]))
      el.style.opacity = String(Math.min(1, k * 10, (1 - k) * 10))
      if (!resting && now - lastFoam > 170) {
        // Foam peels off the stern, a little behind the hull.
        const back = (BOAT_SIZE[boat.kind] * VB.w) / 2
        const fx = (x - dir[0] * back - VB.x) / VB.w
        const fy = (y - dir[1] * back * 0.6 - VB.y) / VB.h
        if (out) foam(layer, fx, fy, dir)
        lastFoam = now
      }
      requestAnimationFrame(sailOn)
    }
    requestAnimationFrame(sailOn)
  }

  const land = [...svg.querySelectorAll<SVGPathElement>('#j-fog path')]
  const ripple = () => {
    if (!alive) return
    if (!active.current) {
      setTimeout(ripple, 1000)
      return
    }
    const w = document.createElement('div')
    w.className = 'j-wave'
    w.innerHTML =
      '<svg viewBox="0 0 24 8" width="24" height="8"><path d="M1 5 Q6 1 12 4.5 T23 4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" /></svg>'
    Object.assign(w.style, pct(seaPoint(svg, land)))
    layer.appendChild(w)
    w.animate(
      [
        { opacity: 0, transform: 'translateX(0) scaleX(.5)' },
        { opacity: 0.75, offset: 0.45 },
        { opacity: 0, transform: `translateX(${6 + Math.random() * 10}px) scaleX(1.15)` },
      ],
      { duration: 3200 + Math.random() * 2600, easing: 'ease-in-out' },
    ).onfinish = () => {
      w.remove()
      ripple()
    }
  }
  for (let i = 0; i < 34; i++) setTimeout(ripple, i * 180)
  return () => {
    alive = false
    layer.querySelectorAll('.j-boat, .j-foam, .j-wave').forEach((e) => e.remove())
  }
}

function foam(layer: HTMLElement, x: number, y: number, dir: readonly number[]) {
  const f = document.createElement('div')
  f.className = 'j-foam'
  f.style.left = `${x * 100}%`
  f.style.top = `${y * 100}%`
  layer.appendChild(f)
  const side = (Math.random() - 0.5) * 2
  const back = 10 + Math.random() * 8
  const tx = -dir[0] * back - dir[1] * side * 6
  const ty = -dir[1] * back + dir[0] * side * 6
  const ang = (Math.atan2(dir[1], dir[0]) * 180) / Math.PI
  f.animate(
    [
      { transform: `rotate(${ang}deg) scale(.6)`, opacity: 0.95 },
      { transform: `translate(${tx}px, ${ty}px) rotate(${ang}deg) scale(2.4, 1.6)`, opacity: 0 },
    ],
    { duration: 1800 + Math.random() * 700, easing: 'ease-out' },
  ).onfinish = () => f.remove()
}

/** A random point on open water, a little away from any coast. */
function seaPoint(svg: SVGSVGElement, land: SVGPathElement[]): [number, number] {
  const pt = svg.createSVGPoint()
  for (let tries = 0; tries < 40; tries++) {
    const x = VB.x + Math.random() * VB.w
    const y = VB.y + Math.random() * VB.h
    const near = [[0, 0], [14, 0], [-14, 0], [0, 10], [0, -10]].some(([dx, dy]) => {
      pt.x = x + dx
      pt.y = y + dy
      return land.some((p) => p.isPointInFill(pt))
    })
    if (!near) return [x, y]
  }
  return [VB.x + 40, VB.y + 40]
}
