import { useState } from 'react'
import { PATH, WORDS } from '../data/course'
import {
  DAILY_GOAL,
  GEMS,
  learnedWords,
  liveStreak,
  lookFor,
  resetProgress,
  setLook,
  today,
  useProgress,
  type Look,
} from '../lib/progress'
import { IconFlame, IconGem, IconLock, IconStar } from '../components/icons'
import { Mascot, type Mood } from '../components/Mascot'
import { FriendScene } from '../components/Friends'
import { FRIENDS, type FriendId } from '../data/friends'

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const LOOKS: { id: Look; label: string }[] = [
  { id: 'sombrero', label: 'Sombrero pintao' },
  { id: 'panuelo', label: 'Pañuelo rojo' },
  { id: 'clasica', label: 'Sin nada' },
]
const lookLabel = (l: Look) => LOOKS.find((x) => x.id === l)!.label
const MOODS: { id: Mood; label: string }[] = [
  { id: 'idle', label: 'Tranquila' },
  { id: 'wave', label: 'Saluda' },
  { id: 'happy', label: 'Acierto' },
  { id: 'sad', label: 'Fallo' },
  { id: 'celebrate', label: 'Celebra' },
  { id: 'fire', label: 'Racha' },
]

// Ideas only: each teacher will choose which rewards exist in their class.
const REWARD_IDEAS = [
  { title: 'Punto extra en un quiz', cost: 300 },
  { title: 'Pista en la evaluación oral', cost: 200 },
  { title: 'Elegir el tema de la próxima práctica', cost: 100 },
]

export function Profile() {
  const p = useProgress()
  const [confirm, setConfirm] = useState(false)
  const [mood, setMood] = useState<Mood>('wave')
  const [moodKey, setMoodKey] = useState(0)
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
    { value: liveStreak(p), label: 'Días de racha', icon: <IconFlame className="h-7 w-7 text-brand" /> },
    { value: p.xp, label: 'XP total', icon: <IconStar className="h-7 w-7 text-gold" /> },
    { value: `${learnedWords(p).length}/${WORDS.length}`, label: 'Palabras', icon: <span className="han text-2xl text-sky">词</span> },
    {
      value: `${PATH.filter((n) => p.nodes[n.id]).length}/${PATH.length}`,
      label: 'Lecciones',
      icon: <span className="han text-2xl text-jade">课</span>,
    },
    { value: Object.keys(p.chars).length, label: 'Caracteres escritos', icon: <span className="han text-2xl text-jade">写</span> },
    { value: total ? `${Math.round((right / total) * 100)}%` : '—', label: 'Precisión', icon: <span className="han text-2xl text-gold-dark">准</span> },
  ]

  const download = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mandarin-progreso-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <section className="card overflow-hidden">
        <div className="flex flex-col items-center gap-2 bg-gold/15 px-5 pt-10 pb-5">
          <Mascot key={moodKey} mood={mood} size={180} />
          <p className="han mt-2 text-2xl font-bold">
            Wāwa <span className="text-gold-dark">蛙蛙</span>
          </p>
          <p className="text-center text-sm text-muted">La rana dorada de Panamá, símbolo de buena suerte aquí y en China.</p>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <button
            type="button"
            onClick={() => setLook('auto')}
            className={`tile flex items-center gap-3 px-4 py-2 text-left ${p.look === 'auto' ? 'tile-selected' : ''}`}
          >
            <Mascot look={lookFor('auto')} size={56} />
            <span className="flex-1">
              <span className="block font-extrabold">Automática</span>
              <span className="block text-sm text-muted">Cambia de ropa cada día · hoy: {lookLabel(lookFor('auto'))}</span>
            </span>
          </button>
          <div className="grid grid-cols-3 gap-2">
            {LOOKS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLook(l.id)}
                className={`tile flex flex-col items-center gap-1 px-1 pt-3 pb-2 ${p.look === l.id ? 'tile-selected' : ''}`}
              >
                <Mascot look={l.id} size={64} />
                <span className="text-xs font-extrabold">{l.label}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMood(m.id)
                  setMoodKey((k) => k + 1)
                }}
                className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${
                  mood === m.id ? 'border-sky bg-sky-soft text-sky-dark' : 'border-line text-muted'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-2xl font-black">Amigos de Wāwa</h2>
        <p className="mb-4 text-sm text-muted">Animales de Panamá que te acompañan en el camino. Su nombre es una palabra en chino.</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(FRIENDS) as FriendId[]).map((id) => (
            <div key={id} className="card flex flex-col items-center gap-1 px-3 pt-6 pb-4 text-center">
              <div className="flex h-32 items-end justify-center">
                <FriendScene id={id} size={120} />
              </div>
              <p className="mt-2 font-black">
                {FRIENDS[id].name} <span className="han text-gold-dark">{FRIENDS[id].hanzi}</span>
              </p>
              <p className="text-sm font-bold text-muted">{FRIENDS[id].es}</p>
              <p className="han text-xs text-sky-dark">{FRIENDS[id].meaning}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black">Estadísticas</h2>
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
            <p className="mt-1 font-bold text-sky-dark">gemas</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-sky-dark">Próximamente</span>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <h3 className="font-black">Recompensas de clase</h3>
          <p className="text-sm text-muted">
            Tu profesor decidirá qué se puede canjear con gemas en su curso. Algunas ideas:
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
            Ganas {GEMS.lesson} gemas por lección, {GEMS.perfect} más si no tienes errores y {GEMS.dailyGoal} al cumplir
            tu meta diaria.
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-black">Últimos 7 días</h3>
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
        <p className="mt-3 text-sm text-muted">Meta diaria: {DAILY_GOAL} XP (unas 3 lecciones).</p>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h3 className="font-black">Tus datos</h3>
        <p className="text-sm text-muted">
          Tu progreso se guarda en este dispositivo. Pronto podrás crear una cuenta para sincronizarlo y unirte a la clase
          de tu profesor.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={download} className="btn btn-ghost flex-1">
            Descargar mis datos
          </button>
          {confirm ? (
            <button
              type="button"
              onClick={() => {
                resetProgress()
                setConfirm(false)
              }}
              className="btn btn-wrong flex-1"
            >
              Sí, borrar todo
            </button>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="btn btn-ghost flex-1 text-wrong">
              Reiniciar progreso
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
