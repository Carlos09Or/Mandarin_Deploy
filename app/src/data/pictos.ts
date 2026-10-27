import parts from './char-parts.json'
import { asset } from './journey'

// How a character is put together, for the new-word card: its parts with their meaning and a
// line to remember it by. Written for the characters of Panama and Panama Oeste (units 1–2).

export type CharParts = { parts: { glyph: string; meaning: string }[]; memory: string }
export const CHAR_PARTS = parts as Record<string, CharParts>

/**
 * Pictograms whose outline follows the strokes of their glyph, so the glyph can be drawn on top
 * (design/word-art/pictogramas.md has the prompts that made them).
 */
const PICTO_FILES: Record<string, string> = {
  人: 'ren', 子: 'zi', 女: 'nu', 口: 'kou', 亻: 'ren-side', 宀: 'mian', 讠: 'yan', 辶: 'chuo', 月: 'yue', 心: 'xin',
  马: 'ma', 门: 'men', 田: 'tian', 力: 'li', 夕: 'xi', 木: 'mu', 羊: 'yang', 大: 'da', 儿: 'er', 豕: 'shi',
  手: 'shou', 戈: 'ge', 氵: 'shui', 糸: 'mi', 矢: 'shi-arrow', 隹: 'zhui', 小: 'xiao', 土: 'tu', 生: 'sheng',
  几: 'ji', 又: 'you', 耂: 'lao', 父: 'fu',
}
export const pictoOf = (glyph: string) => (PICTO_FILES[glyph] ? asset(`pictos/${PICTO_FILES[glyph]}.webp`) : null)

/** The character of a word to reveal from pictures: the first one with any pictured part. */
export function revealFor(hanzi: string) {
  for (const char of hanzi) {
    const info = CHAR_PARTS[char]
    if (!info) continue
    // A character that is itself a pictogram (人, 女, 大…) is revealed from its own picture.
    if (pictoOf(char)) return { char, info, pictures: [pictoOf(char)!] }
    const pictures = info.parts.map((p) => pictoOf(p.glyph)).filter((p): p is string => !!p)
    if (pictures.length) return { char, info, pictures }
  }
  return null
}
