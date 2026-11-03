import { useState } from 'react'
import { useAccount } from '../lib/account'
import { PATH } from '../data/course'
import { liveStreak, useProgress } from '../lib/progress'
import { needsHomeScreen } from '../lib/storage'
import { GoogleButton } from './GoogleButton'

// A guest's progress lives only on this device. Twice, at moments when they have something worth keeping, a card offers
// to keep it in an account. It never blocks anything, never comes back after "Not now", and Profile always has the same offer.

const KEY = 'mlh.nudge.v1'
type Moment = 'lesson' | 'streak'

const seen = (): Moment[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}
const markSeen = (m: Moment) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set([...seen(), m])]))
  } catch {
    /* private window: it may show again next visit */
  }
}

/** `quiet`: the learner is on the map, not in a lesson or on its result. */
export function SaveNudge({ quiet }: { quiet: boolean }) {
  const a = useAccount()
  const p = useProgress()
  const [closed, setClosed] = useState<Moment | null>(null)

  const streak = liveStreak(p)
  const lessons = PATH.filter((n) => p.nodes[n.id]).length
  const canSave = a.available && a.google && !a.loading && !a.user && p.welcomed
  // A streak of 3 days is the stronger moment: when it comes, it is offered even if the first-lesson card was.
  const moment: Moment | null = !canSave ? null : streak >= 3 ? 'streak' : lessons >= 1 ? 'lesson' : null

  if (!moment || !quiet || closed === moment || seen().includes(moment)) return null
  const close = () => {
    markSeen(moment)
    setClosed(moment)
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-md px-4 md:bottom-6">
      <div className="card flex flex-col gap-3 p-5 shadow-lg" role="dialog" aria-label="Save your progress">
        <p className="font-black">{moment === 'streak' ? `${streak} days in a row!` : 'First lesson done!'}</p>
        <p className="text-sm text-muted">
          Right now your progress is only on this device. Keep it in an account so a lost phone or cleared browser can’t take it away.
          {needsHomeScreen() && ' On iPhone, you can also tap Share, then “Add to Home Screen”.'}
        </p>
        <GoogleButton onBefore={() => markSeen(moment)} />
        <button type="button" onClick={close} className="text-sm font-bold text-muted">
          Not now
        </button>
      </div>
    </div>
  )
}
