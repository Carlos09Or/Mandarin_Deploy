import type { CSSProperties, Ref } from 'react'
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

// ---- Train: the side-view painting plus spinning wheels and passengers ----

/** Wheel centers and outer radius in train.webp pixels (1672 × 941). */
const WHEELS = [
  [130, 696, 46], [255, 696, 46], [595, 696, 46], [725, 696, 46],
  [962, 664, 73], [1120, 664, 71], [1320, 700, 41], [1425, 700, 41],
]
/** The wheel covers 84.7 % of train-wheel.webp. */
const WHEEL_FILL = 0.847
/** Window glass boxes [x0, y0, x1, y1]; the last one is the driver's cab. */
const SEATS = [
  [283, 432, 362, 532], [525, 432, 604, 532], [645, 432, 724, 532], [942, 385, 1022, 490],
]
const pctX = (v: number) => `${(v / 1672) * 100}%`
const pctY = (v: number) => `${(v / 941) * 100}%`

type TrainProps = { className?: string; style?: CSSProperties; crew?: FriendId[]; ref?: Ref<HTMLDivElement> }

export function Train({ className = '', style, crew, ref }: TrainProps) {
  return (
    <div ref={ref} className={`j-train ${className}`} style={style}>
      <img className="j-body" src={asset('train.webp')} alt="" draggable={false} />
      {crew && (
        <div className="j-seats">
          {SEATS.map(([x0, y0, x1, y1], i) => {
            // A little wider than the window so heads can lean out of it.
            const w = (x1 - x0) * 1.6
            const cx = (x0 + x1) / 2
            return (
              <div
                key={i}
                className="j-seat"
                style={{ left: pctX(cx - w / 2), width: pctX(w), top: pctY(y0 - 60), height: pctY(y1 - y0 + 60) }}
              >
                <Face id={crew[i]} />
              </div>
            )
          })}
        </div>
      )}
      <div className="j-wheels">
        {WHEELS.map(([cx, cy, r], i) => {
          const s = (2 * r) / WHEEL_FILL
          return (
            <img
              key={i}
              className="j-wheel"
              src={asset('train-wheel.webp')}
              alt=""
              draggable={false}
              style={{ left: pctX(cx - s / 2), top: pctY(cy - s / 2), width: pctX(s), animationDelay: `${-i * 0.13}s` }}
            />
          )
        })}
      </div>
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
