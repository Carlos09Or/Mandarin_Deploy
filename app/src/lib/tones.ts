export type Tone = 1 | 2 | 3 | 4

const MARKS: Record<Tone, string> = { 1: 'āēīōūǖ', 2: 'áéíóúǘ', 3: 'ǎěǐǒǔǚ', 4: 'àèìòùǜ' }

/** Colour of each tone, used wherever a tone is shown. */
export const TONE_COLOR: Record<Tone, string> = { 1: '#e0453a', 2: '#2f9e7e', 3: '#3b8fd9', 4: '#f2b544' }

/** Pitch of each tone on a five-level scale (Chao numerals): high flat, rising, dipping, falling. */
export const TONE_LEVELS: Record<Tone, number[]> = { 1: [5, 5], 2: [3, 5], 3: [2, 1, 4], 4: [5, 1] }

/**
 * Tone of a one-syllable word, or null when it has several syllables, two readings or a neutral tone.
 * A single Han character is one syllable, so the pinyin only has to carry exactly one tone mark.
 */
export function toneOf(hanzi: string, pinyin: string): Tone | null {
  if ([...hanzi].length !== 1 || pinyin.includes('/')) return null
  const tones: Tone[] = [1, 2, 3, 4]
  const found = [...pinyin].flatMap((c) => tones.filter((t) => MARKS[t].includes(c)))
  return found.length === 1 ? found[0] : null
}
