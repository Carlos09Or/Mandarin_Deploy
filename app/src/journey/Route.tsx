import { useEffect, useLayoutEffect, useRef } from 'react'
import { UNITS } from '../data/course'
import { PORTRAITS, asset, type Province } from '../data/journey'
import { isNight, useProgress } from '../lib/progress'
import { BookIcon, Knot } from './parts'
import { nextStop, stopsOf, type Stop } from './stops'
import { toast } from './toast'
import './journey.css'

type Props = {
  province: Province
  /** Node just finished, so its knot can pop. */
  justDone: string | null
  onBack: () => void
  onBoard: (stop: Extract<Stop, { node: unknown }>) => void
}

/** Characters the split-flap tiles spin through before they settle. */
const FLAP = '你好我是谁他她们中国人朋友上车大小天日月水火山口'.split('')

export function Route({ province, justDone, onBack, onBoard }: Props) {
  const progress = useProgress()
  const stops = stopsOf(province)
  const at = nextStop(stops, progress)
  const lessons = stops.filter((s) => s.kind === 'lesson').length
  const doneLessons = stops.filter((s) => s.kind === 'lesson' && progress.nodes[s.node.id]).length
  const lineRef = useRef<HTMLDivElement>(null)
  const tilesRef = useRef<HTMLDivElement>(null)
  const current = stops[at]
  const boardChars = current?.kind === 'lesson' ? [...current.key.hanzi] : current?.kind === 'goal' ? [...province.landmark!.zh] : []

  // The rail is red up to the current stop and dashed after it.
  useLayoutEffect(() => {
    const line = lineRef.current!
    const rows = [...line.querySelectorAll<HTMLElement>('.j-row')]
    const mid = (r: HTMLElement) => r.offsetTop + r.offsetHeight / 2
    const first = mid(rows[0])
    const last = mid(rows[rows.length - 1])
    const cur = mid(rows[Math.min(at, rows.length - 1)])
    Object.assign(line.querySelector<HTMLElement>('.j-rail.done')!.style, { top: `${first}px`, height: `${cur - first}px` })
    Object.assign(line.querySelector<HTMLElement>('.j-rail.todo')!.style, { top: `${cur}px`, height: `${last - cur}px` })
  })

  useEffect(() => {
    lineRef.current?.querySelector('.current')?.scrollIntoView({ block: 'nearest', behavior: justDone ? 'smooth' : 'auto' })
    if (boardChars.length) flipTo(tilesRef.current!, boardChars)
    // The board spins once per stop, when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at])

  const board = async (s: Extract<Stop, { node: unknown }>) => {
    await flipTo(tilesRef.current!, ['上', '车'])
    setTimeout(() => onBoard(s), 200)
  }

  return (
    <div className="j-route">
      {/* Provinces without a night painting just dim their day one. */}
      <div className={`j-sky ${isNight(progress) && !province.header?.night ? 'dim' : ''}`}>
        <i style={{ backgroundImage: `url(${asset(province.header!.day)})` }} />
        {province.header?.night && (
          <i style={{ backgroundImage: `url(${asset(province.header.night)})`, opacity: isNight(progress) ? 1 : 0 }} />
        )}
        <div className="j-head">
          <button type="button" className="j-back" onClick={onBack} aria-label="Back to the map">
            ←
          </button>
          <div>
            <small>
              UNIT {province.unit} · {UNITS.find((u) => u.id === province.unit)?.title.toUpperCase()}
            </small>
            <h1>
              {province.name}
              <span className="j-han">{province.zh}</span>
            </h1>
            <div className="j-prog">
              <b>
                <i style={{ width: `${(doneLessons / lessons) * 100}%` }} />
              </b>
              <span>
                {doneLessons}/{lessons}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="j-line" ref={lineRef}>
        <div className="j-rail done" />
        <div className="j-rail todo" />
        {stops.map((s, i) => {
          const state = i < at ? 'done' : i === at ? 'current' : 'locked'
          if (s.kind === 'story') {
            return (
              <button key="story" type="button" className="j-row story" onClick={() => toast('Story · The railroad — coming soon')}>
                <div className="j-ic">
                  <BookIcon />
                </div>
                <div>
                  <b>{s.title}</b>
                  <small>{s.sub}</small>
                </div>
              </button>
            )
          }
          const replay = () => (state === 'locked' ? toast('Finish the stops before this one first') : onBoard(s))
          if (state === 'current') {
            const title = s.kind === 'lesson' ? s.key.en : 'Checkpoint'
            const py = s.kind === 'lesson' ? s.key.pinyin : province.landmark!.py
            return (
              <div key={s.node.id} className="j-row current">
                <div className="j-rider">
                  <img src={asset(PORTRAITS[progress.traveler].file)} alt="" />
                </div>
                <div className="j-ic">
                  <div className="j-ring" />
                </div>
                <button type="button" className="j-board" onClick={() => board(s)} aria-label={`Board: ${s.place}`}>
                  <div className="j-bd-head">{s.kind === 'goal' ? 'CHECKPOINT · ALL WORDS' : `NEXT DEPARTURE · ${s.node.words.length} WORDS`}</div>
                  <div className="j-tiles" ref={tilesRef} />
                  <div className="j-bd-foot">
                    <span>
                      <span className="py">{py}</span> · {title}
                    </span>
                    <span className="place">{s.place}</span>
                  </div>
                </button>
              </div>
            )
          }
          if (s.kind === 'goal') {
            return (
              <button key={s.node.id} type="button" className={`j-row goal ${state}`} onClick={replay}>
                <div className="j-ic">
                  <div className="j-goal-ic" style={{ backgroundImage: `url(${asset(province.landmark!.image)})` }} />
                </div>
                <div>
                  <b>
                    {s.place} · {province.landmark!.py}
                  </b>
                  <small>Checkpoint · earns the stamp</small>
                </div>
              </button>
            )
          }
          return (
            <button key={s.node.id} type="button" className={`j-row ${state}`} onClick={replay}>
              <div className="j-ic">
                <Knot on={state === 'done'} className={s.node.id === justDone ? 'pop' : ''} />
              </div>
              <div>
                <b>
                  {s.key.en} · {s.key.pinyin}
                </b>
                <small>{s.place}</small>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---- Split-flap board ----

let clickCtx: AudioContext | null = null
function click() {
  try {
    clickCtx ??= new AudioContext()
    const buf = clickCtx.createBuffer(1, 600, clickCtx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6)
    const src = clickCtx.createBufferSource()
    const g = clickCtx.createGain()
    g.gain.value = 0.18
    src.buffer = buf
    src.connect(g).connect(clickCtx.destination)
    src.start()
  } catch {
    /* no audio: the board still flips */
  }
}

/** Spins each tile through a few characters, left to right, until it shows its own. */
function flipTo(box: HTMLElement, chars: string[]) {
  if (box.children.length !== chars.length) box.innerHTML = chars.map(() => '<span class="j-tile"><i></i></span>').join('')
  const tiles = [...box.children] as HTMLElement[]
  return Promise.all(
    tiles.map(
      (t, i) =>
        new Promise<void>((resolve) => {
          let n = 5 + i * 3
          const step = () => {
            const last = n-- <= 0
            t.querySelector('i')!.textContent = last ? chars[i] : FLAP[Math.floor(Math.random() * FLAP.length)]
            t.classList.remove('flap')
            void t.offsetWidth
            t.classList.add('flap')
            click()
            if (last) resolve()
            else setTimeout(step, 70)
          }
          step()
        }),
    ),
  )
}
