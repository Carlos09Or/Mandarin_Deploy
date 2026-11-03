// The app's server: Google sign-in, login sessions and one synced progress document per learner, kept in D1.
// Static files never reach this Worker (wrangler.jsonc `run_worker_first`): only /api/* and /admin do.

import { adminPage } from './admin.ts'
import { withSecurityHeaders } from './security.ts'
import { progressProblem } from './validate.ts'

export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  // Secrets (`wrangler secret put`, or .dev.vars when developing).
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  /** Comma-separated emails that may open /admin. */
  ADMIN_EMAILS?: string
  /** '1' only in .dev.vars: lets `npm run dev` sign in without Google. */
  DEV_LOGIN?: string
  /** Set to '0' (a plain variable in the Cloudflare dashboard, no deploy) to stop new accounts being created; learners who have one are unaffected. */
  SIGNUPS_OPEN?: string
  // Rate limiters (wrangler.jsonc `ratelimits`). Missing ones (older config, tests) simply don't limit.
  RL_IP?: RateLimit
  RL_AUTH?: RateLimit
  RL_USER?: RateLimit
  RL_WRITE?: RateLimit
}

type User = { id: string; email: string; name: string }

const SESSION_COOKIE = 'sid'
const TX_COOKIE = 'tx'
const SESSION_DAYS = 60
/** Sessions kept per learner (one per device, more or less): signing in again past this ends the oldest. */
const MAX_SESSIONS = 10
const DAY = 86_400_000
/** One progress document is a few hundred KB at most (3000 review entries + 300 cards). */
const MAX_PROGRESS_BYTES = 1_500_000

// ---- Small helpers ----

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')

