import { CHARS, PATH, UNITS, charsOf, plainPinyin, segment, word, type PathNode } from '../data/course'
import type { Progress } from './progress'

// A lesson mixes skills the way a class would: meet a word, recognise it, hear it,
// produce it, then write one of its characters. Earlier words come back for review.

export type ChoicePrompt = 'hanzi-en' | 'en-hanzi' | 'audio-hanzi' | 'hanzi-pinyin'
export type Exercise =
  | { kind: 'intro'; word: number }
  | { kind: 'choice'; prompt: ChoicePrompt; word: number; options: number[] }
  | { kind: 'match'; words: number[] }
  | { kind: 'trace'; char: string; word: number; guided: boolean }
  /** Hear a sentence and build it from word tiles. `bank` has the tokens plus a few decoys. */
  | { kind: 'sentence'; word: number; tokens: string[]; bank: string[] }

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
    if (prompt === 'hanzi-en' || prompt === 'en-hanzi') return w.en === t.en
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

const ROTATION: ChoicePrompt[] = ['en-hanzi', 'audio-hanzi', 'hanzi-pinyin']

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

/** Sentence exercise from the example of one of `words`, preferring sentences made of known words. */
function sentenceFrom(words: number[], known: Set<string>, decoyPool: number[]): Exercise | null {
  const options = words
    .map((n) => ({ n, tokens: segment(word(n).example.hanzi) }))
    .filter((o): o is { n: number; tokens: string[] } => !!o.tokens && o.tokens.length >= 3 && o.tokens.length <= 8)
  if (!options.length) return null
  const unknown = (t: string[]) => t.filter((x) => !known.has(x)).length
  const best = Math.min(...options.map((o) => unknown(o.tokens)))
  const pick = shuffle(options.filter((o) => unknown(o.tokens) === best))[0]
  const decoys = shuffle(decoyPool.map((n) => word(n).hanzi))
    .filter((h, i, all) => !pick.tokens.includes(h) && all.indexOf(h) === i)
    .slice(0, pick.tokens.length >= 6 ? 1 : 2)
  return { kind: 'sentence', word: pick.n, tokens: pick.tokens, bank: shuffle([...pick.tokens, ...decoys]) }
}

const knownBefore = (node: PathNode | null, p: Progress) =>
  PATH.filter((x) => x.kind === 'lesson' && (p.nodes[x.id] || x === node)).flatMap((x) => x.words.map((n) => word(n).hanzi))

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
    seq.push(choice(n, 'hanzi-en'))
  }
  seq.push({ kind: 'match', words: fresh })

  const before = PATH.slice(0, PATH.indexOf(node)).filter((x) => x.kind === 'lesson').flatMap((x) => x.words)
  const review = weakestWords(p, before, 2)
  const practice = shuffle([...fresh, ...review]).map((n, i) => choice(n, ROTATION[i % ROTATION.length]))
  seq.push(...practice)

  for (const t of charsToTrace(fresh, p, 1)) {
    seq.push({ kind: 'trace', char: t.char, word: t.word, guided: !p.chars[t.char] })
  }

  // The lesson ends by putting its words to work in a full sentence.
  const unitPool = UNITS.find((u) => u.id === node.unitId)?.words ?? []
  const sentence = sentenceFrom(fresh, new Set(knownBefore(node, p)), [...fresh, ...unitPool])
  if (sentence) seq.push(sentence)
  return seq
}

function reviewExercises(pool: number[], p: Progress, size: number, sentences: number): Exercise[] {
  const picked = weakestWords(p, pool, size)
  const seq: Exercise[] = picked.map((n, i) => choice(n, (['hanzi-en', ...ROTATION] as ChoicePrompt[])[i % 4]))
  if (picked.length >= 5) seq.splice(Math.min(4, seq.length), 0, { kind: 'match', words: picked.slice(0, 5) })
  for (const t of charsToTrace(picked, p, 2)) seq.push({ kind: 'trace', char: t.char, word: t.word, guided: false })

  const known = new Set(knownBefore(null, p))
  const used = new Set<number>()
  for (let i = 0; i < sentences; i++) {
    const s = sentenceFrom(shuffle(pool.filter((n) => !used.has(n))), known, pool)
    if (!s || s.kind !== 'sentence') break
    used.add(s.word)
    seq.push(s)
  }
  return seq
}

export function buildNode(node: PathNode, p: Progress): Exercise[] {
  return node.kind === 'lesson' ? lessonExercises(node, p) : reviewExercises(node.words, p, 12, 2)
}

export const buildReview = (pool: number[], p: Progress) => reviewExercises(pool, p, 10, 1)

/** Writing drill for one character: trace it, then write it twice from memory. */
export const buildWriting = (char: string, n: number): Exercise[] => [
  { kind: 'trace', char, word: n, guided: true },
  { kind: 'trace', char, word: n, guided: false },
  { kind: 'trace', char, word: n, guided: false },
]

/** A wrong answer comes back later with its options reshuffled. */
export const retry = (ex: Exercise): Exercise =>
  ex.kind === 'choice'
    ? { ...ex, options: shuffle(ex.options) }
    : ex.kind === 'sentence'
      ? { ...ex, bank: shuffle(ex.bank) }
      : ex

/** Exercises that are graded and so count toward accuracy. */
export const isGraded = (ex: Exercise) => ex.kind !== 'intro'
