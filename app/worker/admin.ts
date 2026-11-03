// The admin page: who has signed up and how far they are. Served by the Worker, so none of it ships in the app's bundle.
// It is only sent to an admin (see /admin in index.ts), and /api/admin/users checks again.

export function adminPage(email: string): Response {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Mandarin Journey · Learners</title>
<style nonce="${nonce}">
  :root { color-scheme: light dark; --paper: #fbf7f0; --card: #fff; --ink: #2b2420; --muted: #8b7f75; --line: #ece2d4; --brand: #e0453a; }
  @media (prefers-color-scheme: dark) { :root { --paper: #2c2a38; --card: #3a364e; --ink: #f3ece1; --muted: #8e8aa6; --line: #35324a; --brand: #d9605f; } }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.4 system-ui, sans-serif; }
  main { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  h2 { margin: 32px 0 4px; font-size: 18px; }
  .muted { color: var(--muted); }
  .stats { display: flex; gap: 12px; flex-wrap: wrap; margin: 20px 0; }
  .stat { background: var(--card); border: 2px solid var(--line); border-radius: 16px; padding: 12px 16px; min-width: 110px; }
  .stat b { display: block; font-size: 24px; }
  .wrap { overflow-x: auto; background: var(--card); border: 2px solid var(--line); border-radius: 16px; }
  table { border-collapse: collapse; width: 100%; white-space: nowrap; }
  th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--line); }
  th { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
  td.n, th.n { text-align: right; }
  tr:last-child td { border-bottom: 0; }
  a { color: var(--brand); }
</style>
</head>
<body>
<main>
  <h1>Learners</h1>
  <p class="muted">Signed in as <span id="me"></span> · <a href="/">Back to the app</a></p>
  <div class="stats" id="stats"></div>
  <h2>Do they come back?</h2>
  <p class="muted">Learners who were active on or after day N since signing up, among those who signed up at least N days ago.</p>
  <div class="stats" id="retention"></div>
  <h2>How far do they get?</h2>
  <div class="stats" id="funnel"></div>
  <h2>Are they learning?</h2>
  <div class="stats" id="learning"></div>
  <p class="muted">Only people with an account are counted, so these are minimums.</p>
  <h2>Learners</h2>
  <div class="wrap">
    <table>
      <thead><tr><th>Learner</th><th>Joined</th><th>Last seen</th><th class="n">XP</th><th class="n">Streak</th><th class="n">Lessons</th><th class="n">Words</th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
  </div>
  <p class="muted" id="empty" hidden>Nobody has signed in yet.</p>
  <h2>Lesson ratings</h2>
  <p class="muted" id="rating-sum"></p>
  <div class="wrap" id="rating-wrap" hidden>
    <table>
      <thead><tr><th>Lesson</th><th class="n">Votes</th><th class="n">Average</th></tr></thead>
      <tbody id="rating-rows"></tbody>
    </table>
  </div>
</main>
<script nonce="${nonce}">
  document.getElementById('me').textContent = ${JSON.stringify(email).replaceAll('<', '\\u003c')}
  const day = (ms) => (ms ? new Date(ms).toLocaleDateString() : '—')
  const ago = (ms) => {
    const m = Math.round((Date.now() - ms) / 60000)
    if (m < 2) return 'just now'
    if (m < 90) return m + ' min ago'
    const h = Math.round(m / 60)
    return h < 36 ? h + ' h ago' : Math.round(h / 24) + ' days ago'
  }
  const cell = (tr, text, cls) => { const td = document.createElement('td'); td.textContent = text; if (cls) td.className = cls; tr.appendChild(td); return td }
  fetch('/api/admin/users').then((r) => r.json()).then(({ users }) => {
    const week = Date.now() - 7 * 86400000
    const stats = [['Learners', users.length], ['Active this week', users.filter((u) => u.lastSeenAt > week).length], ['Lessons done', users.reduce((a, u) => a + (u.lessons || 0), 0)]]
    for (const [label, value] of stats) {
      const box = document.createElement('div'); box.className = 'stat'
      const b = document.createElement('b'); b.textContent = value
      box.append(b, label); document.getElementById('stats').appendChild(box)
    }
    document.getElementById('empty').hidden = users.length > 0
    for (const u of users) {
      const tr = document.createElement('tr')
      const who = cell(tr, u.name + ' ')
      const mail = document.createElement('span'); mail.className = 'muted'; mail.textContent = u.email
      who.appendChild(mail)
      cell(tr, day(u.createdAt)); cell(tr, ago(u.lastSeenAt))
      cell(tr, u.xp ?? '—', 'n'); cell(tr, u.streak ?? '—', 'n'); cell(tr, u.lessons ?? '—', 'n'); cell(tr, u.words ?? '—', 'n')
      document.getElementById('rows').appendChild(tr)
    }
  })
  const tile = (parent, value, label, detail) => {
    const box = document.createElement('div'); box.className = 'stat'
    const b = document.createElement('b'); b.textContent = value
    box.append(b, label)
    if (detail) { const d = document.createElement('div'); d.className = 'muted'; d.style.fontSize = '12px'; d.textContent = detail; box.appendChild(d) }
    document.getElementById(parent).appendChild(box)
  }
  const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—')
  const of = (a, b) => a + ' of ' + b
  fetch('/api/admin/metrics').then((r) => r.json()).then((m) => {
    for (const r of m.retention) tile('retention', pct(r.returned, r.eligible), 'Back after ' + r.days + (r.days === 1 ? ' day' : ' days'), r.eligible ? of(r.returned, r.eligible) : 'too early to tell')
    const f = m.funnel
    tile('funnel', of(f.firstLesson, f.registered), 'Did a first lesson', pct(f.firstLesson, f.registered))
    tile('funnel', of(f.fiveLessons, f.registered), 'Did 5 or more lessons', pct(f.fiveLessons, f.registered))
    tile('funnel', of(f.finishedProvince, f.registered), 'Finished a province', pct(f.finishedProvince, f.registered))
    tile('funnel', m.averageLessons ?? '—', 'Lessons per learner')
    tile('learning', m.recall.reviews ? pct(m.recall.remembered, m.recall.reviews) : '—', 'Remembered on review', m.recall.reviews ? of(m.recall.remembered, m.recall.reviews) + ' reviews of due cards' : 'no reviews yet')
    tile('learning', m.averageWords ?? '—', 'Words in review per learner')
    tile('learning', m.averageActiveDays ?? '—', 'Days practised per learner')
    tile('learning', m.averageLessonSeconds ? Math.floor(m.averageLessonSeconds / 60) + ':' + String(m.averageLessonSeconds % 60).padStart(2, '0') : '—', 'Average lesson time')
  })
  fetch('/api/admin/ratings').then((r) => r.json()).then((r) => {
    const sum = document.getElementById('rating-sum')
    if (!r.votes) { sum.textContent = 'No lesson has been rated yet.'; return }
    sum.textContent = r.average.toFixed(2) + ' ★ average from ' + r.votes + ' ratings · ' + r.spread.map((n, i) => (i + 1) + '★ ' + n).join(' · ')
    document.getElementById('rating-wrap').hidden = false
    for (const l of r.lessons) {
      const tr = document.createElement('tr')
      cell(tr, l.node); cell(tr, l.votes, 'n'); cell(tr, l.average.toFixed(2) + ' ★', 'n')
      document.getElementById('rating-rows').appendChild(tr)
    }
  })
</script>
</body>
</html>`
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'content-security-policy': `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    },
  })
}