const randomToken = (bytes = 32) => b64url(crypto.getRandomValues(new Uint8Array(bytes)))
const sha256 = async (text: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
const sha256Hex = async (text: string) => [...new Uint8Array(await sha256(text))].map((b) => b.toString(16).padStart(2, '0')).join('')

function cookies(request: Request): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

function setCookie(request: Request, name: string, value: string, maxAgeSeconds: number, path = '/') {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${name}=${value}; Path=${path}; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`
}

const adminEmails = (env: Env) =>
  (env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
const isAdmin = (env: Env, user: User) => adminEmails(env).includes(user.email.toLowerCase())

/** Writes need a same-origin Origin header: with SameSite=Lax cookies this keeps other sites from acting for a signed-in learner. */
const sameOrigin = (request: Request) => request.headers.get('origin') === new URL(request.url).origin

/** True when the request may go on. Fails open: a problem with the limiter itself must not lock learners out. */
async function allowed(limiter: RateLimit | undefined, key: string) {
  if (!limiter) return true
  try {
    return (await limiter.limit({ key })).success
  } catch {
    return true
  }
}
const tooMany = () => json({ error: 'rate_limited' }, 429, { 'retry-after': '30' })

/** The admin figures scan every learner's document, which D1 bills by rows read: they are worked out at most this often per Worker instance. */
const ADMIN_CACHE_MS = 10 * 60_000
const adminCache = new Map<string, { at: number; body: string }>()
async function cachedAdmin(key: string, compute: () => Promise<Response>) {
  const hit = adminCache.get(key)
  if (hit && Date.now() - hit.at < ADMIN_CACHE_MS) return new Response(hit.body, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
  const res = await compute()
  if (res.ok) adminCache.set(key, { at: Date.now(), body: await res.clone().text() })
  return res
}

// ---- Sessions ----

async function currentUser(request: Request, env: Env): Promise<User | null> {
  const token = cookies(request)[SESSION_COOKIE]
  if (!token) return null
  const id = await sha256Hex(token)
  const now = Date.now()
  const row = await env.DB.prepare(
    'SELECT u.id, u.email, u.name, s.expires_at AS expires FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?',
  )
    .bind(id, now)
    .first<User & { expires: number }>()
  if (!row) return null
  // Active learners stay signed in: the session is extended when less than half of it is left. Last-seen is kept to the hour.
  const writes = [env.DB.prepare('UPDATE users SET last_seen_at = ? WHERE id = ? AND last_seen_at < ?').bind(now, row.id, now - 3_600_000)]
  if (row.expires - now < (SESSION_DAYS * DAY) / 2) {
    writes.push(env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').bind(now + SESSION_DAYS * DAY, id))
  }
  await env.DB.batch(writes)
  return { id: row.id, email: row.email, name: row.name }
}

/** Finds or creates the learner for a Google account (or a dev one) and starts a session; returns the cookie to set. */
async function signIn(request: Request, env: Env, who: { sub: string; email: string; name: string }) {
  const now = Date.now()
  const existing = await env.DB.prepare('SELECT id FROM users WHERE google_sub = ?').bind(who.sub).first<{ id: string }>()
  if (!existing && env.SIGNUPS_OPEN === '0') return null
  const userId = existing?.id ?? crypto.randomUUID()
  const token = randomToken()
  await env.DB.batch([
    existing
      ? env.DB.prepare('UPDATE users SET email = ?, name = ?, last_seen_at = ? WHERE id = ?').bind(who.email, who.name, now, userId)
      : env.DB.prepare('INSERT INTO users (id, google_sub, email, name, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)').bind(
          userId, who.sub, who.email, who.name, now, now,
        ),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256Hex(token), userId, now + SESSION_DAYS * DAY),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id NOT IN (SELECT id FROM sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT ?)').bind(userId, userId, MAX_SESSIONS),
  ])
  const user: User = { id: userId, email: who.email, name: who.name }
  return { user, cookie: setCookie(request, SESSION_COOKIE, token, (SESSION_DAYS * DAY) / 1000) }
}

const publicUser = (env: Env, user: User) => ({ id: user.id, email: user.email, name: user.name, isAdmin: isAdmin(env, user) })

// ---- Google sign-in (authorization code flow with PKCE) ----
// Google sends the learner back to the app's own root, where the app picks up ?code&state and posts them to /finish.
// (Not to an /api path: the installed app's service worker would answer that navigation with the app's own page.)

async function googleStart(request: Request, env: Env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ error: 'google_not_configured' }, 503)
  const state = randomToken(16)
  const verifier = randomToken(32)
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${new URL(request.url).origin}/`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: b64url(await sha256(verifier)),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }, 200, {
    'set-cookie': setCookie(request, TX_COOKIE, `${state}.${verifier}`, 600, '/api/auth'),
  })
}

