import type { ReactNode } from 'react'
import { DAILY_GOAL, liveStreak, todayXp, useProgress } from '../lib/progress'
import { IconBrush, IconFlame, IconPath, IconReview, IconStar, IconUser } from './icons'

export type Tab = 'learn' | 'review' | 'write' | 'profile'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'learn', label: 'Aprender', icon: <IconPath /> },
  { id: 'review', label: 'Repasar', icon: <IconReview /> },
  { id: 'write', label: 'Escribir', icon: <IconBrush /> },
  { id: 'profile', label: 'Perfil', icon: <IconUser /> },
]

type Props = { tab: Tab; onTab: (t: Tab) => void; children: ReactNode }

export function Shell({ tab, onTab, children }: Props) {
  const p = useProgress()
  const streak = liveStreak(p)
  const xpToday = todayXp(p)
  const goal = Math.min(1, xpToday / DAILY_GOAL)

  const stats = (
    <div className="flex items-center gap-4 text-[15px] font-black">
      <span className={`flex items-center gap-1 ${streak ? 'text-brand' : 'text-muted/60'}`} title="Días de racha">
        <IconFlame className="h-6 w-6" />
        {streak}
      </span>
      <span className="flex items-center gap-1 text-gold-dark" title="XP total">
        <IconStar className="h-6 w-6 text-gold" />
        {p.xp}
      </span>
      <span className="flex items-center gap-1.5 text-jade-dark" title={`Meta diaria: ${xpToday}/${DAILY_GOAL} XP`}>
        <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-line)" strokeWidth="5" />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="var(--color-jade)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${goal * 88} 88`}
          />
        </svg>
        <span className="text-sm">
          {xpToday}/{DAILY_GOAL}
        </span>
      </span>
    </div>
  )

  return (
    <div className="flex min-h-full">
      {/* Desktop / tablet rail */}
      <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-2 border-r-2 border-line px-4 py-6 md:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-10 w-10" />
          <div className="leading-tight">
            <p className="font-black">Mandarin Hub</p>
            <p className="text-xs font-bold text-muted">HSK 1 · gratis</p>
          </div>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-3 text-[15px] font-extrabold tracking-wide uppercase ${
              tab === t.id ? 'border-sky/60 bg-sky-soft text-sky-dark' : 'border-transparent text-muted hover:bg-line/50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b-2 border-line bg-paper/90 backdrop-blur pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <p className="font-black md:hidden">
              <span className="han text-brand">汉</span> Mandarin Hub
            </p>
            <p className="hidden text-xl font-black md:block">{TABS.find((t) => t.id === tab)?.label}</p>
            {stats}
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-28 md:pb-10">{children}</main>
      </div>

      {/* Phone dock */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-paper md:hidden">
        <div className="mx-auto flex max-w-md justify-around px-2 pt-2 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              aria-label={t.label}
              className={`flex flex-col items-center gap-0.5 rounded-2xl border-2 px-4 py-1.5 text-[11px] font-extrabold ${
                tab === t.id ? 'border-sky/60 bg-sky-soft text-sky-dark' : 'border-transparent text-muted'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
