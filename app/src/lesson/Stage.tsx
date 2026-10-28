import type { ReactNode } from 'react'

/**
 * The frame every exercise shares: a small label saying what kind of exercise it is, one bold
 * instruction, and the stage below it. Only the stage changes from one exercise to the next.
 */
export function Stage({ eyebrow, title, children }: { eyebrow: string; title?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col gap-6">
      <div>
        <p className="text-xs font-extrabold tracking-[0.18em] text-muted uppercase">{eyebrow}</p>
        {title && <h2 className="mt-2 text-[28px] leading-tight font-extrabold">{title}</h2>}
      </div>
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