async function googleFinish(request: Request, env: Env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ error: 'google_not_configured' }, 503)
  const body = (await request.json().catch(() => null)) as { code?: unknown; state?: unknown } | null
  const [state, verifier] = (cookies(request)[TX_COOKIE] ?? '').split('.')
  if (typeof body?.code !== 'string' || typeof body.state !== 'string' || !state || !verifier || body.state !== state) {
    return json({ error: 'bad_state' }, 400)
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: body.code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${new URL(request.url).origin}/`,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  })
  if (!res.ok) return json({ error: 'google_refused' }, 400)
  // The ID token comes straight from Google's token endpoint over TLS, so its claims are trusted without checking the signature.
  const { id_token } = (await res.json()) as { id_token?: string }
  let claims: { iss?: string; aud?: string; exp?: number; sub?: string; email?: string; email_verified?: boolean; name?: string }
  try {
    const payload = id_token!.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')
    claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))))
  } catch {
    return json({ error: 'bad_token' }, 400)
  }
  const issuerOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com'
  if (!issuerOk || claims.aud !== env.GOOGLE_CLIENT_ID || !claims.exp || claims.exp * 1000 < Date.now() || !claims.sub || !claims.email || !claims.email_verified) {
    return json({ error: 'bad_token' }, 400)
  }
  const signedIn = await signIn(request, env, { sub: claims.sub, email: claims.email, name: claims.name || claims.email.split('@')[0] })
  if (!signedIn) return json({ error: 'signups_closed' }, 403)
  const { user, cookie } = signedIn
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' })
  headers.append('set-cookie', cookie)
  headers.append('set-cookie', setCookie(request, TX_COOKIE, '', 0, '/api/auth'))
  return new Response(JSON.stringify({ user: publicUser(env, user) }), { headers })
}

/** Development only (DEV_LOGIN=1 in .dev.vars): signs in as any email without Google. */
async function devLogin(request: Request, env: Env) {
  if (env.DEV_LOGIN !== '1') return json({ error: 'not_found' }, 404)
  const body = (await request.json().catch(() => null)) as { email?: unknown; name?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email.includes('@')) return json({ error: 'bad_email' }, 400)
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : email.split('@')[0]
  const signedIn = await signIn(request, env, { sub: `dev:${email}`, email, name })
  if (!signedIn) return json({ error: 'signups_closed' }, 403)
  const { user, cookie } = signedIn
  return json({ user: publicUser(env, user) }, 200, { 'set-cookie': cookie })
}

async function logout(request: Request, env: Env) {
  const token = cookies(request)[SESSION_COOKIE]
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256Hex(token)).run()
  return json({ ok: true }, 200, { 'set-cookie': setCookie(request, SESSION_COOKIE, '', 0) })
}

// ---- Progress ----

const count = (v: unknown) => (v && typeof v === 'object' ? Object.keys(v).length : 0)
const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0)

async function getProgress(env: Env, user: User) {
  const row = await env.DB.prepare('SELECT data, version FROM progress WHERE user_id = ?').bind(user.id).first<{ data: string; version: number }>()
  return json(row ? { data: JSON.parse(row.data), version: row.version } : { data: null, version: 0 })
}

/** Saves the device's progress if it was based on the version the server has; otherwise answers 409 with the server's, to be merged. */
async function putProgress(request: Request, env: Env, user: User) {
  const text = await request.text()
  if (text.length > MAX_PROGRESS_BYTES) return json({ error: 'too_large' }, 413)
  let body: { data?: Record<string, unknown>; base?: unknown }
  try {
    body = JSON.parse(text)
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const data = body.data
  if (typeof body.base !== 'number') return json({ error: 'bad_progress' }, 400)
  const problem = progressProblem(data)
  if (problem) return json({ error: 'bad_progress', field: problem }, 400)
  if (!data) return json({ error: 'bad_progress' }, 400)

  const streak = (data.streak ?? {}) as { count?: unknown; last?: unknown }
  const values = [
    JSON.stringify(data),
    int(data.xp),
    int(streak.count),
    typeof streak.last === 'string' ? streak.last.slice(0, 10) : null,
    count(data.nodes),
    count(data.cards),
    Date.now(),
  ]
  const result =
    body.base === 0
      ? await env.DB.prepare(
          'INSERT INTO progress (user_id, data, version, xp, streak, streak_last, lessons, words, updated_at) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING',
        )
          .bind(user.id, ...values)
          .run()
      : await env.DB.prepare(
          'UPDATE progress SET data = ?, version = version + 1, xp = ?, streak = ?, streak_last = ?, lessons = ?, words = ?, updated_at = ? WHERE user_id = ? AND version = ?',
        )
          .bind(...values, user.id, body.base)
          .run()
  if (result.meta.changes === 0) {
    const row = await env.DB.prepare('SELECT data, version FROM progress WHERE user_id = ?').bind(user.id).first<{ data: string; version: number }>()
    return json({ error: 'conflict', data: row ? JSON.parse(row.data) : null, version: row?.version ?? 0 }, 409)
  }
  return json({ version: body.base + 1 })
}

async function deleteAccount(request: Request, env: Env, user: User) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
  ])
  return json({ ok: true }, 200, { 'set-cookie': setCookie(request, SESSION_COOKIE, '', 0) })
}

// ---- Admin ----

async function adminUsers(env: Env) {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.created_at AS createdAt, u.last_seen_at AS lastSeenAt,
            p.xp, p.streak, p.streak_last AS streakLast, p.lessons, p.words, p.updated_at AS syncedAt
     FROM users u LEFT JOIN progress p ON p.user_id = u.id
     ORDER BY u.last_seen_at DESC LIMIT 1000`,
  ).all()
  return json({ users: results })
}

