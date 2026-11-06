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
    if (prompt === 'hanzi-en' || prompt === 'en-hanzi') return w.en === t.en || (!!w.es && w.es === t.es)
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
/** Every way a lesson can ask about a word; each lesson draws from these in its own random order. */
const KINDS: Practice[] = ['hanzi-en', 'en-hanzi', 'audio-hanzi', 'hanzi-pinyin', 'pinyin', 'tone']
/** The easy ones, for checking a word the moment it has been introduced. */
const RECOGNITION: Practice[] = ['hanzi-en', 'en-hanzi', 'audio-hanzi']

/** `count` kinds in a random order, never the same twice running: each pass through `kinds` is reshuffled. */
function randomKinds(count: number, kinds: Practice[]): Practice[] {
  const out: Practice[] = []
  while (out.length < count) {
    const round = shuffle(kinds)
    if (round[0] === out.at(-1)) round.push(round.shift()!)
    out.push(...round)
  }
  return out.slice(0, count)
}

/** What two exercises must differ in to not feel like the same thing twice. */
const look = (ex: Exercise) => (ex.kind === 'choice' ? `choice-${ex.prompt}` : ex.kind)

/** Shuffles until no two neighbours look alike, the first one included against `before` (the shuffle that fits best stands). */
function spread(items: Exercise[], before: Exercise): Exercise[] {
  const clash = (list: Exercise[]) => list.filter((ex, j) => look(ex) === look(j === 0 ? before : list[j - 1])).length
  let best = shuffle(items)
  for (let i = 0; i < 200 && clash(best) > 0; i++) {
    const next = shuffle(items)
    if (clash(next) < clash(best)) best = next
  }
  return best
}

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
  PATH.filter((x) => p.nodes[x.id] || x === node).flatMap((x) => x.words.map((n) => word(n).hanzi))

/** Characters to trace: ones never traced first, simplest-looking words first. */
function charsToTrace(words: number[], p: Progress, count: number) {
  const all = words.flatMap((n) => charsOf(word(n).hanzi).map((char) => ({ char, word: n })))
  const unique = [...new Map(all.map((c) => [c.char, c])).values()]
  return unique
    .sort((a, b) => (p.chars[a.char]?.traced ?? 0) - (p.chars[b.char]?.traced ?? 0) || (CHARS[a.char] ? -1 : 1))
    .slice(0, count)
}

/**
 * A lesson meets each word (a card, then a quick check of a random easy kind), then mixes the rest in a random order:
 * a matching round, one question per word with a random kind each, a character to write, and two reviewed words. It
 * ends by putting the words to work in a sentence, the two kinds in either order. No two lessons run the same way.
 */
function lessonExercises(node: PathNode, p: Progress): Exercise[] {
  const fresh = node.words
  const seq: Exercise[] = []
  const checks = randomKinds(fresh.length, RECOGNITION)
  fresh.forEach((n, i) => {
    seq.push({ kind: 'intro', word: n })
    seq.push(practiceFor(n, checks[i]))
  })

  const before = PATH.slice(0, PATH.indexOf(node)).flatMap((x) => x.words)
  const review = weakestWords(p, before, 2)
  const words = shuffle([...fresh, ...review])
  const middle: Exercise[] = [{ kind: 'match', words: fresh }, ...practiceSeq(words, randomKinds(words.length, KINDS))]
  for (const t of charsToTrace(fresh, p, 1)) middle.push({ kind: 'trace', char: t.char, word: t.word, guide: guideFor(p, t.char) })
  seq.push(...spread(middle, seq.at(-1)!))

  const unitPool = UNITS.find((u) => u.id === node.unitId)?.words ?? []
  const known = new Set(knownBefore(node, p))
  const finale = [clozeFrom(fresh, known), sentenceFrom(fresh, known, [...fresh, ...unitPool])].filter((ex) => ex !== null)
  seq.push(...shuffle(finale))
  return seq
}

export const buildNode = lessonExercises

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
