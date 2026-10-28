import { CHARS, PATH, UNITS, WORDS, charsOf, plainPinyin, segment, word, type PathNode } from '../data/course'
import type { Progress } from './progress'
import { toneOf, type Tone } from './tones'

// A lesson mixes skills the way a class would: meet a word, recognise it, hear it,
// produce it, then write one of its characters. Earlier words come back for review.

export type ChoicePrompt = 'hanzi-en' | 'en-hanzi' | 'audio-hanzi' | 'hanzi-pinyin'
/** How much of the character shows behind the grid: its outline, a faint ghost, or nothing. */
export type Guide = 'full' | 'faint' | 'none'
export type Exercise =
  | { kind: 'intro'; word: number }
  | { kind: 'choice'; prompt: ChoicePrompt; word: number; options: number[] }
  /** Draw a line from each hanzi to its meaning. */
  | { kind: 'match'; words: number[] }
  /** Type the pinyin of a hanzi. */
  | { kind: 'pinyin'; word: number }
  | { kind: 'trace'; char: string; word: number; guide: Guide }
  /** Hear a sentence and build it from word tiles. `bank` has the tokens plus a few decoys. */
  | { kind: 'sentence'; word: number; tokens: string[]; bank: string[] }
  /** One word of a sentence is missing; pick it on a wheel. `options` includes the answer, `tokens[blank]`. */
  | { kind: 'cloze'; word: number; tokens: string[]; blank: number; options: string[] }
  /** Hear a one-syllable word and say which of the four tones it has. */
  | { kind: 'tone'; word: number; tone: Tone }

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const unitWords = (n: number) => UNITS.find((u) => u.words.includes(n))?.words ?? []

/** Two wrong options that can't be confused with the answer for this prompt. */
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
  return [...new Set([...near, ...far])].slice(0, 2)
}

export function choice(n: number, prompt: ChoicePrompt): Exercise {
  return { kind: 'choice', prompt, word: n, options: shuffle([n, ...distractors(n, prompt)]) }
}

type Practice = ChoicePrompt | 'pinyin' | 'tone'
const ROTATION: Practice[] = ['en-hanzi', 'audio-hanzi', 'pinyin', 'tone', 'hanzi-pinyin']

/** One practice exercise of the given kind; tones need a one-syllable word, so others fall back to pronunciation. */
function practiceFor(n: number, kind: Practice): Exercise {
  if (kind === 'pinyin') return { kind: 'pinyin', word: n }
  if (kind === 'tone') {
    const w = word(n)
    const tone = toneOf(w.hanzi, w.pinyin)
    return tone ? { kind: 'tone', word: n, tone } : choice(n, 'hanzi-pinyin')
  }
  return choice(n, kind)
}

/**
 * One exercise per word, taking the kinds in turn. A tone question needs a one-syllable word,
 * so it goes to the first such word still free instead of whatever happens to come next.
 */
function practiceSeq(words: number[], kinds: Practice[]): Exercise[] {
  const free = [...words]
  return words.map((_, i) => {
    const kind = kinds[i % kinds.length]
    const at = kind === 'tone' ? free.findIndex((n) => toneOf(word(n).hanzi, word(n).pinyin)) : 0
    const [n] = free.splice(at === -1 ? 0 : at, 1)
    return practiceFor(n, kind)
  })
}

const guideFor = (p: Progress, char: string): Guide => {
  const traced = p.chars[char]?.traced ?? 0
  return traced === 0 ? 'full' : traced < 3 ? 'faint' : 'none'
}

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

/** Little words that can stand in for each other in a sentence, so a wheel of them is a fair question. */
const SWAPS = [
  ['是', '有', '在', '不', '没'],
  ['很', '也', '都', '不', '太'],
  ['吗', '呢', '吧', '了'],
  ['的', '了', '吗'],
]
const vocabulary = new Set(WORDS.map((w) => w.hanzi))
const swapsOf = (token: string) =>
  SWAPS.map((g) => g.filter((t) => vocabulary.has(t))).find((g) => g.length >= 3 && g.includes(token))

