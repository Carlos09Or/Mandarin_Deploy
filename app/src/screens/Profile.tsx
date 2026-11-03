import { useRef, useState } from 'react'
import { PATH, WORDS } from '../data/course'
import {
  DAILY_GOAL,
  NICKNAME_MAX,
  GEMS,
  learnedWords,
  liveStreak,
  resetProgress,
  setNickname,
  setScenery,
  today,
  useProgress,
  type Scenery,
} from '../lib/progress'
import { IconFlame, IconGem, IconLock, IconStar } from '../components/icons'
import { CharacterStudio } from '../components/CharacterStudio'
import { Account } from '../components/Account'
import { downloadProgress, restoreProgress } from '../lib/backup'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const SCENERY: { id: Scenery; label: string; hint: string }[] = [
  { id: 'auto', label: 'Auto', hint: 'Follows your clock: night from 7 pm to 6 am.' },
  { id: 'day', label: '☀️ Day', hint: 'Always daytime.' },
  { id: 'night', label: '🌙 Night', hint: 'Always night: city lights and a darker sea.' },
]

// Ideas only: each teacher will choose which rewards exist in their class.
const REWARD_IDEAS = [
  { title: 'An extra point on a quiz', cost: 300 },
  { title: 'A hint in the oral exam', cost: 200 },
  { title: 'Choose the next practice topic', cost: 100 },
]

export function Profile() {
  const p = useProgress()
  const [confirm, setConfirm] = useState(false)
  const answers = Object.values(p.words)
  const right = answers.reduce((a, s) => a + s.correct, 0)
  const total = answers.reduce((a, s) => a + s.correct + s.wrong, 0)

  const week = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { label: DAYS[d.getDay()], xp: p.dailyXp[today(d)] ?? 0, isToday: i === 6 }
  })
  const max = Math.max(DAILY_GOAL, ...week.map((d) => d.xp))

  const stats = [
    { value: liveStreak(p), label: 'Day streak', icon: <IconFlame className="h-7 w-7 text-brand" /> },
    { value: p.xp, label: 'Total XP', icon: <IconStar className="h-7 w-7 text-gold" /> },
    { value: `${learnedWords(p).length}/${WORDS.length}`, label: 'Words', icon: <span className="han text-2xl text-sky">词</span> },
    {
      value: `${PATH.filter((n) => p.nodes[n.id]).length}/${PATH.length}`,
      label: 'Lessons',
      icon: <span className="han text-2xl text-jade">课</span>,
    },
    { value: Object.keys(p.chars).length, label: 'Characters written', icon: <span className="han text-2xl text-jade">写</span> },
    { value: total ? `${Math.round((right / total) * 100)}%` : '—', label: 'Accuracy', icon: <span className="han text-2xl text-gold-dark">准</span> },
  ]

  const fileInput = useRef<HTMLInputElement>(null)
  const [restored, setRestored] = useState<'ok' | 'bad' | null>(null)
  const [name, setName] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-8 pb-10">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-black">{p.nickname ? `Hi, ${p.nickname}!` : 'Hi!'}</h2>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-muted">
          Your name
          <input
            value={name ?? p.nickname}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name !== null) setNickname(name)
              setName(null)
            }}
            maxLength={NICKNAME_MAX}
            autoComplete="nickname"
            className="rounded-2xl border-2 border-line-dark bg-card px-4 py-2.5 text-base font-bold text-ink"
          />
        </label>
      </section>

      <CharacterStudio />

      <section>
        <h2 className="mb-4 text-2xl font-black">Stats</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card flex items-center gap-3 p-4">
              <span className="flex w-8 justify-center">{s.icon}</span>
              <div>
                <p className="text-xl leading-none font-black">{s.value}</p>
                <p className="mt-1 text-xs font-bold text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center gap-4 bg-sky-soft p-5">
          <IconGem className="h-14 w-14 shrink-0" />
          <div className="flex-1">
            <p className="text-3xl leading-none font-black text-sky-dark">{p.gems}</p>
            <p className="mt-1 font-bold text-sky-dark">gems</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-sky-dark">Coming soon</span>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <h3 className="font-black">Class rewards</h3>
          <p className="text-sm text-muted">
            Your teacher will decide what gems can be traded for in their course. Some ideas:
          </p>
          {REWARD_IDEAS.map((r) => (
            <div key={r.title} className="flex items-center gap-3 rounded-2xl border-2 border-line px-4 py-3">
              <IconLock className="h-5 w-5 shrink-0 text-line-dark" />
              <span className="flex-1 font-bold">{r.title}</span>
              <span className="flex items-center gap-1 font-black text-sky-dark">
                {r.cost} <IconGem className="h-4 w-4" />
              </span>
            </div>
          ))}
          <p className="text-xs text-muted">
            You earn {GEMS.lesson} gems per lesson, {GEMS.perfect} more with no mistakes, and {GEMS.dailyGoal} for reaching
            your daily goal.
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-black">Last 7 days</h3>
        <div className="mt-4 flex h-36 items-end gap-2">
          {week.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted">{d.xp || ''}</span>
              <div
                className={`w-full max-w-9 rounded-t-lg ${d.xp >= DAILY_GOAL ? 'bg-gold' : 'bg-gold/45'}`}
                style={{ height: `${Math.max(4, (d.xp / max) * 96)}px` }}
              />
              <span className={`text-xs font-extrabold ${d.isToday ? 'text-ink' : 'text-muted'}`}>{d.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Daily goal: {DAILY_GOAL} XP (about 3 lessons).</p>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h3 className="font-black">Day &amp; night</h3>
        <div className="grid grid-cols-3 gap-2">
          {SCENERY.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenery(s.id)}
              className={`tile py-2.5 text-sm font-extrabold ${p.scenery === s.id ? 'tile-selected' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{SCENERY.find((s) => s.id === p.scenery)?.hint}</p>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h3 className="font-black">Your account</h3>
        <Account />
        <h3 className="mt-2 font-black">Your data</h3>
        <p className="text-sm text-muted">
          A downloaded file is a backup you can keep anywhere. Restoring one adds it to what is here; nothing is lost.
        </p>
        {restored && (
          <p className={`text-sm font-bold ${restored === 'ok' ? 'text-jade-dark' : 'text-wrong'}`}>
            {restored === 'ok' ? 'Backup restored.' : 'That file is not a Mandarin Journey backup.'}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={downloadProgress} className="btn btn-ghost flex-1">
            Download my data
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-ghost flex-1">
            Restore from a file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void restoreProgress(file).then(setRestored)
            }}
          />
          {confirm ? (
            <button
              type="button"
              onClick={() => {
                resetProgress()
                setConfirm(false)
              }}
              className="btn btn-wrong flex-1"
            >
              Yes, erase everything
            </button>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="btn btn-ghost flex-1 text-wrong">
              Reset progress
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
