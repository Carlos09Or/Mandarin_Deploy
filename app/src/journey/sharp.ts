import { lowBandwidth } from '../lib/network'
import { whenNow } from './preload'

// The sharp map is cut into pieces (tiles and close-ups) that load as the camera nears them. They go through this one
// queue instead of all being asked for at once, so a phone's connection serves them in the order the learner sees them:
//  - nothing starts until the first view of the map is up (it never competes with the loading screen);
//  - the pieces on screen come first, the middle of the screen first, so the picture sharpens outward from the centre;
//  - the pieces only near the screen (not on it) are fetched only when the line is good;
//  - a few at a time (two on a slow line), so the first ones arrive whole and early.

/** Added to the rank of a piece that is near the screen but not on it. */
export const NEAR = 1e6

type Job = { url: string; rank: number; ready: () => void }

const waiting: Job[] = []
let running = 0
let open = false
const limit = () => (lowBandwidth() ? 2 : 4)

function pump() {
  while (open && running < limit()) {
    const ready = waiting.filter((j) => j.rank < NEAR || !lowBandwidth())
    if (!ready.length) return
    const job = ready.reduce((a, b) => (b.rank < a.rank ? b : a))
    waiting.splice(waiting.indexOf(job), 1)
    running++
    const img = new Image()
    const done = () => {
      running--
      job.ready()
      pump()
    }
    img.onload = done
    img.onerror = done
    img.src = job.url
  }
}

void whenNow().then(() => {
  open = true
  pump()
})

/**
 * Resolves once the pieces on screen have arrived, so the map opens sharp instead of filling in patch by patch; or `cap` ms after
 * the first view of the map is up, whichever comes first (a slow line never keeps the loading screen longer than that).
 */
export function whenFirstView(cap: number): Promise<void> {
  return whenNow().then(
    () =>
      new Promise<void>((resolve) => {
        const t0 = performance.now()
        // The pieces register themselves a moment after the map is mounted, so look only after a short grace.
        const check = () => {
          const age = performance.now() - t0
          const onScreen = waiting.some((j) => j.rank < NEAR)
          if (age > cap || (age > 400 && !onScreen && running === 0)) resolve()
          else setTimeout(check, 100)
        }
        check()
      }),
  )
}

/** Asks for a picture; `ready` is called once it has arrived (or failed: the page then asks the browser itself). Returns a way to withdraw the request if it has not started. */
export function requestSharp(url: string, rank: number, ready: () => void): () => void {
  const job: Job = { url, rank, ready }
  waiting.push(job)
  pump()
  return () => {
    const i = waiting.indexOf(job)
    if (i >= 0) waiting.splice(i, 1)
  }
}
