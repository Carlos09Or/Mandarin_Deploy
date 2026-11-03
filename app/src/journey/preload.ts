import { FRIEND_IDS } from '../data/friends'
import vocab from '../data/hsk1.json'
import { word } from '../data/course'
import { DOOR_FILES, asset, doorFiles, doorFor, doorOpening, flightFiles, nightly, walkerFiles } from '../data/journey'
import { SEA_BOATS } from '../data/sea-boats'
import { prefetchClips } from '../lib/audio'
import { canWarm, lowBandwidth, markSlow } from '../lib/network'
import { getProgress, isNight } from '../lib/progress'
import { POSES, QUICK, WORD_FRIEND_FILES, file } from '../lesson/friends'
import { around, currentProvince, doorStops, firstDoor } from './stops'

// The pictures of the journey, fetched and decoded once so that no screen pops in later, in steps so a slow
// connection is never kept waiting for things nobody can see yet:
//  - NOW: only what the first view of the map is made of. It loads behind the loading screen.
//  - NEXT: what the learner's next lesson needs, from the tap on the badge to its first word (`warmAhead`). It loads
//    while the learner looks at the map, on any connection: it is what they will open next.
//  - LATER: everything the next screens use (doors, friends, stroke data), fetched quietly in the
//    background once the map is up, and only when the connection can afford it (see `canWarm`).
// Whatever LATER has not fetched yet loads when its screen asks for it. The service worker keeps every picture it
// has fetched on the device (vite.config.ts); its install only fetches the app itself and the NOW pictures.
// Keep these lists in step with public/journey.
const NOW = [
  // the map and its fog, in a light version first (the sharp one follows, see `whenSharp`)
  'map/lo.webp', 'map-fog-v2-lo.webp',
  'characters/wawa-sombrero.svg', 'characters/harpia-banda.svg', 'characters/sloth-montuno.svg', 'characters/tucan-pollera.svg',
  'nav-map.webp', 'nav-review.webp', 'nav-write.webp', 'nav-profile.webp',
]
/** The door pictures for the light the learner is in now (their night twins after dark). */
const byLight = (file: string) => nightly(file, isNight(getProgress()))
/** The fog at full size, fetched right after the first view so it sharpens when it arrives (the map's own tiles load as the camera nears them). */
const SHARP = ['map-fog-v2.webp']
/** Hanzi that need stroke data for the writing trainer. */
const CHARS = [...new Set(vocab.words.flatMap((w) => [...w.hanzi, ...w.example.hanzi]).filter((c) => /\p{Script=Han}/u.test(c)))]
/** In the order the learner is likely to need them. */
const LATER = [
  // the traveller in the corner of the map, who flies to a badge when it is tapped: the map shows it once it is open (journey/Flyer.tsx)
  ...flightFiles(getProgress().traveler),
  // the first thing after the map: a province's door page, closed doors first (journey/LessonDoor.tsx)
  ...DOOR_FILES.filter((f) => f.endsWith('-closed.webp') || f.includes('/path-')).map(byLight),
  ...walkerFiles(getProgress().traveler),
  // the friends who bring each new word (lesson/Intro.tsx)
  ...WORD_FRIEND_FILES,
  // the sea's boats, clouds, the other friends' flights (journey/MapHome.tsx, Flyer.tsx)
  ...[...new Set(SEA_BOATS.map((b) => b.kind))].flatMap((b) => [`boats/${b}-sail.webp`, `boats/${b}-anchor.webp`]),
  'map-cloud.webp', 'map-cloud-2.webp', 'map-cloud-3.webp', 'map-cloud-4.webp',
  ...DOOR_FILES.filter((f) => !f.endsWith('-closed.webp') && !f.includes('/path-')).map(byLight),
  ...FRIEND_IDS.flatMap(flightFiles),
  // other routes
  'ride-landscape.webp',
  // the landmarks that close each province
  'landmark-canal.webp', 'stops/arch-bridge.webp',
]

/** Decoded images are kept here for the whole session, so the browser never drops them. */
const kept = new Map<string, Promise<void>>()
const decoded = new Map<string, Promise<void>>()
const images: HTMLImageElement[] = []
let done: Promise<void> | null = null

/** How long to wait before each new try when a picture fails to arrive (a dropped connection often comes back a moment later). */
const RETRY_AFTER = [600, 1800]

/** Counts a picture as ready once it has arrived; decoding then carries on in the background. A failed one is tried again, and forgotten if it still fails. */
function load(url: string) {
  const known = kept.get(url)
  if (known) return known
  const ready = new Promise<void>((resolve) => {
    const attempt = (n: number) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        images.push(img)
        decoded.set(url, img.decode().catch(() => undefined))
        resolve()
      }
      img.onerror = () => {
        if (n < RETRY_AFTER.length) setTimeout(() => attempt(n + 1), RETRY_AFTER[n])
        else {
          kept.delete(url)
          resolve()
        }
      }
      img.src = url
    }
    attempt(0)
  })
  kept.set(url, ready)
  return ready
}

