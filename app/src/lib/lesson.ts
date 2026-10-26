import { CHARS, PATH, UNITS, charsOf, plainPinyin, word, type PathNode } from '../data/course'
import type { Progress } from './progress'

// A lesson mixes skills the way a class would: meet a word, recognise it, hear it,
// produce it, then write one of its characters. Earlier words come back for review.

export type ChoicePrompt = 'hanzi-es' | 'es-hanzi' | 'audio-hanzi' | 'hanzi-pinyin'
export type Exercise =
  | { kind: 'intro'; word: number }
  | { kind: 'choice'; prompt: ChoicePrompt; word: number; options: number[] }
  | { kind: 'match'; words: number[] }
  | { kind: 'trace'; char: string; word: number; guided: boolean }

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const unitWords = (n: number) => UNITS.find((u) => u.words.includes(n))?.words ?? []

/** Three wrong options that can't be confused with the answer for this prompt. */
function distractors(target: number, prompt: ChoicePrompt): number[] {
  const t = word(target)
  const clash = (n: number) => {
    const w = word(n)
    if (n === target || w.hanzi === t.hanzi) return true
    if (prompt === 'hanzi-es' || prompt === 'es-hanzi') return w.es === t.es
    // Homophones like 他/她 would make listening and pinyin questions unanswerable.
    return plainPinyin(w.pinyin) === plainPinyin(t.pinyin)
  }
  const near = shuffle(unitWords(target).filter((n) => !clash(n)))
  const far = shuffle(UNITS.flatMap((u) => u.words).filter((n) => !clash(n)))
  return [...new Set([...near, ...far])].slice(0, 3)
}

export function choice(n: number, prompt: ChoicePrompt): Exercise {
  return { kind: 'choice', prompt, word: n, options: shuffle([n, ...distractors(n, prompt)]) }
}

const ROTATION: ChoicePrompt[] = ['es-hanzi', 'audio-hanzi', 'hanzi-pinyin']

/** Learned words that most need another look: often missed, or not seen for a while. */
export function weakestWords(p: Progress, pool: number[], count: number): number[] {
  const now = Date.now()
  const score = (n: number) => {
    const s = p.words[n]
    if (!s) return 1
    const misses = (s.wrong + 1) / (s.correct + s.wrong + 2)
    const days = (now - s.last) / 86_400_000
    return misses + Math.min(days, 14) / 14
  }
  return shuffle(pool)
    .sort((a, b) => score(b) - score(a))
    .slice(0, count)
}

/** Characters to trace: ones never traced first, simplest-looking words first. */
function charsToTrace(words: number[], p: Progress, count: number) {
  const all = words.flatMap((n) => charsOf(word(n).hanzi).map((char) => ({ char, word: n })))
  const unique = [...new Map(all.map((c) => [c.char, c])).values()]
  return unique
    .sort((a, b) => (p.chars[a.char]?.traced ?? 0) - (p.chars[b.char]?.traced ?? 0) || (CHARS[a.char] ? -1 : 1))
    .slice(0, count)
}

function lessonExercises(node: PathNode, p: Progress): Exercise[] {
  const fresh = node.words
  const seq: Exercise[] = []
  for (const n of fresh) {
    seq.push({ kind: 'intro', word: n })
    seq.push(choice(n, 'hanzi-es'))
  }
  seq.push({ kind: 'match', words: fresh })

  const before = PATH.slice(0, PATH.indexOf(node)).filter((x) => x.kind === 'lesson').flatMap((x) => x.words)
  const review = weakestWords(p, before, 2)
  const practice = shuffle([...fresh, ...review]).map((n, i) => choice(n, ROTATION[i % ROTATION.length]))
  seq.push(...practice)

  for (const t of charsToTrace(fresh, p, 1)) {
    seq.push({ kind: 'trace', char: t.char, word: t.word, guided: !p.chars[t.char] })
  }
  return seq
}

function reviewExercises(pool: number[], p: Progress, size: number): Exercise[] {
  const picked = weakestWords(p, pool, size)
  const seq: Exercise[] = picked.map((n, i) => choice(n, (['hanzi-es', ...ROTATION] as ChoicePrompt[])[i % 4]))
  if (picked.length >= 5) seq.splice(Math.min(4, seq.length), 0, { kind: 'match', words: picked.slice(0, 5) })
  for (const t of charsToTrace(picked, p, 2)) seq.push({ kind: 'trace', char: t.char, word: t.word, guided: false })
  return seq
}

export function buildNode(node: PathNode, p: Progress): Exercise[] {
  return node.kind === 'lesson' ? lessonExercises(node, p) : reviewExercises(node.words, p, 12)
}

export const buildReview = (pool: number[], p: Progress) => reviewExercises(pool, p, 10)

/** Writing drill for one character: trace it, then write it twice from memory. */
export const buildWriting = (char: string, n: number): Exercise[] => [
  { kind: 'trace', char, word: n, guided: true },
  { kind: 'trace', char, word: n, guided: false },
  { kind: 'trace', char, word: n, guided: false },
]

/** A wrong answer comes back later with its options reshuffled. */
export const retry = (ex: Exercise): Exercise =>
  ex.kind === 'choice' ? { ...ex, options: shuffle(ex.options) } : ex

/** Exercises that are graded and so count toward accuracy. */
export const isGraded = (ex: Exercise) => ex.kind !== 'intro'
