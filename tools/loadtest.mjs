// Simulates N learners opening the app at once against the deployed site.
// Usage: node tools/loadtest.mjs [url] [users] [rounds]
// Each learner loads the page, the JS/CSS/fonts from app/dist, a few audio clips and brand images,
// then calls /api/me (the only part that runs the Worker). Prints latency per kind of request.
import { readdirSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

const base = (process.argv[2] ?? 'https://mandarin-deploy.mandarinjourney.workers.dev').replace(/\/$/, '')
const users = Number(process.argv[3] ?? 20)
const rounds = Number(process.argv[4] ?? 3)

const dist = new URL('../app/dist/', import.meta.url)
// File names change on every build, so read them from the live site: the entry files from the page, the lazy chunks from the entry script.
const html = await (await fetch(base + '/')).text()
const entry = [...html.matchAll(/\/assets\/[\w.-]+\.(?:js|css)/g)].map((m) => m[0])
const entryJs = await (await fetch(base + entry.find((f) => f.endsWith('.js')))).text()
const lazy = [...entryJs.matchAll(/(?:\.\/|assets\/)([\w.-]+\.(?:js|css|woff2))/g)].map((m) => `/assets/${m[1]}`)
const assets = [...new Set([...entry, ...lazy])]
const audio = readdirSync(new URL('audio/zh-CN-XiaoxiaoNeural/', dist)).slice(0, 8).map((f) => `/audio/zh-CN-XiaoxiaoNeural/${f}`)
const brand = readdirSync(new URL('brand/', dist)).map((f) => `/brand/${f}`)

const samples = { page: [], assets: [], audio: [], brand: [], api: [] }
const statuses = {}
const cache = {}

async function hit(kind, path) {
  const t0 = performance.now()
  try {
    const res = await fetch(base + path, { headers: { 'cache-control': 'no-cache' } })
    await res.arrayBuffer()
    samples[kind].push(performance.now() - t0)
    statuses[res.status] = (statuses[res.status] ?? 0) + 1
    const c = res.headers.get('cf-cache-status') ?? '-'
    cache[c] = (cache[c] ?? 0) + 1
  } catch (e) {
    statuses.error = (statuses.error ?? 0) + 1
  }
}

async function learner() {
  await hit('page', '/')
  await Promise.all(assets.map((p) => hit('assets', p)))
  await Promise.all([...brand].map((p) => hit('brand', p)))
  for (const p of audio) await hit('audio', p)
  await hit('api', '/api/me')
}

const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((a.length * p) / 100))]
const t0 = performance.now()
for (let r = 1; r <= rounds; r++) {
  await Promise.all(Array.from({ length: users }, learner))
  console.log(`round ${r}/${rounds} done`)
}
const secs = (performance.now() - t0) / 1000

console.log(`\n(${assets.length} files from /assets)`)
console.log(`\n${users} simultaneous learners x ${rounds} rounds against ${base} (${secs.toFixed(1)} s)\n`)
console.log('kind     requests   p50 ms   p95 ms   max ms')
for (const [k, a] of Object.entries(samples)) {
  if (!a.length) continue
  console.log(`${k.padEnd(8)} ${String(a.length).padStart(8)} ${pct(a, 50).toFixed(0).padStart(8)} ${pct(a, 95).toFixed(0).padStart(8)} ${Math.max(...a).toFixed(0).padStart(8)}`)
}
console.log('\nHTTP status:', statuses)
console.log('cf-cache-status:', cache)
