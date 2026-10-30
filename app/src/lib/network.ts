// How much the connection can take. Downloads nobody has asked for yet (the rest of the pictures, voice clips for the
// lesson about to open) only run when it can afford them; on a poor one the app fetches only what is on screen.

type Connection = { saveData?: boolean; effectiveType?: string }
const connection = () => (navigator as Navigator & { connection?: Connection }).connection

/**
 * Set when the first pictures came in slowly: the line is slow whatever the browser says about it (Safari says nothing).
 * Remembered for a few hours, because the next visit finds those pictures already on the device and has nothing to measure.
 */
const SLOW_KEY = 'mj.slow'
const SLOW_FOR = 3 * 3600_000
let measuredSlow = (() => {
  try {
    return Date.now() - Number(localStorage.getItem(SLOW_KEY) ?? 0) < SLOW_FOR
  } catch {
    return false
  }
})()
export const markSlow = () => {
  measuredSlow = true
  try {
    localStorage.setItem(SLOW_KEY, String(Date.now()))
  } catch {
    /* private window: slow for this visit only */
  }
}

export const saveData = () => !!connection()?.saveData
/** A line to be careful with: data saver on, a 3G or slower connection, or one that measured slow. */
export const lowBandwidth = () => measuredSlow || saveData() || ['slow-2g', '2g', '3g'].includes(connection()?.effectiveType ?? '')
/** Fine to fetch things in the background: not slow, no data saver and, when the browser reports it, a 4g connection. */
export const canWarm = () => !measuredSlow && !saveData() && (!connection()?.effectiveType || connection()!.effectiveType === '4g')
