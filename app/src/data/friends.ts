// Wāwa's friends, each named with a reduplicated Chinese word like Wāwa (蛙蛙).

export type FriendId = 'wawa' | 'harpia' | 'sloth' | 'tucan'

export const FRIENDS: Record<FriendId, { name: string; hanzi: string; es: string; meaning: string }> = {
  wawa: { name: 'Wāwa', hanzi: '蛙蛙', es: 'Rana dorada', meaning: '蛙 wā · rana' },
  harpia: { name: 'Yīngyīng', hanzi: '鹰鹰', es: 'Águila harpía', meaning: '鹰 yīng · águila' },
  sloth: { name: 'Lǎnlǎn', hanzi: '懒懒', es: 'Perezoso', meaning: '懒 lǎn · flojo' },
  tucan: { name: 'Zuǐzuǐ', hanzi: '嘴嘴', es: 'Tucán', meaning: '嘴 zuǐ · pico, boca' },
}
