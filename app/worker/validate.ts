// Checks a progress document before it is stored (see putProgress in index.ts). The shape is the client's `Progress`
// (src/lib/progress.ts). The admin page averages these documents, and D1 reads them with json_each, so what matters here
// is that every field the server reads has the type it is read as, and that no collection can grow without bound.
// The limits are far above what a real learner reaches: a rejected save would stop that learner's sync for good.
// Fields that are missing pass (older saves leave them out and the client fills them in); unknown fields pass untouched.

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const int = (v: unknown, min: number, max: number) => num(v, min, max) && Number.isInteger(v)
const str = (v: unknown, max: number) => typeof v === 'string' && v.length <= max
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

const MS_WEEK = 7 * 86_400_000
const BIG = 1e9

/** The first thing wrong with the document, or null when it is fine. */
export function progressProblem(data: unknown): string | null {
  if (!isObj(data) || data.v !== 1) return 'v'
  const has = (k: string) => data[k] !== undefined

  for (const k of ['xp', 'gems']) if (has(k) && !num(data[k], 0, BIG)) return k
  for (const k of ['modifiedAt', 'epochAt']) if (has(k) && !num(data[k], 0, 1e15)) return k
  for (const k of ['deviceId', 'epoch', 'traveler']) if (has(k) && !str(data[k], 64)) return k
  if (has('createdAt') && !str(data.createdAt, 40)) return 'createdAt'
  if (has('nickname') && !str(data.nickname, 40)) return 'nickname'
  if (has('welcomed') && typeof data.welcomed !== 'boolean') return 'welcomed'
  if (has('scenery') && !['auto', 'day', 'night'].includes(data.scenery as string)) return 'scenery'
  if (has('reviewDay') && data.reviewDay !== null && !str(data.reviewDay, 10)) return 'reviewDay'
  if (has('sessionSize') && !int(data.sessionSize, 1, 500)) return 'sessionSize'
  if (has('retention') && !num(data.retention, 0.5, 0.999)) return 'retention'

  if (has('streak')) {
    const s = data.streak
    if (!isObj(s) || !int(s.count ?? 0, 0, 100_000) || (s.last != null && !(str(s.last, 10) && DAY_KEY.test(s.last as string)))) return 'streak'
  }
  if (has('revealed') && !(Array.isArray(data.revealed) && data.revealed.length <= 200 && data.revealed.every((p) => str(p, 64)))) return 'revealed'

  // Collections keyed by something: how many entries, what the keys look like, and what each value holds.
  const map = (key: string, maxEntries: number, keyOk: (k: string) => boolean, valueOk: (v: unknown) => boolean) => {
    if (!has(key)) return null
    const m = data[key]
    if (!isObj(m)) return key
    const keys = Object.keys(m)
    if (keys.length > maxEntries) return key
    return keys.every((k) => keyOk(k) && valueOk(m[k])) ? null : key
  }
  const anyKey = (k: string) => k.length <= 64
  const wordKey = (k: string) => /^\d{1,6}$/.test(k)

  const mapProblem =
    map('dailyXp', 4000, (k) => DAY_KEY.test(k), (v) => num(v, 0, 1e6)) ??
    map('outfits', 100, anyKey, (v) => str(v, 64)) ??
    map('nodes', 2000, anyKey, (v) => isObj(v) && int(v.completions ?? 0, 0, 1e6) && num(v.bestAccuracy ?? 0, 0, 100) && (v.lastAt === undefined || str(v.lastAt, 40))) ??
    map('words', 20_000, wordKey, (v) => isObj(v) && ['seen', 'correct', 'wrong'].every((f) => int(v[f] ?? 0, 0, 1e7)) && num(v.last ?? 0, 0, 1e15)) ??
    map('chars', 20_000, (k) => k.length >= 1 && k.length <= 8, (v) => isObj(v) && int(v.traced ?? 0, 0, 1e7) && int(v.clean ?? 0, 0, 1e7)) ??
    map('cards', 20_000, wordKey, (v) => isObj(v) && int(v.state, 0, 3) && num(v.due ?? 0, 0, 1e15) && ['stability', 'difficulty', 'scheduledDays', 'learningSteps', 'reps', 'lapses'].every((f) => num(v[f] ?? 0, 0, 1e9)) && (v.last == null || num(v.last, 0, 1e15))) ??
    // The admin page averages and counts these two, so their values are held to exactly what it reads.
    map('ratings', 2000, anyKey, (v) => isObj(v) && int(v.stars, 1, 5) && num(v.at ?? 0, 0, 1e15))
  if (mapProblem) return mapProblem

  const list = (key: string, maxLength: number, itemOk: (v: unknown) => boolean) => {
    if (!has(key)) return null
    const l = data[key]
    return Array.isArray(l) && l.length <= maxLength && l.every(itemOk) ? null : key
  }
  return (
    list('reviews', 3500, (v) => isObj(v) && int(v.n, 0, 1e6) && num(v.at, 0, 1e15) && int(v.r, 1, 4) && int(v.s, 0, 3) && (v.src === 'card' || v.src === 'lesson')) ??
    list(
      'outbox',
      1000,
      (v) =>
        isObj(v) &&
        v.type === 'lesson_completed' &&
        str(v.node, 64) &&
        str(v.at, 40) &&
        num(v.durationMs, 0, MS_WEEK) &&
        ['answers', 'mistakes', 'xp', 'gems'].every((f) => num(v[f] ?? 0, 0, 1e6)) &&
        num(v.accuracy ?? 0, 0, 100),
    )
  )
}
