import map from './map-provinces.json'
import type { FriendId } from './friends'

// The course as a train journey across Panama: each province is one unit. A province's
// lessons are stops at real places, and its checkpoint is a landmark that earns a stamp.

export const asset = (file: string) => `${import.meta.env.BASE_URL}journey/${file}`

export type StampStyle = { shape: 'round' | 'box'; color: string }
export type Province = {
  id: string
  name: string
  zh: string
  py: string
  unit: number
  /** Only provinces with stops are open; the rest show as coming soon. */
  stops?: string[]
  /** After the second lesson, a short story stop (not a lesson). */
  story?: { title: string; sub: string }
  landmark?: { name: string; zh: string; py: string; image: string }
  header?: { day: string; night?: string }
  stamp?: StampStyle
  postcard?: { image: string; zh: string; py: string; en: string }
}

export const PROVINCES: Province[] = [
  {
    id: 'panama',
    name: 'Panama',
    zh: '巴拿马',
    py: 'Bānámǎ',
    unit: 1,
    stops: ['Tocumen Airport', 'Cinta Costera', 'Casco Viejo', 'Barrio Chino', 'Amador Causeway', 'Panama Viejo'],
    story: { title: 'Story · The railroad', sub: 'Panama & China · 3 min' },
    landmark: { name: 'Panama Canal', zh: '运河', py: 'Bānámǎ Yùnhé', image: 'landmark-canal.webp' },
    header: { day: 'skyline-day.webp', night: 'skyline-night.webp' },
    stamp: { shape: 'round', color: '#0a426d' },
    postcard: { image: 'postcard-panama.webp', zh: '你好！我在巴拿马。', py: 'Nǐ hǎo! Wǒ zài Bānámǎ.', en: "Hello! I'm in Panama." },
  },
  {
    id: 'panama-oeste',
    name: 'Panama Oeste',
    zh: '西巴拿马',
    py: 'Xī Bānámǎ',
    unit: 2,
    stops: ['Arraijan', 'Vacamonte', 'La Chorrera', 'El Chorro Falls', 'Capira', 'Coronado Beach'],
    landmark: { name: 'Bridge of the Americas', zh: '大桥', py: 'Měizhōu Dàqiáo', image: 'ride-landscape.webp' },
    header: { day: 'ride-landscape.webp' },
    stamp: { shape: 'box', color: '#206241' },
    postcard: { image: 'ride-landscape.webp', zh: '你好！我在西巴拿马。', py: 'Nǐ hǎo! Wǒ zài Xī Bānámǎ.', en: "Hello! I'm in Panama Oeste." },
  },
  { id: 'cocle', name: 'Cocle', zh: '科克莱', py: 'Kēkèlái', unit: 3 },
  { id: 'herrera', name: 'Herrera', zh: '埃雷拉', py: 'Āiléilā', unit: 4 },
  { id: 'los-santos', name: 'Los Santos', zh: '洛斯桑托斯', py: 'Luòsī Sāngtuōsī', unit: 5 },
  { id: 'veraguas', name: 'Veraguas', zh: '贝拉瓜斯', py: 'Bèilāguāsī', unit: 6 },
  { id: 'chiriqui', name: 'Chiriqui', zh: '奇里基', py: 'Qílǐjī', unit: 7 },
  { id: 'bocas-del-toro', name: 'Bocas del Toro', zh: '博卡斯德尔托罗', py: 'Bókǎsī Dé’ěr Tuōluó', unit: 8 },
  { id: 'colon', name: 'Colon', zh: '科隆', py: 'Kēlóng', unit: 9 },
  { id: 'darien', name: 'Darien', zh: '达连', py: 'Dálián', unit: 10 },
]
export const provinceById = (id: string) => PROVINCES.find((p) => p.id === id)!
export const provinceOfUnit = (unit: number) => PROVINCES.find((p) => p.unit === unit)
export const hasContent = (p: Province) => !!p.stops

// ---- Map geometry (map-provinces.json comes from tools/build_panama_map.py) ----

