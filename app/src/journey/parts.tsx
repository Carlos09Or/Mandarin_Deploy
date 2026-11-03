import type { ReactNode, Ref } from 'react'
import type { FriendId } from '../data/friends'
import { PORTRAITS, asset } from '../data/journey'

/** Head-and-shoulders portrait of a character, cropped from its full-body art. */
export function Face({ id, className = '' }: { id: FriendId; className?: string }) {
  const { file, crop } = PORTRAITS[id]
  const [x, y, s] = crop
  return (
    <div className={`j-face ${className}`}>
      <img
        src={asset(file)}
        alt=""
        draggable={false}
        style={{ width: `${(200 / s) * 100}%`, left: `${(-x / s) * 100}%`, top: `${(-y / s) * 100}%` }}
      />
    </div>
  )
}

/** A repeating landscape strip: normal and mirrored copies alternate so the seams always match. */
export function Strip({ src, className, ref }: { src: string; className: string; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={`j-strip ${className}`}>
      {[0, 1, 0, 1].map((m, i) => (
        <img key={i} src={asset(src)} className={m ? 'mirror' : ''} alt="" draggable={false} />
      ))}
    </div>
  )
}
// ---- Route icons ----

export function Knot({ on, className = '' }: { on: boolean; className?: string }) {
  const c = on ? '#d21034' : '#cdc5b5'
  const t = on ? '#f2c14e' : '#b9b1a1'
  return (
    <svg className={`j-knot ${className}`} viewBox="0 0 30 46" aria-hidden="true">
      <path d="M15 0v6" stroke={t} strokeWidth="2" />
      <circle cx="15" cy="7" r="2.2" fill={t} />
      <g transform="translate(15 19) rotate(45)">
        {[[-7, -7], [7, -7], [-7, 7], [7, 7]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="3.4" fill="none" stroke={c} strokeWidth="2.4" />
        ))}
        <rect x="-7" y="-7" width="14" height="14" rx="2" fill={c} />
        <path d="M-7 -2.3H7M-7 2.3H7M-2.3 -7V7M2.3 -7V7" stroke="#fff" strokeOpacity=".45" strokeWidth="1" />
      </g>
      <rect x="13.6" y="29" width="2.8" height="3" fill={t} />
      <path d="M12.5 32h5l1.4 13h-7.8z" fill={on ? '#f2c14e' : '#cdc5b5'} />
      {!on && (
        <g transform="translate(19 26)">
          <rect x="0" y="4" width="9" height="7" rx="1.5" fill="#8f877a" />
          <path d="M2 4.5V3a2.5 2.5 0 0 1 5 0v1.5" fill="none" stroke="#8f877a" strokeWidth="1.6" />
        </g>
      )}
    </svg>
  )
}

export const BookIcon = () => (
  <div className="j-bookic">
    <svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true">
      <path d="M10 3C7.5 1 4 .8 1 1.5v12.5c3-.7 6.5-.5 9 1.5 2.5-2 6-2.2 9-1.5V1.5C16 .8 12.5 1 10 3z" fill="#fff" />
      <path d="M10 3v12.5" stroke="#d21034" strokeWidth="1.2" />
    </svg>
  </div>
)

/**
 * The title card shared by the map and the routes: a round button on the left (the traveller or
 * "back") and a frosted card with a small kicker, the place in English and Chinese, and an
 * optional progress bar. Dark glass at night.
 */
export function TitleCard({
  lead,
  kicker,
  name,
  zh,
  progress,
  night,
  paper,
}: {
  lead: ReactNode
  kicker: string
  name: string
  zh: string
  progress?: [done: number, total: number]
  night?: boolean
  /** Warm paper card (cream by day, slate by night) for routes drawn over a painted backdrop. */
  paper?: boolean
}) {
  return (
    <div className={`j-titlebar ${paper ? 'paper' : ''} ${night ? 'night' : ''}`}>
      {lead}
      <div className={`j-card ${progress ? 'tall' : ''}`}>
        <small>{kicker}</small>
        <p className="j-card-name" role="heading" aria-level={1}>
          {name}
          <span className="j-han">{zh}</span>
        </p>
        {progress && (
          <div className="j-prog">
            <b>
              <i style={{ width: `${(progress[0] / progress[1]) * 100}%` }} />
            </b>
            <span>
              {progress[0]}/{progress[1]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