/** Resolves once these pictures have arrived (or after `cap` ms, so a slow connection never blocks a screen). */
export function whenLoaded(files: string[], cap = 4000): Promise<void> {
  const all = Promise.all(files.map((f) => load(asset(f)))).then(() => undefined)
  return Promise.race([all, new Promise<void>((resolve) => setTimeout(resolve, cap))])
}

let nowDone!: () => void
const now = new Promise<void>((resolve) => (nowDone = resolve))
/** Resolves once the first view of the map has arrived: the sharp pieces of the map wait for it (journey/sharp.ts). */
export const whenNow = () => now

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
      // Low priority: anything the learner taps on meanwhile (a door page, a lesson) is served before these.
      await fetch(urls[next++], { priority: 'low' }).then((r) => r.arrayBuffer()).catch(() => undefined)
    }
  }
  await Promise.all([worker(), worker()])
}

/**
 * How fast the first pictures really came in, from what the browser measured: under ~250 KB/s (about 2 Mbit) the line is
 * too poor for background downloads, even when it reports itself as 4g. Pictures kept on the device (no transfer) say nothing.
 */
const SLOW_BELOW = 250 * 1024
function slowLine(urls: string[]) {
  const seen = performance
    .getEntriesByType('resource')
    .filter((e): e is PerformanceResourceTiming => urls.some((u) => e.name.endsWith(u)) && (e as PerformanceResourceTiming).transferSize > 20_000)
  if (seen.length < 2) return false
  const bytes = seen.reduce((a, e) => a + e.transferSize, 0)
  const span = Math.max(...seen.map((e) => e.responseEnd)) - Math.min(...seen.map((e) => e.startTime))
  return span > 0 && bytes / (span / 1000) < SLOW_BELOW
}

/** Loads the map's pictures once per session; later calls return the same promise. The rest then load when the browser is idle. */
export function preloadJourney(onProgress: (share: number) => void): Promise<void> {
  if (done) {
    onProgress(1)
    return done
  }
  // The bar follows weight, not file count: the two maps are most of what is waited for.
  const weight = (f: string) => (f.startsWith('map-') ? 8 : 1)
  const total = NOW.reduce((a, f) => a + weight(f), 0)
  let arrived = 0
  const t0 = performance.now()
  done = Promise.all(
    NOW.map((f) =>
      load(asset(f)).then(() => {
        arrived += weight(f)
        onProgress(arrived / total)
      }),
    ),
  ).then(() => {
    if (performance.now() - t0 > 9000 || slowLine(NOW.map(asset))) markSlow()
    nowDone()
    // The sharp map is 3344 px wide (about 25 MB once decoded): it is decoded before it fades in, not while it is being painted.
    // On a slow line the light fog stays (the sharp one is 240 KB the first view does not need).
    if (!lowBandwidth()) void Promise.all(SHARP.map((f) => load(asset(f)).then(() => decoded.get(asset(f))))).then(sharpDone)
  })
  return done
}

/** No step of the next lesson keeps the ones after it waiting longer than this (what has not arrived keeps loading). */
const STEP_WAIT = 8000

/** The learner's next lesson: the door its province's page opens on. */
function nextLesson() {
  const progress = getProgress()
  const stops = doorStops(currentProvince(progress))
  const at = firstDoor(stops, progress)
  return { progress, node: stops[at].node, doors: stops.map((s) => doorFor(s.node)), at }
}

/** Fetches what the next lesson needs, in the order the learner meets it: the flight, the door page, the lesson. */
async function warmNext() {
  const { progress, node, doors, at } = nextLesson()
  const night = isNight(progress)
  const step = (files: string[]) => whenLoaded(files, STEP_WAIT)
  // the traveller's flight to the badge (journey/Flyer.tsx), then the doors the page opens on and the one that opens
  await step(flightFiles(progress.traveler))
  await step(around(doors, at).flatMap((d) => doorFiles(d, progress.traveler, night)))
  await step(doorOpening(doors[at], night))
  // the lesson's voice clips, then the friends who bring its new words, the one bringing the first word first (lesson/Intro.tsx)
  await prefetchClips(node.words)
  if (node.kind === 'lesson') {
    const first = QUICK[node.words[0] % QUICK.length]
    await step([...POSES[first].map((p) => file(first, p)), ...WORD_FRIEND_FILES])
    // and the stroke data of its characters, for the tracing at the end (lesson/Trace.tsx)
    const chars = [...new Set(node.words.flatMap((n) => [...word(n).hanzi]))]
    await Promise.all(chars.map((c) => fetch(`${import.meta.env.BASE_URL}hanzi/${c}.json`).catch(() => undefined)))
  }
}

let ahead: Promise<void> | null = null
/**
 * Called once the map is open: fetches what the learner's next lesson needs, then (when the connection allows) the rest
 * of the journey in the background. Resolves once the next lesson is ready, so whatever should wait for it can start.
 */
export function warmAhead(): Promise<void> {
  if (ahead) return ahead
  ahead = now.then(warmNext).catch(() => undefined)
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300))
  void ahead.then(() => idle(() => void warm(), { timeout: 2500 }))
  return ahead
}
