// Checks a running copy of the app from the outside: security headers on pages, assets and API answers, and that
// the API refuses what it should (no session, wrong origin, oversized or bad bodies, non-admins).
// Usage: node tools/securitycheck.mjs [url] [--signups-closed]
//   url: default is the deployed site; use http://localhost:8787 for `npm run dev:api`.
//   --signups-closed: the target runs with SIGNUPS_OPEN=0; checks that new accounts are refused and existing ones still sign in.
// With DEV_LOGIN=1 on the target (local only) it also signs in as a normal learner and checks the admin routes and progress limits.

const args = process.argv.slice(2)
const closed = args.includes('--signups-closed')
const base = (args.find((a) => !a.startsWith('--')) ?? 'https://mandarin-deploy.mandarinjourney.workers.dev').replace(/\/$/, '')
const https = base.startsWith('https:')
let failed = 0
const ok = (name, pass, detail = '') => {
  if (!pass) failed++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : detail ? `  (${detail})` : ''}`)
}
const call = (path, init = {}) => fetch(base + path, { redirect: 'manual', ...init })

// ---- Headers ----
const expectHeaders = async (label, path) => {
  const res = await call(path)
  const h = (n) => res.headers.get(n) ?? ''
  const csp = h('content-security-policy')
  if (https) ok(`${label}: Strict-Transport-Security`, /max-age=\d{7,}/.test(h('strict-transport-security')), h('strict-transport-security') || 'missing')
  ok(`${label}: X-Content-Type-Options nosniff`, h('x-content-type-options') === 'nosniff', h('x-content-type-options') || 'missing')
  ok(`${label}: Referrer-Policy`, /strict-origin/.test(h('referrer-policy')), h('referrer-policy') || 'missing')
  ok(`${label}: Permissions-Policy`, /camera=\(\)/.test(h('permissions-policy')), h('permissions-policy') || 'missing')
  ok(`${label}: CSP forbids framing`, /frame-ancestors 'none'/.test(csp), csp || 'missing')
  return { res, csp }
}
const page = await expectHeaders('page /', '/')
ok('page /: CSP has no unsafe-inline for scripts', !/script-src[^;]*'unsafe-inline'/.test(page.csp) && !/script-src[^;]*'unsafe-eval'/.test(page.csp), page.csp)
ok('page /: CSP limits scripts to self and hashes', /script-src 'self'( 'sha256-[^']+')+/.test(page.csp), page.csp)
await expectHeaders('asset /manifest.webmanifest', '/manifest.webmanifest')
await expectHeaders('API /api/me', '/api/me')

// ---- The API refuses what it should ----
const me = await (await call('/api/me')).json()
ok('/api/me without a session says no user', me.user === null)
ok('/api/progress without a session is 401', (await call('/api/progress')).status === 401)
ok('/api/admin/users without a session is 401', (await call('/api/admin/users')).status === 401)
const admin = await call('/admin')
ok('/admin without a session redirects away', admin.status === 302 && !(await admin.text()).includes('Learners'), `status ${admin.status}`)
const put = (headers, body) => call('/api/progress', { method: 'PUT', headers: { 'content-type': 'application/json', ...headers }, body })
ok('PUT /api/progress from another origin is 403', (await put({ origin: 'https://evil.example' }, '{}')).status === 403)
ok('PUT /api/progress with no Origin is 403', (await put({}, '{}')).status === 403)
ok('DELETE /api/me from another origin is 403', (await call('/api/me', { method: 'DELETE', headers: { origin: 'https://evil.example' } })).status === 403)
ok('POST /api/auth/logout from another origin is 403', (await call('/api/auth/logout', { method: 'POST', headers: { origin: 'https://evil.example' } })).status === 403)
ok('Google finish without the sign-in cookie is refused', [400, 503].includes((await call('/api/auth/google/finish', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ code: 'x', state: 'y' }) })).status))
// Dev login is on by design in `npm run dev:api`; on a deployed site it must not exist.
if (https) ok('dev login is off', me.dev === false && (await call('/api/auth/dev', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.c' }) })).status === 404)
ok('a session cookie that was never issued is not accepted', (await call('/api/progress', { headers: { cookie: 'sid=not-a-real-token' } })).status === 401)

// ---- Signed in as a normal learner (local dev login only) ----
if (me.dev && !closed) {
  const email = `learner-${Date.now()}@example.test`
  const login = await call('/api/auth/dev', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ email }) })
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
  ok('dev login gives an HttpOnly, SameSite cookie', /HttpOnly/i.test(login.headers.get('set-cookie') ?? '') && /SameSite=Lax/i.test(login.headers.get('set-cookie') ?? ''))
  const auth = { origin: base, cookie, 'content-type': 'application/json' }
  for (const path of ['/api/admin/users', '/api/admin/metrics', '/api/admin/ratings']) {
    ok(`${path} is 403 for a normal learner`, (await call(path, { headers: auth })).status === 403)
  }
  const adminPage = await call('/admin', { headers: auth })
  ok('/admin redirects a normal learner', adminPage.status === 302)
  const send = (body) => call('/api/progress', { method: 'PUT', headers: auth, body })
  ok('progress that is not JSON is 400', (await send('{nope')).status === 400)
  ok('progress without v:1 is 400', (await send(JSON.stringify({ base: 0, data: { v: 2 } }))).status === 400)
  ok('progress over the size limit is 413', (await send(JSON.stringify({ base: 0, data: { v: 1, junk: 'x'.repeat(1_600_000) } }))).status === 413)
  ok('progress with a 9-star rating is 400', (await send(JSON.stringify({ base: 0, data: { v: 1, ratings: { '1-1': { stars: 9, at: 1 } } } }))).status === 400)
  ok('progress with a lesson that lasted a month is 400', (await send(JSON.stringify({ base: 0, data: { v: 1, outbox: [{ type: 'lesson_completed', node: '1-1', at: 'x', durationMs: 2.6e9 }] } }))).status === 400)
  ok('a valid first save works', (await send(JSON.stringify({ base: 0, data: { v: 1, xp: 5 } }))).status === 200)
  ok('saving on a stale version is 409', (await send(JSON.stringify({ base: 0, data: { v: 1, xp: 6 } }))).status === 409)
  await call('/api/me', { method: 'DELETE', headers: auth })

  // ---- Sessions are capped: only the newest 10 sign-ins of one learner stay valid ----
  const same = `sessions-${Date.now()}@example.test`
  const cookies = []
  for (let i = 0; i < 12; i++) {
    const r = await call('/api/auth/dev', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ email: same }) })
    cookies.push((r.headers.get('set-cookie') ?? '').split(';')[0])
  }
  const status = async (c) => (await call('/api/progress', { headers: { cookie: c } })).status
  ok('the oldest of 12 sign-ins no longer works', (await status(cookies[0])) === 401)
  ok('the newest sign-in works', (await status(cookies[11])) !== 401)
  let valid = 0
  for (const c of cookies) if ((await status(c)) !== 401) valid++
  ok('exactly 10 sessions stay valid', valid === 10, `${valid} valid`)
  await call('/api/me', { method: 'DELETE', headers: { origin: base, cookie: cookies[11] } })

  // ---- Rate limit: a device that saves in a loop is turned away with 429 + Retry-After (needs the limiter binding: deployed, or wrangler dev) ----
  const spam = (await call('/api/auth/dev', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ email: `spam-${Date.now()}@example.test` }) })).headers.get('set-cookie').split(';')[0]
  const spamHeaders = { origin: base, cookie: spam, 'content-type': 'application/json' }
  const codes = []
  let retryAfter = null
  for (let i = 0; i < 40; i++) {
    const r = await call('/api/progress', { method: 'PUT', headers: spamHeaders, body: JSON.stringify({ base: i === 0 ? 0 : 1, data: { v: 1, xp: i } }) })
    codes.push(r.status)
    if (r.status === 429) retryAfter ??= r.headers.get('retry-after')
  }
  const limited = codes.filter((c) => c === 429).length
  ok('40 saves in a row: some are turned away with 429', limited > 0, `statuses: ${[...new Set(codes)].join(',')}`)
  ok('...but not all of them (the first ones went through)', limited < 40 && codes[0] !== 429)
  ok('429 carries Retry-After', limited === 0 || retryAfter === '30', String(retryAfter))
  ok('another device (session) of the same learner is not limited', (await (async () => {
    const r = await call('/api/auth/dev', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ email: `spam-other-${Date.now()}@example.test` }) })
    const c = (r.headers.get('set-cookie') ?? '').split(';')[0]
    return (await call('/api/progress', { headers: { cookie: c } })).status
  })()) === 200)
  await call('/api/me', { method: 'DELETE', headers: { origin: base, cookie: spam } })
}

// ---- New accounts paused (target started with SIGNUPS_OPEN=0) ----
if (closed) {
  const dev = (email) => call('/api/auth/dev', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ email }) })
  const fresh = await dev(`new-${Date.now()}@example.test`)
  ok('a new learner is refused while sign-ups are paused', fresh.status === 403 && (await fresh.json()).error === 'signups_closed', `status ${fresh.status}`)
}

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
