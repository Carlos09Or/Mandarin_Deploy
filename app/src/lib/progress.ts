import { useSyncExternalStore } from 'react'
import { PATH } from '../data/course'
import type { FriendId, OutfitSetting } from '../data/friends'
import type { CardState, ReviewEntry } from './srs'

// Local-first progress. Everything is saved on the device first and works offline. Signed-in learners also have it
// synced to their account in the background (account.ts), merging what several devices did (merge.ts).

export type WordStat = { seen: number; correct: number; wrong: number; last: number }
export type NodeResult = { completions: number; bestAccuracy: number; lastAt: string }
export type LessonEvent = {
  type: 'lesson_completed'
  node: string
  at: string
  durationMs: number
  answers: number
  mistakes: number
  accuracy: number
  xp: number
  gems: number
}

/** Why gems were earned, shown on the lesson summary. */
export type Reward = {
  xp: number
  gems: number
  parts: { label: string; gems: number }[]
  /** Streak after this lesson, and whether this lesson extended it. */
  streak: number
  streakUp: boolean
}

export type Scenery = 'auto' | 'day' | 'night'

export type Progress = {
  v: 1
  deviceId: string
  createdAt: string
  /** What the learner asked to be called. Empty until they have chosen one. */
  nickname: string
  /** The welcome screens (name, then guest or account) have been gone through, on this device or on another one of the account. */
  welcomed: boolean
  xp: number
  /** Reward currency. What it buys is up to each teacher (extra quiz points, etc.). */
  gems: number
  /** Outfit setting per character; missing means 'auto'. */
  outfits: Partial<Record<FriendId, OutfitSetting>>
  /** The character that marks where the learner is on the map and drives the train. */
  traveler: FriendId
  /** Provinces whose fog has already been cleared on the map. */
  revealed: string[]
  /** Day or night scenery on the map and routes; 'auto' follows the clock. */
  scenery: Scenery
  dailyXp: Record<string, number>
  streak: { count: number; last: string | null }
  nodes: Record<string, NodeResult>
  words: Record<number, WordStat>
  chars: Record<string, { traced: number; clean: number }>
  outbox: LessonEvent[]
  /** Spaced-repetition state of every word that has been through the review cards (a word without one is still new). */
  cards: Record<number, CardState>
  /** Every answer on a card or in a lesson, newest last: the statistics are worked out from it. */
  reviews: ReviewEntry[]
  /** Cards in one study session (there is no daily limit: sessions can follow each other), and the share of cards the learner wants to still remember when they come back. */
  sessionSize: number
  retention: number
  /** The day the gems for finishing the review were given, so they are given once a day. */
  reviewDay: string | null
  /** The stars (1 to 5) the learner gave a lesson when they finished it; the admin page averages them. */
  ratings: Record<string, { stars: number; at: number }>
  /** When anything was last changed here (not when a merge brought changes in): it tells the sync what is still to be uploaded. */
  modifiedAt: number
  /** Which "life" of the data this is. Resetting starts a new one; a device with an older one is overruled when it syncs (see merge.ts). */
  epoch: string
  epochAt: number
}

const KEY = 'mlh.progress.v1'
export const DAILY_GOAL = 30
export const GEMS = { lesson: 5, perfect: 5, dailyGoal: 10, review: 5 }
const MAX_REVIEWS = 3000
/** Everything that has never been reset shares this epoch, so devices that never met still merge. */
const INITIAL_EPOCH = 'initial'
const DEFAULT_RETENTION = 0.9

const today = (d = new Date()) => d.toLocaleDateString('en-CA') // YYYY-MM-DD in local time

function fresh(): Progress {
  return {
    v: 1,
    deviceId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    nickname: '',
    welcomed: false,
    xp: 0,
    gems: 0,
    outfits: {},
    traveler: 'wawa',
    revealed: [],
    scenery: 'auto',
    dailyXp: {},
    streak: { count: 0, last: null },
    nodes: {},
    words: {},
    chars: {},
    outbox: [],
    cards: {},
    reviews: [],
    sessionSize: 15,
    retention: DEFAULT_RETENTION,
    reviewDay: null,
    ratings: {},
    modifiedAt: 0,
    epoch: INITIAL_EPOCH,
    epochAt: 0,
  }
}

