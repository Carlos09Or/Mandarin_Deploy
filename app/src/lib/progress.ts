import { useSyncExternalStore } from 'react'
import { PATH } from '../data/course'

// Local-first progress. Everything is saved on the device first; `outbox` holds the
// events that a future sync (Supabase) will upload, so nothing is lost while offline.

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
export type Reward = { xp: number; gems: number; parts: { label: string; gems: number }[] }

export type Progress = {
  v: 1
  deviceId: string
  createdAt: string
  xp: number
  /** Reward currency. What it buys is up to each teacher (extra quiz points, etc.). */
  gems: number
  dailyXp: Record<string, number>
  streak: { count: number; last: string | null }
  nodes: Record<string, NodeResult>
  words: Record<number, WordStat>
  chars: Record<string, { traced: number; clean: number }>
  outbox: LessonEvent[]
}

const KEY = 'mlh.progress.v1'
export const DAILY_GOAL = 30
export const GEMS = { lesson: 5, perfect: 5, dailyGoal: 10 }

const today = (d = new Date()) => d.toLocaleDateString('en-CA') // YYYY-MM-DD in local time

function fresh(): Progress {
  return {
    v: 1,
    deviceId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    xp: 0,
    gems: 0,
    dailyXp: {},
    streak: { count: 0, last: null },
    nodes: {},
    words: {},
    chars: {},
    outbox: [],
  }
}

function load(): Progress {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return { ...fresh(), ...JSON.parse(saved) }
  } catch {
    /* private mode or corrupt data: start fresh */
  }
  return fresh()
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: Progress) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l())
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
export const getProgress = () => state

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
  const parts = [{ label: 'Lección completada', gems: GEMS.lesson }]
  if (perfect) parts.push({ label: 'Sin errores', gems: GEMS.perfect })
  if (before < DAILY_GOAL && before + xp >= DAILY_GOAL) parts.push({ label: 'Meta diaria', gems: GEMS.dailyGoal })
  const gems = parts.reduce((a, p) => a + p.gems, 0)
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
    streak: nextStreak(state.streak),
    nodes,
    outbox: [
      ...state.outbox,
      { type: 'lesson_completed', node: nodeId ?? 'practice', at: new Date().toISOString(), ...summary, accuracy, xp, gems },
    ],
  })
  return { xp, gems, parts }
}

export function resetProgress() {
  commit({ ...fresh(), deviceId: state.deviceId })
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
export { today }
