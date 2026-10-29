import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { PathNode } from '../data/course'
import type { FriendId } from '../data/friends'
import { DOOR_FRAME, DOOR_STATES, WALK_POSES, asset, doorFiles, doorFor, doorOpening, lessonTitle, type Province } from '../data/journey'
import { useProgress } from '../lib/progress'
import { whenLoaded } from './preload'
import { stopsOf, type Stop } from './stops'
import { toast } from './toast'
import './journey.css'

type Props = {
  province: Province
  traveler: FriendId
  onBack: () => void
  /** Called once the walk is over, with the lesson the door was for. */
  onDone: (stop: { node: PathNode; place: string }) => void
}

/** How long the tap-to-lesson takes: --walk-delay + --walk-time in journey.css, plus a beat for the light. */
const WALK_MS = 2200

const LOCKED = 'Finish the doors before this one first'

/**
 * A province's page: one door per lesson side by side on a white page, which you swipe between. It opens on the
 * next lesson's door, "第二课" above it and the traveller standing at the bottom with their back to us, looking up.
 * Doors you have not reached yet are grey. Tap to go: the traveller hops, walks up the path while the door opens
 * and goes in through the light; then the lesson starts. Finished lessons can be opened again.
 */
export function LessonDoor({ province, traveler, onBack, onDone }: Props) {
  const progress = useProgress()
  const stops = useMemo(() => stopsOf(province).filter((s): s is Extract<Stop, { node: PathNode }> => s.kind !== 'story'), [province])
  const doors = useMemo(() => stops.map((s) => doorFor(s.node)), [stops])
  const next = stops.findIndex((s) => !progress.nodes[s.node.id])
  const at = next === -1 ? stops.length - 1 : next
  // Which door is in view; the page opens on the next one to play.
  const [view, setView] = useState(at)
  const stop = stops[view]
  const locked = next !== -1 && view > next
  const title =
    stop.kind === 'goal'
      ? { zh: province.landmark!.zh, py: province.landmark!.py }
      : lessonTitle(stop.node.index + 1)

  // 'loading' while the pictures arrive, 'wait' for the tap, 'walk' to the door.
  const [phase, setPhase] = useState<'loading' | 'wait' | 'walk'>('loading')
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  // The doors are all fetched before the page shows, so swiping never waits on a picture.
  useEffect(() => {
    let alive = true
    // Only 'loading' moves on: a later render must never pull a walk back to waiting.
    void whenLoaded(doors.flatMap((d) => doorFiles(d, traveler))).then(() => alive && setPhase((p) => (p === 'loading' ? 'wait' : p)))
    return () => {
      alive = false
    }
  }, [doors, traveler])

  // Once the page shows, the door in view gets its opening pictures (the others when they come into view), so a slow
  // connection only ever waits for the closed doors.
  const [opening, setOpening] = useState(() => new Set([at]))
  useEffect(() => {
    if (phase !== 'loading') void whenLoaded(doorOpening(doors[view]))
  }, [phase, view, doors])

  useEffect(() => {
    if (phase !== 'walk') return
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => done.current({ node: stop.node, place: stop.place }), calm ? 700 : WALK_MS)
    return () => clearTimeout(t)
  }, [phase, stop])

  // ---- the track of doors: swipe (touch), drag (mouse), arrow keys or the dots ----
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  // offsetWidth, not getBoundingClientRect: the doors out of view are scaled down, which would shrink the rect.
  const slideWidth = () => (track.current?.firstElementChild as HTMLElement | undefined)?.offsetWidth ?? 1
  const center = (i: number, smooth: boolean) => {
    track.current?.scrollTo({ left: Math.max(0, Math.min(stops.length - 1, i)) * slideWidth(), behavior: smooth ? 'smooth' : 'auto' })
  }

  useLayoutEffect(() => {
    center(at, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (phase === 'walk') return
      if (e.key === 'ArrowLeft') center(view - 1, true)
      if (e.key === 'ArrowRight') center(view + 1, true)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const i = Math.max(0, Math.min(stops.length - 1, Math.round((track.current?.scrollLeft ?? 0) / slideWidth())))
    setView((v) => (v === i ? v : i))
    setOpening((o) => (o.has(i) ? o : new Set(o).add(i)))
  }
  // A mouse cannot swipe, so it drags the track by hand (snapping is paused meanwhile).
  const down = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || phase === 'walk') return
    drag.current = { x: e.clientX, left: track.current!.scrollLeft, moved: false }
  }
  const move = (e: PointerEvent) => {
    const d = drag.current
    if (!d || e.buttons !== 1) return
    if (Math.abs(e.clientX - d.x) > 6) d.moved = true
    if (d.moved) {
      track.current!.style.scrollSnapType = 'none'
      track.current!.scrollLeft = d.left - (e.clientX - d.x)
    }
  }
  const up = () => {
    const d = drag.current
    if (!d) return
    if (d.moved) {
      track.current!.style.scrollSnapType = ''
      center(Math.round(track.current!.scrollLeft / slideWidth()), true)
      // The click that ends a drag must not count as a tap on a door.
      setTimeout(() => (drag.current = null), 0)
    } else drag.current = null
  }

  // The walk waits (briefly) for the door's opening pictures, which only a slow connection will not have yet.
  const going = useRef(false)
  const go = () => {
    if (drag.current?.moved || phase !== 'wait' || going.current) return
    if (locked) return toast(LOCKED)
    going.current = true
    void whenLoaded(doorOpening(doors[view]), 2500).then(() => {
      going.current = false
      setPhase('walk')
    })
  }

  const { plaque } = DOOR_FRAME
  const vars = { '--ar': DOOR_FRAME.h / DOOR_FRAME.w, '--step': DOOR_FRAME.step, '--cx': `${plaque.x * 100}%` } as CSSProperties

  return (
    <div className={`j-door ${phase !== 'loading' ? 'ready' : ''} ${phase === 'walk' ? 'walking' : ''}`} style={vars}>
      <button type="button" className="j-door-back" onClick={onBack} aria-label="Back to the map">
        ←
      </button>

      <header className="j-door-title">
        <b lang="zh">{title.zh}</b>
        <small>{title.py}</small>
        <div className="j-door-dots">
          {stops.map((s, i) => (
            <button
              key={s.node.id}
              type="button"
              aria-label={`Door ${i + 1}`}
              className={`${next !== -1 && i > next ? 'locked' : next === i ? 'now' : 'done'} ${i === view ? 'view' : ''}`}
              onClick={() => phase !== 'walk' && center(i, true)}
            />
          ))}
        </div>
      </header>

      <div className="j-door-stage">
        <div
          ref={track}
          className="j-door-track"
          onScroll={onScroll}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onClickCapture={(e) => {
            if (drag.current?.moved) e.stopPropagation()
          }}
        >
          {stops.map((s, i) => {
            const door = doors[i]
            const num = s.kind === 'goal' ? '关' : lessonTitle(s.node.index + 1).num
            const closed = next !== -1 && i > next
            return (
              <div key={s.node.id} className={`j-slide ${i === view ? 'on' : ''} ${closed ? 'locked' : ''}`} aria-hidden={i !== view}>
                <img className="j-door-path" src={asset(`door/path-${door.path}.webp`)} alt="" draggable={false} />
                <button type="button" className="j-door-frame" onClick={go} tabIndex={i === view ? 0 : -1} aria-label={`${s.place}: ${closed ? 'locked' : 'start'}`}>
                  {/* Closed, half open and wide open are laid on top of each other; the walk fades them in. */}
                  {DOOR_STATES.filter((st) => st === 'closed' || (phase !== 'loading' && opening.has(i))).map((st) => (
                    <img key={st} className={`j-door-art ${st}`} src={asset(`door/${door.name}-${st}.webp`)} alt="" draggable={false} />
                  ))}
                  <span
                    className="j-door-num"
                    lang="zh"
                    style={{ left: `${plaque.x * 100}%`, top: `${plaque.y * 100}%`, width: `${plaque.d * 100}%`, fontSize: `calc(var(--dw) * ${plaque.d * 0.74})` }}
                  >
                    {num}
                  </span>
                  {closed && <span className="j-door-lock" aria-hidden="true">🔒</span>}
                  <i className="j-door-glow" />
                </button>
              </div>
            )
          })}
        </div>

        {/* One traveller for every door: they wait below whichever door is in view. */}
        <div className="j-door-lane" aria-hidden="true">
          <div className="j-walker">
            <div className="j-walker-bob">
              {WALK_POSES.map((pose) => (
                <img key={pose} className={`j-w-${pose}`} src={asset(`door/${traveler}-${pose}.webp`)} alt="" draggable={false} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <button type="button" className={`j-door-go ${locked ? 'locked' : ''}`} onClick={go}>
        {locked ? '🔒' : <span lang="zh">开始</span>} kāishǐ
      </button>
    </div>
  )
}