/** Fills in what a save from an older version of the app, or from the server, doesn't have. */
export const revive = (data: Partial<Progress>): Progress => ({
  ...fresh(),
  ...data,
  // Learners who started before the welcome screens existed have been welcomed already.
  welcomed: data.welcomed ?? (data.modifiedAt ?? 0) > 0,
})

function load(): Progress {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      const data = JSON.parse(saved)
      // Older saves kept Wāwa's outfit in `look`.
      if (data.look && !data.outfits) data.outfits = { wawa: data.look }
      delete data.look
      return revive(data)
    }
  } catch {
    /* private mode or corrupt data: start fresh */
  }
  return fresh()
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: Progress, stamp = true) {
  state = stamp ? { ...next, modifiedAt: Date.now() } : next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l())
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    subscribeProgress,
    () => state,
  )
}
export const getProgress = () => state
export function subscribeProgress(l: () => void) {
  listeners.add(l)
  return () => void listeners.delete(l)
}
/** Puts in progress that came from a sync. Its modifiedAt is kept: it is not a change made on this device. */
export const replaceProgress = (next: Progress) => commit(next, false)

export function recordAnswer(n: number, correct: boolean) {
  const prev = state.words[n] ?? { seen: 0, correct: 0, wrong: 0, last: 0 }
  commit({
    ...state,
    words: {
      ...state.words,
      [n]: {
        seen: prev.seen + 1,
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1),
        last: Date.now(),
      },
    },
  })
}

/** Keeps a card's new schedule and adds the answer (1 again … 4 easy) to the log. The schedule itself is worked out in cards.ts. */
export function saveReview(n: number, next: CardState, grade: number, src: ReviewEntry['src']) {
  commit({
    ...state,
    cards: { ...state.cards, [n]: next },
    reviews: [...state.reviews.slice(1 - MAX_REVIEWS), { n, at: Date.now(), r: grade, s: state.cards[n]?.state ?? 0, src }],
  })
}

/** Gives the day's gems for finishing the review; only the first time each day. Returns the gems given. */
export function finishReviewDay() {
  const t = today()
  if (state.reviewDay === t) return 0
  commit({ ...state, gems: state.gems + GEMS.review, reviewDay: t })
  return GEMS.review
}

export function setStudyOptions(o: { sessionSize?: number; retention?: number }) {
  commit({ ...state, ...o })
}

export function recordTrace(char: string, mistakes: number) {
  const prev = state.chars[char] ?? { traced: 0, clean: 0 }
  commit({
    ...state,
    chars: { ...state.chars, [char]: { traced: prev.traced + 1, clean: prev.clean + (mistakes === 0 ? 1 : 0) } },
  })
}

function nextStreak(s: Progress['streak']): Progress['streak'] {
  const t = today()
  if (s.last === t) return s
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return { count: s.last === today(yesterday) ? s.count + 1 : 1, last: t }
}