/** The stars learners gave lessons (kept in each learner's progress document), as the overall spread and one line per lesson. */
async function adminRatings(env: Env) {
  const rows = (
    await env.DB.prepare(
      `SELECT r.key AS node, CAST(json_extract(r.value, '$.stars') AS INTEGER) AS stars
       FROM progress p, json_each(p.data, '$.ratings') r`,
    ).all<{ node: string; stars: number }>()
  ).results.filter((r) => r.stars >= 1 && r.stars <= 5)
  const spread = [0, 0, 0, 0, 0]
  const lessons = new Map<string, { votes: number; sum: number }>()
  for (const { node, stars } of rows) {
    spread[stars - 1]++
    const l = lessons.get(node) ?? { votes: 0, sum: 0 }
    lessons.set(node, { votes: l.votes + 1, sum: l.sum + stars })
  }
  return json({
    votes: rows.length,
    average: rows.length ? Math.round((rows.reduce((a, r) => a + r.stars, 0) / rows.length) * 100) / 100 : null,
    spread,
    lessons: [...lessons].map(([node, l]) => ({ node, votes: l.votes, average: Math.round((l.sum / l.votes) * 100) / 100 })).sort((a, b) => a.node.localeCompare(b.node, 'en', { numeric: true })),
  })
}

/**
 * How people use the app and whether it works, worked out from the progress documents learners have already synced:
 * nothing extra is asked of them. "Came back after N days" counts learners who were active on or after the Nth day since
 * they signed up, among those who signed up at least N days ago.
 */
async function adminMetrics(env: Env) {
  const perLearner = (
    await env.DB.prepare(
      `SELECT u.created_at AS createdAt, COALESCE(p.lessons, 0) AS lessons, COALESCE(p.words, 0) AS words,
              (SELECT MAX(d.key) FROM json_each(p.data, '$.dailyXp') d WHERE d.value > 0) AS lastDay,
              (SELECT COUNT(*) FROM json_each(p.data, '$.dailyXp') d WHERE d.value > 0) AS activeDays,
              EXISTS (SELECT 1 FROM json_each(p.data, '$.nodes') n WHERE n.key LIKE '%-cp') AS finishedProvince
       FROM users u LEFT JOIN progress p ON p.user_id = u.id`,
    ).all<{ createdAt: number; lessons: number; words: number; lastDay: string | null; activeDays: number | null; finishedProvince: number | null }>()
  ).results
  // Reviews of cards that were due (state 2 = review): the share the learner still remembered (grade 2 hard or better).
  const recall = await env.DB.prepare(
    `SELECT COUNT(*) AS reviews, COALESCE(SUM(CASE WHEN json_extract(r.value, '$.r') >= 2 THEN 1 ELSE 0 END), 0) AS remembered
     FROM progress p, json_each(p.data, '$.reviews') r WHERE json_extract(r.value, '$.s') = 2`,
  ).first<{ reviews: number; remembered: number }>()
  const lessonTime = await env.DB.prepare(
    `SELECT COUNT(*) AS lessons, AVG(json_extract(e.value, '$.durationMs')) AS averageMs
     FROM progress p, json_each(p.data, '$.outbox') e`,
  ).first<{ lessons: number; averageMs: number | null }>()

  const now = Date.now()
  const retention = [1, 7, 30].map((days) => {
    const cohort = perLearner.filter((l) => now - l.createdAt >= days * 86_400_000)
    const returned = cohort.filter((l) => {
      const due = new Date(l.createdAt + days * 86_400_000).toISOString().slice(0, 10)
      return !!l.lastDay && l.lastDay >= due
    })
    return { days, eligible: cohort.length, returned: returned.length }
  })
  const n = perLearner.length
  const sum = (f: (l: (typeof perLearner)[number]) => number) => perLearner.reduce((a, l) => a + f(l), 0)
  return json({
    learners: n,
    retention,
    funnel: {
      registered: n,
      firstLesson: perLearner.filter((l) => l.lessons >= 1).length,
      fiveLessons: perLearner.filter((l) => l.lessons >= 5).length,
      finishedProvince: perLearner.filter((l) => l.finishedProvince).length,
    },
    recall: { reviews: recall?.reviews ?? 0, remembered: recall?.remembered ?? 0 },
    averageLessonSeconds: lessonTime?.averageMs ? Math.round(lessonTime.averageMs / 1000) : null,
    averageActiveDays: n ? Math.round((sum((l) => l.activeDays ?? 0) / n) * 10) / 10 : null,
    averageLessons: n ? Math.round((sum((l) => l.lessons) / n) * 10) / 10 : null,
    averageWords: n ? Math.round((sum((l) => l.words) / n) * 10) / 10 : null,
  })
}