export type Region = { id: string; name: string; kind: string; unit: number | null; d: string; c: [number, number] }
export const REGIONS = map.regions as Region[]
/** The illustrated map covers this viewBox of the province shapes. */
export const VB = { x: -40, y: -89, w: 1080, h: 607.5 }
/** Where each province's fog starts to clear. */
export const ORIGIN: Record<string, [number, number]> = { panama: [548, 128], 'panama-oeste': [480, 168] }
/** Badges sit on the province centroid unless it lands on top of the city. */
export const BADGE_AT: Record<string, [number, number]> = { panama: [612, 96], colon: [462, 66], 'panama-oeste': [520, 160] }
/** The illustration draws the city and the Canal a little west of the real border, so Panama also uncovers that strip. */
export const EXTRA_HOLE: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  panama: { cx: 505, cy: 112, rx: 78, ry: 38 },
}
/** Loose clouds sitting on a province until it opens: [image, dx, dy, width px]. */
export const CLOUDS: Record<string, [string, number, number, number][]> = {
  panama: [
    ['map-cloud-2', -40, -8, 150], ['map-cloud-3', 38, 18, 110], ['map-cloud', 10, -26, 96],
    ['map-cloud-4', -10, 26, 90], ['map-cloud-2', -200, 6, 160], ['map-cloud-3', -150, -18, 120],
  ],
  'panama-oeste': [['map-cloud-3', -22, -6, 110], ['map-cloud-4', 22, 16, 80], ['map-cloud', 6, -22, 80]],
}
/** Boats lifted off the painting by tools/prep_map_boats.py: hull box as map fractions, and heading. */
export const BOATS = [
  { src: 'boat-1', box: [0.40191, 0.14665, 0.44976, 0.20404], dir: [-0.92, 0.39], secs: 22 },
  { src: 'boat-2', box: [0.56938, 0.79915, 0.61842, 0.86291], dir: [-0.88, 0.47], secs: 25 },
] as const

// ---- Scenes the train races through when a lesson starts ----

/** rail: where the wheels meet the front rail, as a fraction of the image height (measured per painting). */
export type RideScene = { id: string; file: string; rail: number; rain?: boolean }
export const RIDE_SCENES: RideScene[] = [
  { id: 'papercut', file: 'ride-bg-papercut.webp', rail: 473 / 667 },
  { id: 'coast', file: 'ride-bg-coast.webp', rail: 470 / 667 },
  { id: 'jungle', file: 'ride-bg-jungle.webp', rail: 467 / 667 },
  { id: 'sunset', file: 'ride-bg-sunset.webp', rail: 468 / 667 },
  { id: 'rain', file: 'ride-bg-rain.webp', rail: 463 / 667, rain: true },
]
export const NIGHT_RIDE: RideScene = { id: 'night', file: 'ride-bg-night.webp', rail: 465 / 667 }

let lastScene = ''
/** A different daytime scene each lesson; at night, always the night one. */
export function pickRideScene(night: boolean): RideScene {
  // Lets browser tests ask for one scene with ?ride=<id>; stripped from production builds.
  if (import.meta.env.DEV) {
    const want = new URLSearchParams(location.search).get('ride')
    const forced = [...RIDE_SCENES, NIGHT_RIDE].find((s) => s.id === want)
    if (forced) return forced
  }
  if (night) return NIGHT_RIDE
  const pool = RIDE_SCENES.filter((s) => s.id !== lastScene)
  const scene = pool[Math.floor(Math.random() * pool.length)]
  lastScene = scene.id
  return scene
}

// ---- Characters as small portraits ----

/** Crop boxes in the 200 × 200 character art: [x, y, size] around head and shoulders. */
export const PORTRAITS: Record<FriendId, { file: string; crop: [number, number, number] }> = {
  wawa: { file: 'characters/wawa-sombrero.svg', crop: [28, 6, 144] },
  harpia: { file: 'characters/harpia-banda.svg', crop: [42, 4, 116] },
  sloth: { file: 'characters/sloth-montuno.svg', crop: [50, 40, 100] },
  tucan: { file: 'characters/tucan-pollera.svg', crop: [58, 34, 124] },
}
