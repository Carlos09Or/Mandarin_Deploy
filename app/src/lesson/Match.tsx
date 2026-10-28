import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { word } from '../data/course'
import { chime, speak } from '../lib/audio'
import { Stage } from './Stage'

type Props = { words: number[]; onDone: (mistakes: number) => void }
type Side = 'l' | 'r'
type Point = { x: number; y: number }

const shuffled = (a: number[]) => [...a].sort(() => Math.random() - 0.5)
const ROW = 68
const DRAG_THRESHOLD = 6

/** A smooth S-curve between two dots, like a thread pulled across the page. */
const thread = (a: Point, b: Point) => {
  const mid = (a.x + b.x) / 2
  return `M ${a.x} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`
}

export function Match({ words, onDone }: Props) {
  const left = useMemo(() => shuffled(words), [words])
  const right = useMemo(() => {
    // Never start with the answers lined up in the same order.
    let r = shuffled(words)
    for (let i = 0; i < 8 && words.length > 1 && r.every((n, j) => n === left[j]); i++) r = shuffled(words)
    return r
  }, [words, left])

  const box = useRef<HTMLDivElement>(null)
  const dots = useRef(new Map<string, HTMLElement>())
  const [pos, setPos] = useState<Record<string, Point>>({})
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<{ side: Side; n: number } | null>(null)
  const [drag, setDrag] = useState<Point | null>(null)
  const [wrong, setWrong] = useState<[number, number] | null>(null)
  const [mistakes, setMistakes] = useState(0)
  // Handlers are created once per press, so they read the latest state through refs.
  const activeRef = useRef(active)
  const matchedRef = useRef(matched)
  const mistakesRef = useRef(mistakes)
  useLayoutEffect(() => {
    activeRef.current = active
    matchedRef.current = matched
    mistakesRef.current = mistakes
  })

  // Where each dot sits inside the box, so the threads can be drawn between them.
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const o = el.getBoundingClientRect()
      const next: Record<string, Point> = {}
      dots.current.forEach((d, key) => {
        const r = d.getBoundingClientRect()
        next[key] = { x: r.left + r.width / 2 - o.left, y: r.top + r.height / 2 - o.top }
      })
      setPos(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [left, right])

  const attempt = (l: number, r: number) => {
    setActive(null)
    if (l === r) {
      chime.correct()
      speak(word(l).hanzi)
      const next = new Set(matchedRef.current).add(l)
      setMatched(next)
      if (next.size === words.length) onDone(mistakesRef.current)
      return
    }
    chime.wrong()
    setMistakes((m) => m + 1)
    setWrong([l, r])
    setTimeout(() => setWrong(null), 650)
  }

  const onPointerDown = (e: ReactPointerEvent, side: Side, n: number) => {
    if (e.button !== 0 || matchedRef.current.has(n) || wrong) return
    const cur = activeRef.current
    // Tap one end, then tap the other.
    if (cur && cur.side !== side) return attempt(side === 'r' ? cur.n : n, side === 'r' ? n : cur.n)

    if (side === 'l') speak(word(n).hanzi)
    setActive({ side, n })
    const start = { x: e.clientX, y: e.clientY }
    let moved = false
    const local = (ev: PointerEvent) => {
      const o = box.current!.getBoundingClientRect()
      return { x: ev.clientX - o.left, y: ev.clientY - o.top }
    }
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_THRESHOLD) return
      moved = true
      setDrag(local(ev))
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      setDrag(null)
      if (!moved) return
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>('[data-row]')
      const other = row?.dataset.side as Side | undefined
      const m = Number(row?.dataset.n)
      if (row && other && other !== side && !matchedRef.current.has(m)) attempt(side === 'l' ? n : m, side === 'l' ? m : n)
      else setActive(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const row = (side: Side, n: number) => {
    const key = `${side}${n}`
    const done = matched.has(n)
    const isActive = active?.side === side && active.n === n
    const isWrong = !!wrong && (side === 'l' ? wrong[0] === n : wrong[1] === n)
    const w = word(n)
    const dot = (
      <span
        ref={(el) => {
          if (el) dots.current.set(key, el)
          else dots.current.delete(key)
        }}
        className={`h-4 w-4 shrink-0 rounded-full transition-colors ${
          done || isActive ? 'bg-jade' : isWrong ? 'bg-wrong' : 'bg-line-dark'
        } ${isActive ? 'ring-4 ring-jade/25' : ''}`}
      />
    )
    return (
      <div
        key={key}
        data-row
        data-side={side}
        data-n={n}
        onPointerDown={(e) => onPointerDown(e, side, n)}
        style={{ height: ROW }}
        className={`flex touch-none items-center gap-3 rounded-2xl px-2 select-none ${
          side === 'l' ? 'justify-between' : ''
        } ${done ? 'pointer-events-none opacity-60' : 'cursor-pointer'} ${isWrong ? 'bg-wrong-soft' : isActive ? 'bg-jade-soft' : ''}`}
      >
        {side === 'l' ? (
          <>
            <span className={`han font-bold whitespace-nowrap ${[...w.hanzi].length > 1 ? 'text-3xl' : 'text-4xl'}`}>{w.hanzi}</span>
            {dot}
          </>
        ) : (
          <>
            {dot}
            <span className="text-base leading-tight font-bold">{w.en}</span>
          </>
        )}
      </div>
    )
  }

  const from = active && drag ? pos[`${active.side}${active.n}`] : null
  return (
    <Stage eyebrow="Link the pairs" title="Draw matching lines.">
      <div ref={box} className="relative flex justify-between pt-2">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {[...matched].map((n) =>
            pos[`l${n}`] && pos[`r${n}`] ? (
              <path key={n} d={thread(pos[`l${n}`], pos[`r${n}`])} fill="none" stroke="#2f9e7e" strokeWidth="5" strokeLinecap="round" />
            ) : null,
          )}
          {wrong && pos[`l${wrong[0]}`] && pos[`r${wrong[1]}`] && (
            <path
              d={thread(pos[`l${wrong[0]}`], pos[`r${wrong[1]}`])}
              fill="none"
              stroke="#d6453d"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="2 10"
            />
          )}
          {from && drag && (
            <path
              d={active!.side === 'l' ? thread(from, drag) : thread(drag, from)}
              fill="none"
              stroke="#2f9e7e"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.6"
            />
          )}
        </svg>
        <div className="w-[38%]">{left.map((n) => row('l', n))}</div>
        <div className="w-[40%]">{right.map((n) => row('r', n))}</div>
      </div>
    </Stage>
  )
}
