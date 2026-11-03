import { UNITS } from '../data/course'
import { hasContent, provinceOfUnit } from '../data/journey'
import { getProgress, learnedWords, recordAnswer, saveReview, today, type Progress } from './progress'
import { weakestWords } from './lesson'
import { review, State, type Grade, type ReviewEntry } from './srs'

// The review deck: every word from a finished lesson is a card. This works out which cards are due, what a study session
// or a practice round holds, and the statistics (all from the card states and the review log kept in progress.ts).

/** A card that comes back within this long is shown now rather than leaving the learner waiting. */
export const LEARN_AHEAD = 20 * 60_000
/** From this interval on a card counts as mature, like in Anki. */
export const MATURE_DAYS = 21
const DAY = 86_400_000

const startOfDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const endOfDay = (ms: number) => startOfDay(ms) + DAY - 1

export const isLearning = (state: number) => state === State.Learning || state === State.Relearning

export type Due = { learning: number[]; review: number[]; fresh: number[] }

/** What is due now: cards in their first steps, cards whose day has come, and the words that are still new. There is no daily limit. */
/** The words in the review deck: those from finished lessons, plus any that were studied ahead from a whole-unit deck. */
export const deckWords = (p: Progress): number[] => [...new Set([...learnedWords(p), ...Object.keys(p.cards).map(Number)])]

export function dueNow(p: Progress, now = Date.now(), pool = deckWords(p)): Due {
  const inLearning = pool
    .filter((n) => {
      const c = p.cards[n]
      return c && isLearning(c.state) && c.due <= now + LEARN_AHEAD
    })
    .sort((a, b) => p.cards[a].due - p.cards[b].due)
  const review = pool.filter((n) => p.cards[n]?.state === State.Review && p.cards[n].due <= endOfDay(now))
  const fresh = pool.filter((n) => !p.cards[n])
  return { learning: inLearning, review, fresh }
}

/** Answers a card: it is scheduled again (srs.ts) and the answer joins the log. */
export function answerCard(n: number, grade: Grade, src: ReviewEntry['src'] = 'card') {
  const p = getProgress()
  saveReview(n, review(p.cards[n], grade, new Date(), p.retention), grade, src)
}

/** A word answered in a lesson also answers its review card: a miss is a lapse, a hit counts when the card was due. */
export function answerWord(n: number, correct: boolean) {
  recordAnswer(n, correct)
  const card = getProgress().cards[n]
  if (card && (!correct || card.due <= Date.now())) answerCard(n, correct ? 3 : 1, 'lesson')
}

export const dueCount = (d: Due) => d.learning.length + d.review.length + d.fresh.length

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * One study session: the cards in their first steps, then up to `size` more, the most overdue reviews first and new words
 * to fill the rest, in a mixed order. Another session can follow at once with the next ones.
 */
export function buildQueue(p: Progress, d: Due, size: number): number[] {
  const overdue = [...d.review].sort((a, b) => p.cards[a].due - p.cards[b].due)
  return [...d.learning, ...shuffle([...overdue, ...d.fresh].slice(0, size))]
}

/** The words that most need another look, for practice rounds that do not change the schedule. */
export const practiceSet = (p: Progress, size: number, pool = deckWords(p)): number[] => weakestWords(p, pool, size)

/** One row per unit that has words in the deck. */
export function deckRows(p: Progress, now = Date.now()) {
  const learned = new Set(deckWords(p))
  return UNITS.map((unit) => {
    const pool = unit.words.filter((n) => learned.has(n))
    return { unit, cards: pool.length, total: unit.words.length, due: pool.length ? dueCount(dueNow(p, now, pool)) : 0 }
  })
}

/** The units that already have lessons, each as a deck of all its words, whether or not the lessons are done. */
export function wholeUnits(p: Progress, now = Date.now()) {
  const inDeck = new Set(deckWords(p))
  return UNITS.filter((u) => {
    const province = provinceOfUnit(u.id)
    return province && hasContent(province)
  }).map((unit) => ({
    unit,
    words: unit.words,
    inDeck: unit.words.filter((n) => inDeck.has(n)).length,
    due: dueCount(dueNow(p, now, unit.words)),
  }))
}

export type Stats = {
  cards: number
  /** Words in the deck by how well they are known. */
  counts: { fresh: number; learning: number; young: number; mature: number }
  today: { reviews: number; again: number; hard: number; good: number; easy: number }
  /** Share of reviews of known cards answered right in the last 30 days, or null while there are too few. */
  retention: number | null
  /** Reviews per day, oldest first, for the last 28 days. */
  calendar: { day: string; count: number }[]
  /** Reviews due on each of the next 7 days (today first, with what is overdue). */
  forecast: number[]
  /** The cards forgotten most often. */
  hardest: { n: number; lapses: number }[]
}

const MIN_FOR_RETENTION = 5

export function statsOf(p: Progress, now = Date.now()): Stats {
  const pool = deckWords(p)
  const counts = { fresh: 0, learning: 0, young: 0, mature: 0 }
  const forecast = Array<number>(7).fill(0)
  const t0 = startOfDay(now)
  for (const n of pool) {
    const c = p.cards[n]
    if (!c || c.state === State.New) counts.fresh++
    else if (isLearning(c.state)) counts.learning++
    else if (c.scheduledDays >= MATURE_DAYS) counts.mature++
    else counts.young++
    if (c && c.state !== State.New) {
      const day = Math.max(0, Math.floor((startOfDay(c.due) - t0) / DAY))
      if (day < 7) forecast[day]++
    }
  }

  const todays = { reviews: 0, again: 0, hard: 0, good: 0, easy: 0 }
  const perDay = new Map<string, number>()
  let known = 0
  let right = 0
  const since = now - 30 * DAY
  for (const r of p.reviews) {
    const key = today(new Date(r.at))
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
    if (r.at >= t0) {
      todays.reviews++
      todays[(['again', 'hard', 'good', 'easy'] as const)[r.r - 1]]++
    }
    if (r.at >= since && r.s === State.Review) {
      known++
      if (r.r > 1) right++
    }
  }
  const calendar = Array.from({ length: 28 }, (_, i) => {
    const day = today(new Date(t0 - (27 - i) * DAY))
    return { day, count: perDay.get(day) ?? 0 }
  })

  const hardest = pool
    .filter((n) => (p.cards[n]?.lapses ?? 0) > 0)
    .sort((a, b) => p.cards[b].lapses - p.cards[a].lapses || p.cards[b].difficulty - p.cards[a].difficulty)
    .slice(0, 5)
    .map((n) => ({ n, lapses: p.cards[n].lapses }))

  return {
    cards: pool.length,
    counts,
    today: todays,
    retention: known >= MIN_FOR_RETENTION ? Math.round((right / known) * 100) : null,
    calendar,
    forecast,
    hardest,
  }
}
