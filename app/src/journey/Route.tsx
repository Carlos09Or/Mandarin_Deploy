import { useEffect, useRef, type UIEvent } from 'react'
import { Buddy } from '../components/Friends'
import { UNITS } from '../data/course'
import { FRIEND_IDS } from '../data/friends'
import { STOP_ICONS, STORY_ICON, asset, type Province } from '../data/journey'
import { isNight, useProgress } from '../lib/progress'
import { TitleCard } from './parts'
import { nextStop, stopsOf, type Stop } from './stops'
import { toast } from './toast'
import './journey.css'

type Props = {
  province: Province
  /** Node just finished, so its medallion can pop. */
  justDone: string | null
  onBack: () => void
  onBoard: (stop: Extract<Stop, { node: unknown }>) => void
}

/** Sideways offsets (px) that give the path its gentle zig-zag. */
const ZIGZAG = [0, 54, 76, 54, 0, -54, -76, -54]
/** At the widest bends of the path, a friend stands on a little island on the other side. */
const FRIEND_AT = new Set([2, 6])

/**
 * Friends who live in a backdrop's scenery instead of on islands beside the path. `x`, `y` and `w`
 * are percentages of the painting (its left edge to the right, top down, and its width), so they
 * stay on the same spot of the picture at any screen size. (x, y) is the top-left of the friend.
 */
const SCENERY_FRIENDS: { id: (typeof FRIEND_IDS)[number]; x: number; y: number; w: number }[] = [
  { id: 'harpia', x: 2, y: 80, w: 19 },
  { id: 'sloth', x: 78, y: 36, w: 17 },
]

