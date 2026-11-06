import type { ReactNode } from 'react'

/**
 * The frame every exercise shares: one bold instruction and the stage below it. Only the stage changes from one
 * exercise to the next. The exercise carries no label naming its technique: the instruction says what to do.
 */
export function Stage({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {title && <h2 className="text-[28px] leading-tight font-extrabold">{title}</h2>}
      {children}
    </div>
  )
}

/** A word's hanzi set large enough to be the focus of the screen, shrinking for longer words. */
export function BigHanzi({ hanzi }: { hanzi: string }) {
  const n = [...hanzi].length
  const size = n <= 2 ? '8.5rem' : n === 3 ? '6.5rem' : '5rem'
  return (
    <span className="han leading-none font-medium" style={{ fontSize: size }}>
      {hanzi}
    </span>
  )
}
