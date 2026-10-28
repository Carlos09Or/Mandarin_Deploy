import { asset } from './journey'

// Illustrated introductions for new words. Each step shows one picture, slides it under the
// part of the character it stands for and draws that part's strokes over it. A last picture can
// show the parts together as the whole character settles.

export type RevealPart = { glyph: string; meaning: string; sound?: boolean }
export type RevealStep = {
  /** Picture for this part; a step without one just draws its strokes. */
  image?: string
  place: 'left' | 'right' | 'center'
  /** Stroke indices, or the character's radical strokes / everything else. */
  strokes: number[] | 'radical' | 'rest'
}
export type Reveal = {
  char: string
  steps: RevealStep[]
  together?: string
  /** Hanzi Writer colours: radical strokes and all other strokes. */
  radicalColor: string
  strokeColor: string
  parts: RevealPart[]
}

const RED = '#d21034'
const NAVY = '#0a426d'
const felt = (name: string) => asset(`felt/${name}.webp`)

/** A person-type character: the picture stands for the radical on the left, the rest follows. */
const leftRadical = (char: string, image: string, parts: RevealPart[]): Reveal => ({
  char,
  steps: [
    { image: felt(image), place: 'left', strokes: 'radical' },
    { place: 'right', strokes: 'rest' },
  ],
  radicalColor: RED,
  strokeColor: NAVY,
  parts,
})

const REVEALS: Record<string, Reveal> = {
  // 我 was a hand holding a weapon: 手 (strokes 1, 3, 4) + 戈 (the radical: 2, 5, 6, 7).
  我: {
    char: '我',
    steps: [
      { image: felt('wo-hand'), place: 'left', strokes: [0, 2, 3] },
      { image: felt('wo-weapon'), place: 'right', strokes: 'radical' },
    ],
    together: felt('wo-together'),
    radicalColor: NAVY,
    strokeColor: RED,
    parts: [{ glyph: '扌', meaning: 'hand' }, { glyph: '戈', meaning: 'ancient weapon' }],
  },
  你: leftRadical('你', 'ni', [{ glyph: '亻', meaning: 'person' }, { glyph: '尔', meaning: 'you' }]),
  他: leftRadical('他', 'ta-he', [{ glyph: '亻', meaning: 'person' }, { glyph: '也', meaning: 'also' }]),
  她: leftRadical('她', 'ta-she', [{ glyph: '女', meaning: 'woman' }, { glyph: '也', meaning: 'also' }]),
}

export const revealFor = (hanzi: string): Reveal | undefined => REVEALS[hanzi]
