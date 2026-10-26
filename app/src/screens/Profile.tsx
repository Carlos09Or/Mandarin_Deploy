import { useState } from 'react'
import { PATH, WORDS } from '../data/course'
import { DAILY_GOAL, learnedWords, liveStreak, resetProgress, today, useProgress } from '../lib/progress'
import { IconFlame, IconStar } from '../components/icons'

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

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
