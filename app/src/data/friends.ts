// Wāwa and her friends: Panamanian animals named with a reduplicated Chinese word
// (蛙蛙, 鹰鹰…), so each name teaches a character. Each wears Panamanian patriotic outfits.

export type FriendId = 'wawa' | 'harpia' | 'sloth' | 'tucan'

export const FRIENDS: Record<FriendId, { name: string; hanzi: string; kind: string; meaning: string }> = {
  wawa: { name: 'Wāwa', hanzi: '蛙蛙', kind: 'Golden frog', meaning: '蛙 wā · frog' },
  harpia: { name: 'Yīngyīng', hanzi: '鹰鹰', kind: 'Harpy eagle', meaning: '鹰 yīng · eagle' },
  sloth: { name: 'Lǎnlǎn', hanzi: '懒懒', kind: 'Sloth', meaning: '懒 lǎn · lazy' },
  tucan: { name: 'Zuǐzuǐ', hanzi: '嘴嘴', kind: 'Toucan', meaning: '嘴 zuǐ · beak, mouth' },
}

export const FRIEND_IDS = Object.keys(FRIENDS) as FriendId[]

/** Every outfit a character can wear; 'clasica' means none. */
export type Outfit =
  | 'clasica'
  | 'sombrero' // sombrero pintao
  | 'panuelo' // red scarf
  | 'banda' // school marching-band shako, as in the November parades
  | 'bandera' // the flag of Panama
  | 'banderas' // the flags of Panama and China, side by side
  | 'montuno' // camisilla and sombrero pintao
  | 'pollera' // tembleques and motas of the pollera

export const OUTFIT_LABELS: Record<Outfit, string> = {
  clasica: 'Nothing',
  sombrero: 'Sombrero pintao',
  panuelo: 'Red scarf',
  banda: 'Marching band',
  bandera: 'Flag',
  banderas: 'Panama & China',
  montuno: 'Montuno',
  pollera: 'Pollera',
}

/** What each character can wear. The automatic setting rotates through `rotation` daily. */
export const OUTFITS: Record<FriendId, { options: Outfit[]; rotation: Outfit[] }> = {
  wawa: { options: ['sombrero', 'panuelo', 'clasica'], rotation: ['sombrero', 'panuelo', 'sombrero'] },
  harpia: { options: ['banda', 'bandera', 'clasica'], rotation: ['banda', 'bandera'] },
  sloth: { options: ['montuno', 'pollera', 'clasica'], rotation: ['montuno', 'pollera'] },
  tucan: { options: ['pollera', 'banderas', 'clasica'], rotation: ['pollera', 'banderas'] },
}

export type OutfitSetting = Outfit | 'auto'

/** The outfit to draw for a saved setting; 'auto' (or an outfit that no longer exists) picks today's. */
export function outfitFor(id: FriendId, setting: string | undefined, date = new Date()): Outfit {
  const { options, rotation } = OUTFITS[id]
  if (setting && setting !== 'auto' && (options as string[]).includes(setting)) return setting as Outfit
  const day = Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000)
  return rotation[day % rotation.length]
}
