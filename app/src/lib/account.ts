import { useSyncExternalStore } from 'react'
import { toast } from '../journey/toast'
import { mergeProgress } from './merge'
import { getProgress, replaceProgress, revive, subscribeProgress, wipeDevice, type Progress } from './progress'

// Accounts and sync. The app works the same without one: progress lives on the device (progress.ts). A signed-in learner
// also has it kept in their account (worker/index.ts), merged with what their other devices did, so it follows them.
// Nothing here ever blocks a lesson: when the server can't be reached, the progress waits on the device and is sent later.

export type AccountUser = { id: string; email: string; name: string; isAdmin: boolean }
export type Account = {
  /** The server answered: false on static hosting and in plain `vite`, where there are no accounts. */
  available: boolean
  /** Still finding out who is signed in. */
  loading: boolean
  user: AccountUser | null
  /** Google sign-in is set up on the server / the development sign-in is on. */
  google: boolean
  dev: boolean
  sync: 'idle' | 'syncing' | 'error'
  syncedAt: number | null
  /** Why the last sign-in failed, if it did. */
  problem: string | null
}

const USER_KEY = 'mlh.user.v1'
const LINK_KEY = 'mlh.sync.v1'
/** Wait this long after a change before uploading, so a lesson's answers go up together. */
const UPLOAD_AFTER_MS = 4000

/** Which account this device's progress belongs to, the server version it was last in step with, and what was changed since. */
type Link = { userId: string; version: number; marker: number }

const read = <T>(key: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}
const write = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private window: signed in for this visit only */
  }
}

// Google sends the learner back to the app's root with ?code&state (or ?error). It is picked up here, as soon as this
// file loads, and taken out of the address bar.
const returned = (() => {
  const q = new URLSearchParams(location.search)
  const state = q.get('state')
  if (!state || !(q.get('code') || q.get('error'))) return null
  history.replaceState(null, '', location.pathname + location.hash)
  return { state, code: q.get('code'), error: q.get('error') }
})()

/** The learner has just come back from Google: the sign-in is being finished and the welcome screens wait for it. */
export const returningFromGoogle = returned !== null

let account: Account = {
  available: false,
  loading: true,
  user: read<AccountUser>(USER_KEY),
  google: false,
  dev: false,
  sync: 'idle',
  syncedAt: null,
  problem: null,
}
const listeners = new Set<() => void>()
function set(patch: Partial<Account>) {
  account = { ...account, ...patch }
  listeners.forEach((l) => l())
}
export function useAccount(): Account {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
    () => account,
  )
}

class SignedOut extends Error {}
/** The server asked this device to slow down (429): progress waits on the device and goes up later. */
class SlowDown extends Error {
  seconds: number
  constructor(seconds: number) {
    super('rate limited')
    this.seconds = seconds
  }
}

async function api(path: string, init: RequestInit & { json?: unknown } = {}) {
  const { json, ...rest } = init
  const res = await fetch(path, {
    ...rest,
    credentials: 'same-origin',
    headers: json === undefined ? rest.headers : { 'content-type': 'application/json' },
    body: json === undefined ? rest.body : JSON.stringify(json),
  })
  // Without the server (static hosting) the same URL answers with the app's page or an error page, never JSON.
  if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('no accounts here')
  return { status: res.status, retryAfter: Number(res.headers.get('retry-after')) || 0, body: (await res.json()) as Record<string, any> }
}

const setUser = (user: AccountUser | null) => {
  write(USER_KEY, user)
  set({ user })
}

// ---- Sync ----

let current: Promise<void> | null = null
let again = false
let timer = 0
let lastRun = 0
/** After a 429 nothing is sent until this time; each one in a row doubles the wait (30 s, 1 min, 2 min ... up to 10 min). */
let blockedUntil = 0
let slowdowns = 0
let retryTimer = 0

const link = (userId: string): Link | null => {
  const l = read<Link>(LINK_KEY)
  return l?.userId === userId ? l : null
}

/** Progress made on this device that the account hasn't got yet. */
const unsynced = (userId: string) => {
  const l = link(userId)
  return !l || getProgress().modifiedAt > l.marker
}

async function syncOnce(user: AccountUser) {
  let linked = link(user.id)
  // This device's progress is another learner's (they signed out without it being cleared): theirs isn't merged into this account.
  const foreign = !linked && read<Link>(LINK_KEY) !== null

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await api('/api/progress')
    if (res.status === 401) throw new SignedOut()
    if (res.status === 429) throw new SlowDown(res.retryAfter)
    if (res.status !== 200) throw new Error(`progress ${res.status}`)
    const remote = res.body.data ? revive(res.body.data as Partial<Progress>) : null
    const version = res.body.version as number

    const local = getProgress()
    let merged: Progress
    if (!remote) merged = foreign ? revive({ deviceId: local.deviceId }) : local
    else if (foreign) merged = remote
    // A device that was never linked is treated as one that never reset: a reset made before signing in must not erase the account.
    else merged = mergeProgress(linked ? local : { ...local, epoch: 'initial', epochAt: 0 }, remote)

    const mustUpload = !remote ? !foreign : !linked || local.modifiedAt > linked.marker
    let savedVersion = version
    if (mustUpload) {
      const put = await api('/api/progress', { method: 'PUT', json: { data: merged, base: version } })
      if (put.status === 401) throw new SignedOut()
      if (put.status === 429) throw new SlowDown(put.retryAfter)
      if (put.status === 409) continue // another device saved in between: pull and merge again
      if (put.status !== 200) throw new Error(`progress ${put.status}`)
      savedVersion = put.body.version as number
    }

    // Something may have changed on this device while the request was out: keep it.
    const now = getProgress()
    const final = now.modifiedAt > local.modifiedAt ? mergeProgress(now, merged) : merged
    if (JSON.stringify(final) !== JSON.stringify(now)) replaceProgress(final)
    linked = { userId: user.id, version: savedVersion, marker: merged.modifiedAt }
    write(LINK_KEY, linked)
    return
  }
  throw new Error('too many conflicts')
}

