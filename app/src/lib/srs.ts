import { createEmptyCard, fsrs, generatorParameters, State, type Card, type FSRS, type Grade } from 'ts-fsrs'

// Spaced repetition for the review cards, scheduled with FSRS (ts-fsrs): every card keeps how stable the memory of it is and
// how hard it is for this learner, and comes back on the day the chance of recalling it falls to `retention`.
// This file only schedules; which cards are due and the statistics are in cards.ts.

/** What is kept for a card that has been seen. A word without one is still new. Dates are epoch milliseconds. */
export type CardState = {
  due: number
  stability: number
  difficulty: number
  scheduledDays: number
  learningSteps: number
  reps: number
  lapses: number
  /** 0 new, 1 learning, 2 review, 3 relearning (ts-fsrs `State`). */
  state: number
  last: number | null
}

/** One answer. `r` is the button (1 again, 2 hard, 3 good, 4 easy), `s` the card's state before it was answered. */
export type ReviewEntry = { n: number; at: number; r: number; s: number; src: 'card' | 'lesson' }

export { State }
export type { Grade }

const schedulers = new Map<number, FSRS>()
const schedulerFor = (retention: number) => {
  let f = schedulers.get(retention)
  if (!f) {
    f = fsrs(generatorParameters({ request_retention: retention, enable_fuzz: true }))
    schedulers.set(retention, f)
  }
  return f
}

const toCard = (c: CardState | undefined, now: Date): Card =>
  c
    ? {
        due: new Date(c.due),
        stability: c.stability,
        difficulty: c.difficulty,
        elapsed_days: 0,
        scheduled_days: c.scheduledDays,
        learning_steps: c.learningSteps,
        reps: c.reps,
        lapses: c.lapses,
        state: c.state,
        last_review: c.last == null ? undefined : new Date(c.last),
      }
    : createEmptyCard(now)

const fromCard = (c: Card): CardState => ({
  due: c.due.getTime(),
  stability: c.stability,
  difficulty: c.difficulty,
  scheduledDays: c.scheduled_days,
  learningSteps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  last: c.last_review ? c.last_review.getTime() : null,
})

/** The card after it was answered with `grade` (1 again … 4 easy) at `now`. */
export function review(c: CardState | undefined, grade: Grade, now: Date, retention: number): CardState {
  return fromCard(schedulerFor(retention).next(toCard(c, now), now, grade).card)
}

/** "1m", "10m", "3h", "4d", "2.5mo", "1.2y": when the card would come back. */
export function intervalLabel(ms: number) {
  const min = Math.max(1, Math.round(ms / 60_000))
  if (min < 60) return `${min}m`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.round(ms / 86_400_000)
  if (d < 30) return `${d}d`
  if (d < 365) return `${Math.round((d / 30) * 10) / 10}mo`.replace('.0mo', 'mo')
  return `${Math.round((d / 365) * 10) / 10}y`.replace('.0y', 'y')
}

/** What each button would schedule, for the labels under them. */
export function previewLabels(c: CardState | undefined, now: Date, retention: number): Record<1 | 2 | 3 | 4, string> {
  const rec = schedulerFor(retention).repeat(toCard(c, now), now)
  const label = (g: Grade) => intervalLabel(rec[g].card.due.getTime() - now.getTime())
  return { 1: label(1), 2: label(2), 3: label(3), 4: label(4) }
}