/** The painted backdrop of a route: the day and night paintings, with the friends living in the scenery. */
function Backdrop({ day, night, dark }: { day: string; night: string; dark: boolean }) {
  return (
    <div className="j-backdrop" aria-hidden="true">
      <div className="j-bd-art">
        <i style={{ backgroundImage: `url(${asset(day)})` }} />
        <i style={{ backgroundImage: `url(${asset(night)})`, opacity: dark ? 1 : 0 }} />
        {SCENERY_FRIENDS.map((f) => (
          <div key={f.id} className="j-scenery-friend" style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%` }}>
            <Buddy id={f.id} size={100} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A mascot standing on a small round patch of grass beside the path. */
function FriendSpot({ index, unit, x }: { index: number; unit: number; x: number }) {
  if (!FRIEND_AT.has(index % ZIGZAG.length)) return null
  const id = FRIEND_IDS[(Math.floor(index / 4) + unit) % FRIEND_IDS.length]
  return (
    <div className="j-friend-spot" style={{ [x > 0 ? 'right' : 'left']: 'calc(100% + 18px)' }} aria-hidden="true">
      <i className="j-ground" />
      <Buddy id={id} size={92} />
    </div>
  )
}

/**
 * A province's route, kept minimal: one felt medallion per stop on a winding path, no labels.
 * The next stop is bigger, with a small gold "开始 kāishǐ" under it to start.
 */
export function Route({ province, justDone, onBack, onBoard }: Props) {
  const progress = useProgress()
  const stops = stopsOf(province)
  const at = nextStop(stops, progress)
  const lessons = stops.filter((s) => s.kind === 'lesson').length
  const doneLessons = stops.filter((s) => s.kind === 'lesson' && progress.nodes[s.node.id]).length
  const pathRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  // The backdrop glides with the route: how far down the route you are (0 to 1).
  const glide = (el: HTMLElement) => {
    const max = el.scrollHeight - el.clientHeight
    shellRef.current?.style.setProperty('--bd-p', String(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0))
  }
  const night = isNight(progress)
  const { backdrop } = province

  useEffect(() => {
    pathRef.current?.querySelector('.current')?.scrollIntoView({ block: 'center', behavior: justDone ? 'smooth' : 'auto' })
    // Only when the next stop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at])

  return (
    <div ref={shellRef} className={`j-route-shell ${backdrop ? 'painted' : ''} ${night ? 'night' : ''}`}>
      {backdrop && <Backdrop day={backdrop.day} night={backdrop.night} dark={night} />}
      <div
        className="j-route"
        onScroll={(e: UIEvent<HTMLDivElement>) => glide(e.currentTarget)}
        style={backdrop ? undefined : { backgroundImage: `url(${asset('route-pattern.webp')})` }}
      >
        {backdrop ? (
          <div className="j-head solo">
            <TitleCard
              lead={
                <button type="button" className="j-round" onClick={onBack} aria-label="Back to the map">
                  ←
                </button>
              }
              kicker={`Unit ${province.unit} · ${UNITS.find((u) => u.id === province.unit)?.title ?? ''}`}
              name={province.name}
              zh={province.zh}
              progress={[doneLessons, lessons]}
              night={night}
              paper
            />
          </div>
        ) : (
          // Provinces without a night painting just dim their day one.
          <div className={`j-sky small ${night && !province.header?.night ? 'dim' : ''}`}>
            <i style={{ backgroundImage: `url(${asset(province.header!.day)})` }} />
            {province.header?.night && (
              <i style={{ backgroundImage: `url(${asset(province.header.night)})`, opacity: night ? 1 : 0 }} />
            )}
            <div className="j-head">
              <TitleCard
                lead={
                  <button type="button" className="j-round" onClick={onBack} aria-label="Back to the map">
                    ←
                  </button>
                }
                kicker={`Unit ${province.unit} · ${UNITS.find((u) => u.id === province.unit)?.title ?? ''}`}
                name={province.name}
                zh={province.zh}
                progress={[doneLessons, lessons]}
                night={night}
              />
            </div>
          </div>
        )}

        <div className="j-path" ref={pathRef}>
          {stops.map((s, i) => {
            const x = ZIGZAG[i % ZIGZAG.length]
            if (s.kind === 'story') {
              return (
                <div key="story" className="j-stop-wrap" style={{ translate: `${x}px 0` }}>
                  {!backdrop && <FriendSpot index={i} unit={province.unit} x={x} />}
                  <button
                    type="button"
                    className="j-stop"
                    onClick={() => toast('Story · The railroad — coming soon')}
                    aria-label={s.title}
                  >
                    <img className="j-medal" src={asset(STORY_ICON)} alt="" draggable={false} />
                  </button>
                </div>
              )
            }
            const state = i < at ? 'done' : i === at ? 'current' : 'locked'
            const go = () => (state === 'locked' ? toast('Finish the stops before this one first') : onBoard(s))
            const icon = s.kind === 'goal' ? province.landmark!.image : STOP_ICONS[s.place]
            const label = s.kind === 'goal' ? `${s.place} · checkpoint` : `${s.place} · ${s.key.en}`
            return (
              <div key={s.node.id} className={`j-stop-wrap ${state}`} style={{ translate: `${x}px 0` }}>
                {!backdrop && <FriendSpot index={i} unit={province.unit} x={x} />}
                <button
                  type="button"
                  className={`j-stop ${state} ${s.kind} ${s.node.id === justDone ? 'pop' : ''}`}
                  onClick={go}
                  aria-label={label}
                >
                  {icon ? (
                    <img className={`j-medal ${icon.startsWith('stops/') ? '' : 'photo'}`} src={asset(icon)} alt="" draggable={false} />
                  ) : (
                    <span className="j-medal plain j-han">{s.kind === 'lesson' ? s.key.hanzi : province.landmark!.zh}</span>
                  )}
                  {state === 'done' && <span className="j-tick">✓</span>}
                  {state === 'locked' && <span className="j-lock">🔒</span>}
                </button>
                {state === 'current' && (
                  <button type="button" className="j-start" onClick={go}>
                    <span className="j-han">开始</span> kāishǐ
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