/** Brings this device and the account level. A request made while one is under way is folded into it, and waits for it. */
export function syncNow(): Promise<void> {
  if (!account.user || !account.available) return Promise.resolve()
  if (Date.now() < blockedUntil) return Promise.resolve()
  if (current) {
    again = true
    return current
  }
  const user = account.user
  set({ sync: 'syncing' })
  current = (async () => {
    try {
      do {
        again = false
        await syncOnce(user)
      } while (again)
      slowdowns = 0
      set({ sync: 'idle', syncedAt: Date.now() })
    } catch (err) {
      if (err instanceof SignedOut) setUser(null)
      if (err instanceof SlowDown) {
        const wait = Math.min(Math.max(err.seconds, 30) * 2 ** slowdowns++, 600)
        blockedUntil = Date.now() + wait * 1000
        clearTimeout(retryTimer)
        retryTimer = window.setTimeout(() => void syncNow(), wait * 1000 + 500)
      }
      set({ sync: err instanceof SignedOut ? 'idle' : 'error' })
    } finally {
      current = null
      lastRun = Date.now()
    }
  })()
  return current
}

function watchProgress() {
  subscribeProgress(() => {
    const user = account.user
    if (!user || !unsynced(user.id)) return
    clearTimeout(timer)
    timer = window.setTimeout(() => void syncNow(), UPLOAD_AFTER_MS)
  })
  // Coming back to the app (or the connection returning) picks up what other devices did; leaving it uploads what is waiting.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (Date.now() - lastRun > 20_000) void syncNow()
    } else if (account.user && unsynced(account.user.id)) void syncNow()
  })
  window.addEventListener('online', () => void syncNow())
}

// ---- Sign in and out ----

let started = false

/** Finds out who is signed in (finishing a Google sign-in first, if the learner has just come back from it), then syncs. */
export async function startAccount() {
  if (started) return
  started = true
  try {
    if (returned) {
      if (returned.error || !returned.code) {
        set({ problem: 'Sign-in was cancelled.' })
      } else {
        const done = await api('/api/auth/google/finish', { method: 'POST', json: { code: returned.code, state: returned.state } })
        if (done.status === 200) {
          setUser(done.body.user)
          toast('Signed in')
        } else if (done.body.error === 'signups_closed') set({ problem: 'New accounts are paused for now. Please try again later.' })
        else set({ problem: 'Google sign-in did not work. Try again.' })
      }
    }
    const me = await api('/api/me')
    // Slowed down at startup: treated like being offline (the learner stays signed in on this device).
    if (me.status === 429) throw new Error('busy')
    set({ available: true, google: !!me.body.google, dev: !!me.body.dev })
    setUser(me.body.user)
  } catch (err) {
    // Offline keeps the learner shown as signed in; "no accounts here" (static hosting) hides everything.
    const hosted = !(err instanceof Error && err.message === 'no accounts here')
    set({ available: hosted && !!account.user })
    if (!hosted) write(USER_KEY, null)
  }
  set({ loading: false })
  watchProgress()
  void syncNow()
}

export async function signInWithGoogle() {
  set({ problem: null })
  try {
    const res = await api('/api/auth/google/start', { method: 'POST' })
    if (res.status !== 200) throw new Error('not set up')
    location.href = res.body.url
  } catch {
    set({ problem: 'Sign-in is not available right now.' })
  }
}

/** Development only: signs in as any email without Google (the server must have DEV_LOGIN=1). */
export async function signInForDevelopment(email: string, name?: string) {
  const res = await api('/api/auth/dev', { method: 'POST', json: { email, name } })
  if (res.status !== 200) return set({ problem: 'Development sign-in failed.' })
  setUser(res.body.user)
  void syncNow()
}

/** Signs out and clears this device, since the progress is in the account. Refuses while there is progress the account hasn't got, unless `force`. */
export async function signOut(force = false): Promise<'ok' | 'unsynced'> {
  const user = account.user
  if (!user) return 'ok'
  clearTimeout(timer)
  await syncNow()
  if (!force && unsynced(user.id)) return 'unsynced'
  await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
  setUser(null)
  write(LINK_KEY, null)
  wipeDevice()
  set({ sync: 'idle', syncedAt: null })
  return 'ok'
}

/** Deletes the account and everything it kept on the server. The progress on this device stays, as if it had never signed in. */
export async function deleteAccount() {
  const res = await api('/api/me', { method: 'DELETE' })
  if (res.status !== 200) return false
  setUser(null)
  write(LINK_KEY, null)
  set({ sync: 'idle', syncedAt: null })
  return true
}