/** Cloze exercise: a short example sentence from `words` with one little word left blank. */
function clozeFrom(words: number[], known: Set<string>): Exercise | null {
  const options = words.flatMap((n) => {
    const tokens = segment(word(n).example.hanzi)
    if (!tokens || tokens.length < 3 || tokens.length > 6) return []
    return tokens.flatMap((token, blank) => {
      const group = swapsOf(token)
      return group ? [{ n, tokens, blank, group }] : []
    })
  })
  if (!options.length) return null
  const unknown = (t: string[]) => t.filter((x) => !known.has(x)).length
  const best = Math.min(...options.map((o) => unknown(o.tokens)))
  const pick = shuffle(options.filter((o) => unknown(o.tokens) === best))[0]
  const answer = pick.tokens[pick.blank]
  const decoys = shuffle(pick.group.filter((t) => t !== answer)).slice(0, 2)
  return { kind: 'cloze', word: pick.n, tokens: pick.tokens, blank: pick.blank, options: shuffle([answer, ...decoys]) }
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
  seq.push(...practiceSeq(shuffle([...fresh, ...review]), ROTATION))

  for (const t of charsToTrace(fresh, p, 1)) {
    seq.push({ kind: 'trace', char: t.char, word: t.word, guide: guideFor(p, t.char) })
  }

  // The lesson ends by putting its words to work: first one missing word, then a whole sentence.
  const unitPool = UNITS.find((u) => u.id === node.unitId)?.words ?? []
  const known = new Set(knownBefore(node, p))
  const cloze = clozeFrom(fresh, known)
  if (cloze) seq.push(cloze)
  const sentence = sentenceFrom(fresh, known, [...fresh, ...unitPool])
  if (sentence) seq.push(sentence)
  return seq
}

const REVIEW: Practice[] = ['hanzi-en', 'en-hanzi', 'audio-hanzi', 'pinyin', 'tone', 'hanzi-pinyin']

function reviewExercises(pool: number[], p: Progress, size: number, sentences: number): Exercise[] {
  const picked = weakestWords(p, pool, size)
  const seq: Exercise[] = practiceSeq(picked, REVIEW)
  if (picked.length >= 5) seq.splice(Math.min(4, seq.length), 0, { kind: 'match', words: picked.slice(0, 5) })
  for (const t of charsToTrace(picked, p, 2)) seq.push({ kind: 'trace', char: t.char, word: t.word, guide: guideFor(p, t.char) })

  const known = new Set(knownBefore(null, p))
  const used = new Set<number>()
  for (let i = 0; i < sentences; i++) {
    const rest = shuffle(pool.filter((n) => !used.has(n)))
    // Alternate: one missing word, then a whole sentence.
    const s = (i % 2 === 0 ? clozeFrom(rest, known) : null) ?? sentenceFrom(rest, known, pool)
    if (!s || (s.kind !== 'sentence' && s.kind !== 'cloze')) break
    used.add(s.word)
    seq.push(s)
  }
  return seq
}

export function buildNode(node: PathNode, p: Progress): Exercise[] {
  return node.kind === 'lesson' ? lessonExercises(node, p) : reviewExercises(node.words, p, 12, 2)
}

export const buildReview = (pool: number[], p: Progress) => reviewExercises(pool, p, 10, 1)

/** Writing drill for one character: trace it, then write it with less and less help. */
export const buildWriting = (char: string, n: number): Exercise[] => [
  { kind: 'trace', char, word: n, guide: 'full' },
  { kind: 'trace', char, word: n, guide: 'faint' },
  { kind: 'trace', char, word: n, guide: 'none' },
]

/** A wrong answer comes back later with its options reshuffled. */
export const retry = (ex: Exercise): Exercise =>
  ex.kind === 'choice'
    ? { ...ex, options: shuffle(ex.options) }
    : ex.kind === 'sentence'
      ? { ...ex, bank: shuffle(ex.bank) }
      : ex.kind === 'cloze'
        ? { ...ex, options: shuffle(ex.options) }
        : ex

/** Exercises that are graded and so count toward accuracy. */
export const isGraded = (ex: Exercise) => ex.kind !== 'intro'
