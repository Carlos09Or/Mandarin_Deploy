import map from './map-provinces.json'
import type { PathNode } from './course'
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
  /** A tall painting for the whole route: scenery down both sides, the middle left clear for the path. */
  backdrop?: { day: string; night: string }
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
    backdrop: { day: 'route-bg-day.webp', night: 'route-bg-night.webp' },
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
    landmark: { name: 'Bridge of the Americas', zh: '大桥', py: 'Měizhōu Dàqiáo', image: 'stops/arch-bridge.webp' },
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

/** Felt medallion for each stop on a route; stops without one show their key hanzi instead. */
export const STOP_ICONS: Record<string, string> = {
  'Tocumen Airport': 'stops/airplane.webp',
  'Cinta Costera': 'stops/promenade.webp',
  'Casco Viejo': 'stops/church.webp',
  'Barrio Chino': 'stops/chinese-gate.webp',
  'Amador Causeway': 'stops/bicycle.webp',
  'Panama Viejo': 'stops/ruin-tower.webp',
  Vacamonte: 'stops/fishing-boat.webp',
  'El Chorro Falls': 'stops/waterfall.webp',
  Capira: 'stops/mountain.webp',
  'Coronado Beach': 'stops/beach-umbrella.webp',
}
export const STORY_ICON = 'stops/storybook.webp'

// ---- The door a lesson opens through ----

/**
 * Every door picture is cut on the same frame, centred on its plaque, so they all line up. `plaque` is where the
 * blank plaque sits (shares of the picture's width and height; `d` is its diameter as a share of the width) and
 * also the doorway's centre line; `step` is how far down the doorstep is.
 */
export const DOOR_FRAME = { w: 760, h: 1228, step: 0.824, plaque: { x: 0.5, y: 0.32, d: 0.157 } }
/** Panama's six lessons each have a door that nods to their place; its checkpoint is the canal lock. */
const PANAMA_DOORS = ['door-1-airport', 'door-2-seaside', 'door-3-oldtown', 'door-4-chinatown', 'door-5-causeway', 'door-6-ruins']
/** Any lesson without a door of its own opens through this one. */
const DEFAULT_DOOR = 'door-8-generic'
export const DOOR_STATES = ['closed', 'half', 'open'] as const
/** The path from the traveller to each door. */
const DOOR_PATH: Record<string, string> = {
  'door-1-airport': 'cobble', 'door-2-seaside': 'sand', 'door-3-oldtown': 'cobble', 'door-4-chinatown': 'stones',
  'door-5-causeway': 'boardwalk', 'door-6-ruins': 'stones', 'door-7-canal': 'boardwalk', 'door-8-generic': 'cobble',
}
export type DoorArt = { name: string; path: string }
export const doorFor = (node: PathNode): DoorArt => {
  const name = (node.unitId === 1 ? (node.kind === 'checkpoint' ? 'door-7-canal' : PANAMA_DOORS[node.index]) : undefined) ?? DEFAULT_DOOR
  return { name, path: DOOR_PATH[name] }
}
/** Every door is drawn closed, half open and wide open; the walk fades from one to the next. */
const doorPictures = (name: string) => DOOR_STATES.map((st) => `door/${name}-${st}.webp`)
/**
 * The traveller waits looking up (`look`), now and then shades their eyes (`search`), hops on the tap (`jump`) and
 * then walks: `rest`, `step-l`, `rest`, `step-r`, over and over.
 */
export const WALK_POSES = ['look', 'search', 'jump', 'rest', 'step-l', 'step-r'] as const
export const walkerFiles = (walker: string) => WALK_POSES.map((p) => `door/${walker}-${p}.webp`)
/** The pictures a door page needs: the door, its path and the walker's poses. */
export const doorFiles = (door: DoorArt, walker: string) => [
  ...doorPictures(door.name),
  `door/path-${door.path}.webp`,
  ...walkerFiles(walker),
]
/** Every door and path picture, for the preloader (the walker's own poses are added by whoever is travelling). */
export const DOOR_FILES = [
  ...[...PANAMA_DOORS, 'door-7-canal', DEFAULT_DOOR].flatMap(doorPictures),
  ...[...new Set(Object.values(DOOR_PATH))].map((p) => `door/path-${p}.webp`),
]

const ZH_NUMBERS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const PY_NUMBERS = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí']
/** "第一课" and "Dì-yī kè" for lesson n (1 to 10). */
export const lessonTitle = (n: number) => ({ zh: `第${ZH_NUMBERS[n] ?? n}课`, py: `Dì-${PY_NUMBERS[n] ?? n} kè`, num: ZH_NUMBERS[n] ?? String(n) })

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
/**
 * The boats of each province's waters: where they sail or rest is worked out from the map itself
 * (tools/place_boats.py), so none touches land or another boat. Their pictures are in public/journey/boats.
 */
export { BOAT_SIZE, SEA_BOATS, type BoatKind, type SeaBoat } from './sea-boats'
// ---- Characters as small portraits ----

/** Crop boxes in the 200 × 200 character art: [x, y, size] around head and shoulders. */
export const PORTRAITS: Record<FriendId, { file: string; crop: [number, number, number] }> = {
  wawa: { file: 'characters/wawa-sombrero.svg', crop: [28, 6, 144] },
  harpia: { file: 'characters/harpia-banda.svg', crop: [42, 4, 116] },
  sloth: { file: 'characters/sloth-montuno.svg', crop: [50, 40, 100] },
  tucan: { file: 'characters/tucan-pollera.svg', crop: [58, 34, 124] },
}
