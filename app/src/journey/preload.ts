import { FRIEND_IDS } from '../data/friends'
import vocab from '../data/hsk1.json'
import { DOOR_FILES, asset, flightFiles, walkerFiles } from '../data/journey'
import { canWarm, markSlow, saveData } from '../lib/network'
import { getProgress } from '../lib/progress'
import { WORD_FRIEND_FILES } from '../lesson/friends'

// The pictures of the journey, fetched and decoded once so that no screen pops in later, in two steps so a slow
// connection is never kept waiting for things nobody can see yet:
//  - NOW: only what the first view of the map is made of. It loads behind the loading screen.
//  - LATER: everything the next screens use (doors, friends, train, passport, stroke data), fetched quietly in the
//    background once the map is up, and only when the connection can afford it (see `canWarm`).
// Whatever LATER has not fetched yet loads when its screen asks for it. The service worker keeps every picture it
// has fetched on the device (vite.config.ts); its install only fetches the app itself and the NOW pictures.
// Keep these lists in step with public/journey.
const NOW = [
  // the map and its fog, in a light version first (the sharp one follows, see `whenSharp`)
  'map-illustrated-clean-lo.webp', 'map-fog-clean-lo.webp',
  // the traveller waiting in the corner of the map, who flies to a badge when it is tapped (journey/Flyer.tsx)
  ...flightFiles(getProgress().traveler),
  'characters/wawa-sombrero.svg', 'characters/harpia-banda.svg', 'characters/sloth-montuno.svg', 'characters/tucan-pollera.svg',
  'nav-map.webp', 'nav-review.webp', 'nav-write.webp', 'nav-passport.webp', 'nav-profile.webp',
]
/** The map as it is drawn at full size, fetched right after the first view so the map sharpens when it arrives. */
const SHARP = ['map-illustrated-clean.webp', 'map-fog-clean.webp']
/** Hanzi that need stroke data for the writing trainer. */
const CHARS = [...new Set(vocab.words.flatMap((w) => [...w.hanzi, ...w.example.hanzi]).filter((c) => /\p{Script=Han}/u.test(c)))]
/** In the order the learner is likely to need them. */
const LATER = [
  // the first thing after the map: a province's door page, closed doors first (journey/LessonDoor.tsx)
  ...DOOR_FILES.filter((f) => f.endsWith('-closed.webp') || f.includes('/path-')),
  ...walkerFiles(getProgress().traveler),
  // the friends who bring each new word (lesson/Intro.tsx)
  ...WORD_FRIEND_FILES,
  // the sea's boats, clouds, the other friends' flights (journey/MapHome.tsx, Flyer.tsx)
  ...['sailboat', 'fishing-boat', 'cayuco', 'ferry', 'container-ship', 'tanker', 'bulk-carrier', 'cruise-ship'].flatMap((b) => [`boats/${b}-sail.webp`, `boats/${b}-anchor.webp`]),
  'map-cloud.webp', 'map-cloud-2.webp', 'map-cloud-3.webp', 'map-cloud-4.webp',
  ...DOOR_FILES.filter((f) => !f.endsWith('-closed.webp') && !f.includes('/path-')),
  ...FRIEND_IDS.flatMap(flightFiles),
  // other routes
  'ride-landscape.webp',
  // the train that takes you on to the next province (AllAboard)
  'train.webp', 'train-wheel.webp', 'train-smoke.webp', 'train-travel-empty.webp',
  // passport
  'landmark-canal.webp', 'stops/arch-bridge.webp',
  'passport-cover.webp', 'passport-page.webp', 'postcard-panama.webp',
]

/** Decoded images are kept here for the whole session, so the browser never drops them. */
const kept = new Map<string, Promise<void>>()
const images: HTMLImageElement[] = []
let done: Promise<void> | null = null

/** Counts a picture as ready once it has arrived; decoding then carries on in the background. */
function load(url: string) {
  const known = kept.get(url)
  if (known) return known
  const img = new Image()
  img.decoding = 'async'
  images.push(img)
  const ready = new Promise<void>((resolve) => {
    img.onload = () => {
      img.decode().catch(() => undefined)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = url
  })
  kept.set(url, ready)
  return ready
}

/** Resolves once these pictures have arrived (or after `cap` ms, so a slow connection never blocks a screen). */
export function whenLoaded(files: string[], cap = 4000): Promise<void> {
  const all = Promise.all(files.map((f) => load(asset(f)))).then(() => undefined)
  return Promise.race([all, new Promise<void>((resolve) => setTimeout(resolve, cap))])
}

let sharpDone!: () => void
const sharp = new Promise<void>((resolve) => (sharpDone = resolve))
/** Resolves once the sharp map has arrived (never, with data saver on: the light map stays). */
export const whenSharp = () => sharp

/** Things that need every frame (the flight) pause the background downloads; they pick up where they left off. */
let held = 0
export const holdWarm = (on: boolean) => {
  held = Math.max(0, held + (on ? 1 : -1))
}
const calmDown = async () => {
  while (held > 0) await new Promise((r) => setTimeout(r, 250))
}

/** Fetches the rest of the pictures a few at a time, then the stroke data, stopping if the connection turns out poor. */
async function warm() {
  const urls = [...LATER.map(asset), ...CHARS.map((c) => `${import.meta.env.BASE_URL}hanzi/${c}.json`)]
  let next = 0
  // Fetch only: the service worker keeps what arrives, and a screen decodes its pictures when it needs them. Decoding
  // a hundred pictures nobody has asked for would cost the phone memory and frames.
  const worker = async () => {
    while (next < urls.length && canWarm()) {
      await calmDown()
      await fetch(urls[next++]).then((r) => r.arrayBuffer()).catch(() => undefined)
    }
  }
  await Promise.all([worker(), worker()])
}

/** Loads the map's pictures once per session; later calls return the same promise. The rest then load when the browser is idle. */
export function preloadJourney(onProgress: (share: number) => void): Promise<void> {
  if (done) {
    onProgress(1)
    return done
  }
  let count = 0
  const t0 = performance.now()
  done = Promise.all(
    NOW.map((f) =>
      load(asset(f)).then(() => {
        count++
        onProgress(count / NOW.length)
      }),
    ),
  ).then(() => {
    if (performance.now() - t0 > 9000) markSlow()
    if (!saveData()) void Promise.all(SHARP.map((f) => load(asset(f)))).then(sharpDone)
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300))
    idle(() => void warm(), { timeout: 2500 })
  })
  return done
}
