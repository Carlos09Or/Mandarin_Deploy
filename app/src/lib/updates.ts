// The app keeps a full copy of itself on the device (service worker) so it opens at once, whatever the line, and works
// offline. This keeps that copy fresh without ever interrupting a visit: after a deploy the new version is fetched in
// the background and waits; it takes over the moment the learner leaves the app, so the next time they come back it is
// already the new one. (Swapping it in while the app is on screen reloaded the page under their finger.)

const CHECK_EVERY = 30 * 60_000

let holds = 0
let waiting: ServiceWorker | null = null
let reloading = false

/** Don't swap versions while something the learner is in the middle of (a lesson, a reward) is on screen. */
export function holdUpdates() {
  holds++
  return () => {
    holds--
    if (holds === 0 && document.visibilityState === 'hidden') applyUpdate()
  }
}

/** Asks the waiting version to take over; the page reloads onto it (see `controllerchange` below). */
function applyUpdate() {
  if (holds === 0 && waiting) waiting.postMessage({ type: 'SKIP_WAITING' })
}

export function registerUpdates() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const sw = navigator.serviceWorker
  // The very first install takes control too, but that isn't an update: nothing old is on screen.
  const hadController = !!sw.controller
  sw.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    // The page left on screen belongs to the old version: reload onto the new one, unless the learner is mid-lesson
    // (it then reloads when they are done and the app is next in the background).
    if (holds === 0) {
      reloading = true
      window.location.reload()
    }
  })
  // Out of sight is the moment to switch: no one sees the reload.
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && applyUpdate())

  const register = async () => {
    const base = import.meta.env.BASE_URL
    const reg = await sw.register(`${base}sw.js`, { scope: base, updateViaCache: 'none' })
    const ready = (w: ServiceWorker | null) => {
      if (w && sw.controller) waiting = w
    }
    ready(reg.waiting)
    reg.addEventListener('updatefound', () => {
      const w = reg.installing
      w?.addEventListener('statechange', () => w.state === 'installed' && ready(w))
    })
    const check = () => void reg.update().catch(() => {})
    setInterval(check, CHECK_EVERY)
    window.addEventListener('online', check)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
  }
  if (document.readyState === 'complete') void register()
  else window.addEventListener('load', () => void register(), { once: true })
}
