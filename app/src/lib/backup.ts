import { progressProblem } from '../../worker/validate'
import { mergeProgress } from './merge'
import { getProgress, importProgress, revive, today, type Progress } from './progress'

// A copy of the progress as a file, and putting one back. This is how a guest (no account) can keep their progress
// safe from a lost phone or cleared browser data.

export function downloadProgress() {
  const blob = new Blob([JSON.stringify(getProgress(), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `mandarin-progress-${today()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Reads a backup file and merges it into this device's progress (nothing here is lost). Says whether it worked. */
export async function restoreProgress(file: File): Promise<'ok' | 'bad'> {
  try {
    if (file.size > 8_000_000) return 'bad'
    const data = JSON.parse(await file.text()) as Partial<Progress>
    // The same check the server makes, so a file that would stop the account from syncing is turned away here.
    if (progressProblem(data)) return 'bad'
    const here = getProgress()
    // The backup joins this device's current life of the data, even if it was reset since the backup was made.
    const backup = revive({ ...data, epoch: here.epoch, epochAt: here.epochAt })
    importProgress({ ...mergeProgress(here, backup), welcomed: true })
    return 'ok'
  } catch {
    return 'bad'
  }
}
