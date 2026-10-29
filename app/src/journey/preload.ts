import { asset } from '../data/journey'
import { WORD_FRIEND_FILES } from '../lesson/friends'

// The pictures of the journey, fetched and decoded once so that no screen pops in later. The ones the
// map needs are loaded behind the loading screen; the rest follow in the background once the app is
// open. The service worker also keeps them on the device (vite.config.ts).
// Keep these lists in step with public/journey.
const NOW = [
  // map
  'map-illustrated-clean.webp', 'map-fog-clean.webp', 'boat-1.webp', 'boat-2.webp',
  'map-cloud.webp', 'map-cloud-2.webp', 'map-cloud-3.webp', 'map-cloud-4.webp',
  'characters/wawa-sombrero.svg', 'characters/harpia-banda.svg', 'characters/sloth-montuno.svg', 'characters/tucan-pollera.svg',
  'nav-map.webp', 'nav-review.webp', 'nav-write.webp', 'nav-passport.webp', 'nav-profile.webp',
  // the first route you open from the map: its medallions, backdrop and landmark
  'stops/airplane.webp', 'stops/promenade.webp', 'stops/church.webp', 'stops/chinese-gate.webp', 'stops/bicycle.webp',
  'stops/ruin-tower.webp', 'stops/storybook.webp', 'stops/fishing-boat.webp', 'stops/waterfall.webp', 'stops/mountain.webp',
  'stops/beach-umbrella.webp', 'stops/arch-bridge.webp',
  'route-bg-day.webp', 'route-bg-night.webp', 'route-pattern.webp', 'landmark-canal.webp',
]
const LATER = [
  // the friends who bring each new word (lesson/Intro.tsx)
  ...WORD_FRIEND_FILES,
  // other routes
  'ride-landscape.webp',
  // the train that takes you on to the next province (AllAboard)
  'train.webp', 'train-wheel.webp', 'train-smoke.webp', 'train-travel-empty.webp',
  // passport
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

/** Loads the map's pictures once per session; later calls return the same promise. The rest then load when the browser is idle. */
export function preloadJourney(onProgress: (share: number) => void): Promise<void> {
  if (done) {
    onProgress(1)
    return done
  }
  let count = 0
  done = Promise.all(
    NOW.map((f) =>
      load(asset(f)).then(() => {
        count++
        onProgress(count / NOW.length)
      }),
    ),
  ).then(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300))
    idle(() => void LATER.reduce((p, f) => p.then(() => load(asset(f))), Promise.resolve()), { timeout: 800 })
  })
  return done
}
