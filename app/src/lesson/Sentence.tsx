import { motion } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { tokenPinyin, word } from '../data/course'
import { speak } from '../lib/audio'
import type { Exercise } from '../lib/lesson'
import { AudioButton } from '../components/AudioButton'
import { Stage } from './Stage'

type Props = {
  ex: Extract<Exercise, { kind: 'sentence' }>
  /** Indexes into `ex.bank`, in the order the learner placed them. */
  order: number[]
  onOrder: (order: number[]) => void
  revealed: boolean
}

type Drag = { id: number; x: number; y: number; dx: number; dy: number; w: number; h: number }

const DRAG_THRESHOLD = 6

export function Sentence({ ex, order, onOrder, revealed }: Props) {
  const w = word(ex.word)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [caret, setCaret] = useState<{ x: number; y: number; h: number } | null>(null)
  const answerZone = useRef<HTMLDivElement>(null)
  const bankZone = useRef<HTMLDivElement>(null)
  const tiles = useRef(new Map<number, HTMLElement>())

  useEffect(() => {
    const t = setTimeout(() => speak(w.example.hanzi), 300)
    return () => clearTimeout(t)
  }, [w.example.hanzi])

  const place = (id: number) => {
    speak(ex.bank[id])
    onOrder([...order, id])
  }
  const remove = (id: number) => onOrder(order.filter((x) => x !== id))

  const inside = (el: HTMLElement | null, x: number, y: number, pad = 24) => {
    if (!el) return false
    const r = el.getBoundingClientRect()
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad
  }

  /** Where a tile dropped at (x, y) lands in the answer, ignoring the tile being dragged. */
  const insertIndex = (x: number, y: number, dragged: number) => {
    const placed = order.filter((id) => id !== dragged)
    for (let i = 0; i < placed.length; i++) {
      const r = tiles.current.get(placed[i])?.getBoundingClientRect()
      if (!r) continue
      if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) return { index: i, rect: r, before: true }
    }
    const last = placed.length ? tiles.current.get(placed[placed.length - 1])?.getBoundingClientRect() : undefined
    return { index: placed.length, rect: last, before: false }
  }

  const caretFor = (x: number, y: number, dragged: number) => {
    if (!inside(answerZone.current, x, y)) return null
    const { rect, before } = insertIndex(x, y, dragged)
    if (!rect) {
      const z = answerZone.current!.getBoundingClientRect()
      return { x: z.left + 6, y: z.top + 10, h: 56 }
    }
    return { x: before ? rect.left - 5 : rect.right + 3, y: rect.top, h: rect.height }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, id: number) => {
    if (revealed || e.button !== 0) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY }
    let dragging = false

    const move = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_THRESHOLD) return
      dragging = true
      ev.preventDefault()
      setDrag({ id, x: ev.clientX, y: ev.clientY, dx: start.x - r.left, dy: start.y - r.top, w: r.width, h: r.height })
      setCaret(caretFor(ev.clientX, ev.clientY, id))
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      setDrag(null)
      setCaret(null)
      const placed = order.includes(id)
      if (!dragging) {
        if (placed) remove(id)
        else place(id)
        return
      }
      if (inside(answerZone.current, ev.clientX, ev.clientY)) {
        const { index } = insertIndex(ev.clientX, ev.clientY, id)
        const next = order.filter((x) => x !== id)
        next.splice(index, 0, id)
        if (!placed) speak(ex.bank[id])
        onOrder(next)
      } else if (placed && inside(bankZone.current, ev.clientX, ev.clientY, 40)) {
        remove(id)
      }
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const correct = revealed && order.map((i) => ex.bank[i]).join('') === ex.tokens.join('')

  const tile = (id: number, where: 'answer' | 'bank') => (
    <motion.button
      layout
      layoutId={`tile-${id}`}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      key={id}
      ref={(el: HTMLButtonElement | null) => {
        if (where === 'answer') {
          if (el) tiles.current.set(id, el)
          else tiles.current.delete(id)
        }
      }}
      type="button"
      disabled={revealed}
      onPointerDown={(e) => onPointerDown(e, id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          if (where === 'answer') remove(id)
          else place(id)
        }
      }}
      className={`tile flex touch-none flex-col items-center px-3 pt-1.5 pb-1 select-none ${
        drag?.id === id ? 'opacity-30' : ''
      } ${revealed && where === 'answer' ? (correct ? 'tile-correct' : 'tile-wrong') : ''}`}
    >
      <span className="han text-2xl leading-tight">{ex.bank[id]}</span>
      <span className="text-[11px] font-bold text-muted">{tokenPinyin(ex.bank[id])}</span>
    </motion.button>
  )

  // One dashed slot per word still to place, so the learner sees how long the sentence is.
  const empty = Math.max(0, ex.tokens.length - order.length)

  return (
    <Stage eyebrow="Build a sentence" title={w.example.en}>
      <div className="-mt-2 flex items-center gap-3">
        <AudioButton text={w.example.hanzi} size="sm" />
        <AudioButton text={w.example.hanzi} size="sm" slow />
      </div>

      <div ref={answerZone} className="flex min-h-[72px] flex-wrap content-start gap-2 pt-2">
        {order.map((id) => tile(id, 'answer'))}
        {Array.from({ length: empty }, (_, i) => (
          <span key={`slot-${i}`} className="h-[62px] w-[76px] rounded-2xl border-2 border-dashed border-line-dark bg-card/60" />
        ))}
      </div>

      <div className="flex-1" />

      {/* Word bank: used tiles leave their outline behind so nothing jumps around */}
      <div ref={bankZone} className="flex flex-wrap justify-center gap-2 rounded-3xl bg-line/60 p-3">
        {ex.bank.map((token, id) =>
          order.includes(id) ? (
            <span key={id} className="flex flex-col items-center rounded-2xl bg-line px-3 pt-1.5 pb-1 text-transparent select-none">
              <span className="han text-2xl leading-tight">{token}</span>
              <span className="text-[11px]">{tokenPinyin(token)}</span>
            </span>
          ) : (
            tile(id, 'bank')
          ),
        )}
      </div>

      {drag && (
        <div
          className="tile pointer-events-none fixed z-50 flex flex-col items-center px-3 pt-1.5 pb-1 shadow-xl"
          style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w, height: drag.h, transform: 'rotate(-3deg) scale(1.06)' }}
        >
          <span className="han text-2xl leading-tight">{ex.bank[drag.id]}</span>
          <span className="text-[11px] font-bold text-muted">{tokenPinyin(ex.bank[drag.id])}</span>
        </div>
      )}
      {caret && (
        <div
          className="pointer-events-none fixed z-40 w-1 rounded-full bg-jade"
          style={{ left: caret.x, top: caret.y, height: caret.h }}
        />
      )}
    </Stage>
  )
}
