import { returningFromGoogle, useAccount } from '../lib/account'
import { useProgress } from '../lib/progress'

/**
 * What stands over the map before the learner is welcomed: the welcome screens ('open'), or a blank page ('waiting') while a
 * sign-in is being finished or a signed-in learner's progress is arriving (it may already be welcomed, so the screens must
 * not flash). It is up from the start, under the loading screen, so the map never shows through between the two.
 */
export function useWelcomeState(): 'closed' | 'waiting' | 'open' {
  const a = useAccount()
  const p = useProgress()
  if (p.welcomed) return 'closed'
  const waiting = (returningFromGoogle && a.loading) || (a.user !== null && (a.loading || a.sync === 'syncing'))
  return waiting ? 'waiting' : 'open'
}
