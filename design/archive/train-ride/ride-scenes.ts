// The painted scenes the train races through, and the picker that rotates them.
// Paste this back into app/src/data/journey.ts (see README.md).

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