// ---- Routing ----

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const { pathname } = url
  try {
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/admin')) return env.ASSETS.fetch(request)

    if (request.method !== 'GET' && request.method !== 'HEAD' && !sameOrigin(request)) return json({ error: 'forbidden' }, 403)

    // Limits come before any database work, so what they turn away costs D1 nothing. Per address for everyone, a looser
    // per-address one for signing in (a class signs in from one address), and per device (session) once signed in.
    const ip = request.headers.get('cf-connecting-ip') ?? 'local'
    if (!(await allowed(env.RL_IP, ip))) return tooMany()
    if ((pathname.startsWith('/api/auth/google/') || pathname === '/api/auth/dev') && !(await allowed(env.RL_AUTH, ip))) return tooMany()
    const sid = cookies(request)[SESSION_COOKIE]
    if (sid) {
      if (!(await allowed(env.RL_USER, sid))) return tooMany()
      if (pathname === '/api/progress' && request.method === 'PUT' && !(await allowed(env.RL_WRITE, sid))) return tooMany()
    }

    if (pathname === '/api/me' && request.method === 'GET') {
      const user = await currentUser(request, env)
      return json({
        user: user && publicUser(env, user),
        google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        dev: env.DEV_LOGIN === '1',
      })
    }
    if (pathname === '/api/auth/google/start' && request.method === 'POST') return googleStart(request, env)
    if (pathname === '/api/auth/google/finish' && request.method === 'POST') return googleFinish(request, env)
    if (pathname === '/api/auth/dev' && request.method === 'POST') return devLogin(request, env)
    if (pathname === '/api/auth/logout' && request.method === 'POST') return logout(request, env)

    const user = await currentUser(request, env)
    if (pathname === '/admin' || pathname === '/admin/') {
      if (!user || !isAdmin(env, user)) return Response.redirect(`${url.origin}/`, 302)
      return adminPage(user.email)
    }
    if (!user) return json({ error: 'unauthorized' }, 401)

    if (pathname === '/api/me' && request.method === 'DELETE') return deleteAccount(request, env, user)
    if (pathname === '/api/progress' && request.method === 'GET') return getProgress(env, user)
    if (pathname === '/api/progress' && request.method === 'PUT') return putProgress(request, env, user)
    if (pathname === '/api/admin/users' && request.method === 'GET') {
      return isAdmin(env, user) ? adminUsers(env) : json({ error: 'forbidden' }, 403)
    }
    if (pathname === '/api/admin/metrics' && request.method === 'GET') {
      return isAdmin(env, user) ? cachedAdmin('metrics', () => adminMetrics(env)) : json({ error: 'forbidden' }, 403)
    }
    if (pathname === '/api/admin/ratings' && request.method === 'GET') {
      return isAdmin(env, user) ? cachedAdmin('ratings', () => adminRatings(env)) : json({ error: 'forbidden' }, 403)
    }
    return json({ error: 'not_found' }, 404)
  } catch (err) {
    console.error(err)
    return json({ error: 'server_error' }, 500)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return withSecurityHeaders(await route(request, env))
  },
} satisfies ExportedHandler<Env>
