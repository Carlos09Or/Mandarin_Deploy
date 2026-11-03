import type { Progress } from './progress'

// Two copies of one learner's progress (this device and the account) are merged into one that has the work of both.
// It must give the same result whichever copy is "local", and merging the result again must change nothing, because
// every device runs it and none of them is in charge.

const MAX_REVIEWS = 3000
const MAX_OUTBOX = 200

/** Keeps both sides' keys; where both have one, `pick` decides. */
function byKey<T>(a: Record<string, T>, b: Record<string, T>, pick: (x: T, y: T) => T): Record<string, T> {
  const out: Record<string, T> = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v
  return out
}

const later = (x: string | null, y: string | null) => ((x ?? '') >= (y ?? '') ? x : y)

/** Entries of two logs without repeats, oldest first, keeping the newest `max`. */
function unionLog<T>(a: T[], b: T[], key: (e: T) => string, time: (e: T) => number, max: number): T[] {
  const seen = new Map<string, T>()
  for (const e of [...a, ...b]) seen.set(key(e), e)
  return [...seen.values()].sort((x, y) => time(x) - time(y)).slice(-max)
}

function mergeStreak(a: Progress['streak'], b: Progress['streak']): Progress['streak'] {
  if (a.last === b.last) return { last: a.last, count: Math.max(a.count, b.count) }
  return (a.last ?? '') > (b.last ?? '') ? a : b
}

export function mergeProgress(local: Progress, remote: Progress): Progress {
  // One side was reset after the other's data began: the reset wins and the older data is dropped.
  if (local.epoch !== remote.epoch) {
    const winner = local.epochAt >= remote.epochAt ? local : remote
    return { ...winner, deviceId: local.deviceId }
  }
  // Settings are one person's choices, not counters: the side that was changed last has the current ones.
  const newer = local.modifiedAt >= remote.modifiedAt ? local : remote

  const dailyXp = byKey(local.dailyXp, remote.dailyXp, Math.max)
  const sumXp = Object.values(dailyXp).reduce((a, n) => a + n, 0)

  return {
    ...newer,
    v: 1,
    deviceId: local.deviceId,
    createdAt: local.createdAt < remote.createdAt ? local.createdAt : remote.createdAt,
    modifiedAt: Math.max(local.modifiedAt, remote.modifiedAt),
    // The name last chosen counts, but a device that never asked for one (empty) never erases the other's.
    nickname: newer.nickname || (newer === local ? remote : local).nickname,
    welcomed: local.welcomed || remote.welcomed,
    // Counters: if two devices were used on the same day offline, the larger of each is kept rather than a sum that
    // would count the shared past twice.
    xp: Math.max(local.xp, remote.xp, sumXp),
    gems: Math.max(local.gems, remote.gems),
    dailyXp,
    streak: mergeStreak(local.streak, remote.streak),
    revealed: [...new Set([...local.revealed, ...remote.revealed])],
    nodes: byKey(local.nodes, remote.nodes, (x, y) => ({
      completions: Math.max(x.completions, y.completions),
      bestAccuracy: Math.max(x.bestAccuracy, y.bestAccuracy),
      lastAt: x.lastAt >= y.lastAt ? x.lastAt : y.lastAt,
    })),
    // The copy with more answers behind it is the fuller history.
    words: byKey(local.words as Record<string, Progress['words'][number]>, remote.words as Record<string, Progress['words'][number]>, (x, y) =>
      x.seen !== y.seen ? (x.seen > y.seen ? x : y) : x.last >= y.last ? x : y,
    ),
    chars: byKey(local.chars, remote.chars, (x, y) => ({ traced: Math.max(x.traced, y.traced), clean: Math.max(x.clean, y.clean) })),
    // A card's schedule is its last review: whichever device reviewed it most recently has the schedule that counts.
    cards: byKey(local.cards as Record<string, Progress['cards'][number]>, remote.cards as Record<string, Progress['cards'][number]>, (x, y) =>
      (x.last ?? 0) !== (y.last ?? 0) ? ((x.last ?? 0) > (y.last ?? 0) ? x : y) : x.reps >= y.reps ? x : y,
    ),
    reviews: unionLog(local.reviews, remote.reviews, (e) => `${e.n}:${e.at}:${e.src}`, (e) => e.at, MAX_REVIEWS),
    outbox: unionLog(local.outbox, remote.outbox, (e) => `${e.node}:${e.at}`, (e) => Date.parse(e.at), MAX_OUTBOX),
    reviewDay: later(local.reviewDay, remote.reviewDay),
    ratings: byKey(local.ratings, remote.ratings, (x, y) => (x.at >= y.at ? x : y)),
  }
}
