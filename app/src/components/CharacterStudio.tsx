import { useState } from 'react'
import { FRIENDS, FRIEND_IDS, OUTFITS, OUTFIT_LABELS, outfitFor, type FriendId } from '../data/friends'
import { setOutfit, useProgress } from '../lib/progress'
import { Buddy } from './Friends'
import type { Mood } from './Mascot'

const MOODS: { id: Mood; label: string; wawaOnly?: boolean }[] = [
  { id: 'idle', label: 'Tranquilo' },
  { id: 'wave', label: 'Saluda', wawaOnly: true },
  { id: 'happy', label: 'Acierto' },
  { id: 'sad', label: 'Fallo' },
  { id: 'celebrate', label: 'Celebra' },
  { id: 'fire', label: 'Racha', wawaOnly: true },
]

const BLURB: Record<FriendId, string> = {
  wawa: 'La rana dorada de Panamá, símbolo de buena suerte aquí y en China.',
  harpia: 'El ave nacional de Panamá, lista para el desfile de noviembre.',
  sloth: 'Vive colgado en los árboles del Darién y nunca tiene prisa.',
  tucan: 'El tucán pico iris, el más colorido del bosque panameño.',
}

/** Pick a character, preview every pose, and choose what they wear. */
export function CharacterStudio() {
  const outfits = useProgress().outfits
  const [who, setWho] = useState<FriendId>('wawa')
  const [mood, setMood] = useState<Mood>('idle')
  const [moodKey, setMoodKey] = useState(0)
  const setting = outfits[who] ?? 'auto'
  const today = outfitFor(who, 'auto')
  const moods = MOODS.filter((m) => !m.wawaOnly || who === 'wawa')

  return (
    <section className="card overflow-hidden">
      <div className="flex justify-between gap-1 border-b-2 border-line bg-card px-2 pt-2">
        {FRIEND_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setWho(id)
              setMood('idle')
            }}
            className={`flex flex-1 flex-col items-center rounded-t-2xl pt-1 pb-1.5 text-xs font-extrabold ${
              who === id ? 'bg-gold/15 text-ink' : 'text-muted'
            }`}
          >
            <Buddy id={id} size={46} />
            {FRIENDS[id].name}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 bg-gold/15 px-5 pt-12 pb-5">
        <Buddy key={`${who}-${moodKey}`} id={who} mood={mood} size={180} />
        <p className="han mt-2 text-2xl font-bold">
          {FRIENDS[who].name} <span className="text-gold-dark">{FRIENDS[who].hanzi}</span>
        </p>
        <p className="text-sm font-bold text-muted">
          {FRIENDS[who].es} · <span className="han text-sky-dark">{FRIENDS[who].meaning}</span>
        </p>
        <p className="text-center text-sm text-muted">{BLURB[who]}</p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          {moods.map((m) => (
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

        <button
          type="button"
          onClick={() => setOutfit(who, 'auto')}
          className={`tile flex items-center gap-3 px-4 py-2 text-left ${setting === 'auto' ? 'tile-selected' : ''}`}
        >
          <Buddy id={who} outfit={today} size={56} />
          <span className="flex-1">
            <span className="block font-extrabold">Automática</span>
            <span className="block text-sm text-muted">Cambia de ropa cada día · hoy: {OUTFIT_LABELS[today]}</span>
          </span>
        </button>
        <div className="grid grid-cols-3 gap-2">
          {OUTFITS[who].options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutfit(who, o)}
              className={`tile flex flex-col items-center gap-1 px-1 pt-4 pb-2 ${setting === o ? 'tile-selected' : ''}`}
            >
              <Buddy id={who} outfit={o} size={68} />
              <span className="text-xs font-extrabold">{OUTFIT_LABELS[o]}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
