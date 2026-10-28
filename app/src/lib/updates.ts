// The app keeps a full copy of itself on the device (service worker) so it opens at once and works
// offline. This keeps that copy fresh: after a deploy, the next visit fetches the new version in the
// background and reloads onto it, instead of leaving the old one on screen until the tab is closed.

const CHECK_EVERY = 30 * 60_000

let holds = 0
let waiting = false

/** Don't reload while something the learner is in the middle of (a lesson, a reward) is on screen. */
export function holdUpdates() {
  holds++
  return () => {
    holds--
    if (holds === 0 && waiting) window.location.reload()
  }
}

function newVersionReady() {
  if (holds === 0) window.location.reload()
  else waiting = true
}

export function registerUpdates() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const sw = navigator.serviceWorker
  // The very first install takes control too, but that isn't an update: nothing old is on screen.
  const hadController = !!sw.controller
  let reloading = false
  sw.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    newVersionReady()
  })

  const register = async () => {
    const base = import.meta.env.BASE_URL
    const reg = await sw.register(`${base}sw.js`, { scope: base, updateViaCache: 'none' })
    const check = () => void reg.update().catch(() => {})
    setInterval(check, CHECK_EVERY)
    window.addEventListener('online', check)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
  }
  if (document.readyState === 'complete') void register()
  else window.addEventListener('load', () => void register(), { once: true })
}