/** Saves a finished lesson and returns the XP and gems it earned. */
export function completeNode(
  nodeId: string | null,
  summary: { durationMs: number; answers: number; mistakes: number },
): Reward {
  const accuracy = summary.answers ? Math.round(((summary.answers - summary.mistakes) / summary.answers) * 100) : 100
  const perfect = summary.mistakes === 0
  const xp = 10 + (perfect ? 5 : 0)
  const t = today()
  const before = state.dailyXp[t] ?? 0
  const parts = [{ label: 'Lesson complete', gems: GEMS.lesson }]
  if (perfect) parts.push({ label: 'No mistakes', gems: GEMS.perfect })
  if (before < DAILY_GOAL && before + xp >= DAILY_GOAL) parts.push({ label: 'Daily goal', gems: GEMS.dailyGoal })
  const gems = parts.reduce((a, p) => a + p.gems, 0)
  const streak = nextStreak(state.streak)
  const streakUp = state.streak.last !== t
  const nodes = { ...state.nodes }
  if (nodeId) {
    const prev = nodes[nodeId]
    nodes[nodeId] = {
      completions: (prev?.completions ?? 0) + 1,
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy),
      lastAt: new Date().toISOString(),
    }
  }
  commit({
    ...state,
    xp: state.xp + xp,
    gems: state.gems + gems,
    dailyXp: { ...state.dailyXp, [t]: (state.dailyXp[t] ?? 0) + xp },
    streak,
    nodes,
    outbox: [
      ...state.outbox,
      { type: 'lesson_completed', node: nodeId ?? 'practice', at: new Date().toISOString(), ...summary, accuracy, xp, gems },
    ],
  })
  return { xp, gems, parts, streak: streak.count, streakUp }
}

export function setOutfit(id: FriendId, outfit: OutfitSetting) {
  commit({ ...state, outfits: { ...state.outfits, [id]: outfit } })
}

export function setTraveler(id: FriendId) {
  commit({ ...state, traveler: id })
}

/** Keeps the stars given to a lesson; tapping again changes them. */
export function setRating(node: string, stars: number) {
  commit({ ...state, ratings: { ...state.ratings, [node]: { stars, at: Date.now() } } })
}

export const NICKNAME_MAX = 20

/** Keeps the name the learner chose (spaces trimmed). An empty name is ignored: there is always one once chosen. */
export function setNickname(name: string) {
  const nickname = name.trim().slice(0, NICKNAME_MAX)
  if (nickname && nickname !== state.nickname) commit({ ...state, nickname })
}

/** The welcome screens are done: the learner has a name and has chosen to play as a guest or to sign in. */
export function finishWelcome(name: string) {
  commit({ ...state, nickname: name.trim().slice(0, NICKNAME_MAX) || state.nickname, welcomed: true })
}

/** Puts in progress from a backup file, already merged with what is here. Unlike a sync, this is a change made on this device. */
export const importProgress = (next: Progress) => commit(next)

export function setScenery(scenery: Scenery) {
  commit({ ...state, scenery })
}

export function markRevealed(province: string) {
  if (!state.revealed.includes(province)) commit({ ...state, revealed: [...state.revealed, province] })
}

/** Erases everything and starts a new epoch, so a synced account is erased too instead of bringing the old progress back. */
export function resetProgress() {
  commit({
    ...fresh(),
    deviceId: state.deviceId,
    nickname: state.nickname,
    welcomed: state.welcomed,
    epoch: crypto.randomUUID(),
    epochAt: Date.now(),
  })
}

/** Empties this device without touching any account (when signing out); it merges into an account like a new device. */
export function wipeDevice() {
  commit({ ...fresh(), deviceId: state.deviceId }, false)
}

// ---- Derived helpers ----

/** Index in PATH of the first node not completed yet (PATH.length when all are done). */
export const currentIndex = (p: Progress) => {
  const i = PATH.findIndex((node) => !p.nodes[node.id])
  return i === -1 ? PATH.length : i
}

/** Words introduced in completed lessons. */
export const learnedWords = (p: Progress) => [
  ...new Set(PATH.filter((node) => node.kind === 'lesson' && p.nodes[node.id]).flatMap((node) => node.words)),
]

/** The streak only counts if the learner practiced today or yesterday. */
export const liveStreak = (p: Progress) => {
  if (!p.streak.last) return 0
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return p.streak.last === today() || p.streak.last === today(y) ? p.streak.count : 0
}

export const todayXp = (p: Progress) => p.dailyXp[today()] ?? 0

/** Night scenery: chosen, or on 'auto' between 7 pm and 6 am. */
export const isNight = (p: Progress) => {
  if (p.scenery !== 'auto') return p.scenery === 'night'
  const h = new Date().getHours()
  return h < 6 || h >= 19
}
export { today }
