// How much the connection can take. Downloads nobody has asked for yet (the rest of the pictures, voice clips for the
// lesson about to open) only run when it can afford them; on a poor one the app fetches only what is on screen.

type Connection = { saveData?: boolean; effectiveType?: string }
const connection = () => (navigator as Navigator & { connection?: Connection }).connection

/** Set when the first pictures took long to arrive: the line is slow whatever the browser says about it (Safari says nothing). */
let measuredSlow = false
export const markSlow = () => (measuredSlow = true)

export const saveData = () => !!connection()?.saveData
/** A line to be careful with: data saver on, a 3G or slower connection, or one that measured slow. */
export const lowBandwidth = () => measuredSlow || saveData() || ['slow-2g', '2g', '3g'].includes(connection()?.effectiveType ?? '')
/** Fine to fetch things in the background: not slow, no data saver and, when the browser reports it, a 4g connection. */
export const canWarm = () => !measuredSlow && !saveData() && (!connection()?.effectiveType || connection()!.effectiveType === '4g')
