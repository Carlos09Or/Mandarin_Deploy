import { returningFromGoogle, useAccount } from '../lib/account'
import { useProgress } from '../lib/progress'

/** Whether the welcome screens should be up: not while a sign-in is being finished or a signed-in learner's progress is arriving. */
export function useWelcomeOpen(loaded: boolean) {
  const a = useAccount()
  const p = useProgress()
  const waiting = (returningFromGoogle && a.loading) || (a.user !== null && (a.loading || a.sync === 'syncing'))
  return loaded && !p.welcomed && !waiting
}
