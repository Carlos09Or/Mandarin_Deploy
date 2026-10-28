import { asset } from '../data/journey'

// Every picture of the journey, fetched and decoded once behind the loading screen so that no
// screen ever pops in later. The service worker also keeps them on the device (vite.config.ts).
// Keep this list in step with public/journey.
const FILES = [
  // map
  'map-illustrated-clean.webp', 'map-fog-clean.webp', 'boat-1.webp', 'boat-2.webp',
  'map-cloud.webp', 'map-cloud-2.webp', 'map-cloud-3.webp', 'map-cloud-4.webp',
  'characters/wawa-sombrero.svg', 'characters/harpia-banda.svg', 'characters/sloth-montuno.svg', 'characters/tucan-pollera.svg',
  'nav-map.webp', 'nav-review.webp', 'nav-write.webp', 'nav-passport.webp', 'nav-profile.webp',
  // routes
  'route-bg-day.webp', 'route-bg-night.webp', 'landmark-canal.webp', 'ride-landscape.webp', 'route-pattern.webp',
  // trains
  'train.webp', 'train-wheel.webp', 'train-smoke.webp', 'train-travel-empty.webp', 'train-felt.webp',
  'ride-bg-papercut.webp', 'ride-bg-coast.webp', 'ride-bg-jungle.webp', 'ride-bg-sunset.webp', 'ride-bg-rain.webp', 'ride-bg-night.webp',
  // passport
  'passport-cover.webp', 'passport-page.webp', 'postcard-panama.webp',
  // route stops
  'stops/airplane.webp', 'stops/promenade.webp', 'stops/church.webp', 'stops/chinese-gate.webp', 'stops/bicycle.webp',
  'stops/ruin-tower.webp', 'stops/storybook.webp', 'stops/fishing-boat.webp', 'stops/waterfall.webp', 'stops/mountain.webp',
  'stops/beach-umbrella.webp', 'stops/arch-bridge.webp',
]

/** Decoded images are kept here for the whole session, so the browser never drops them. */
const kept: HTMLImageElement[] = []
let done: Promise<void> | null = null

/** Counts a picture as ready once it has arrived; decoding then carries on in the background. */
function load(url: string) {
  const img = new Image()
  img.decoding = 'async'
  kept.push(img)
  return new Promise<void>((resolve) => {
    img.onload = () => {
      img.decode().catch(() => undefined)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = url
  })
}

/** Loads everything once per session; later calls return the same promise. */
export function preloadJourney(onProgress: (share: number) => void): Promise<void> {
  if (done) {
    onProgress(1)
    return done
  }
  let count = 0
  done = Promise.all(
    FILES.map((f) =>
      load(asset(f)).then(() => {
        count++
        onProgress(count / FILES.length)
      }),
    ),
  ).then(() => undefined)
  return done
}
