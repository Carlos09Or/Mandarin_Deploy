import { useMemo, useState } from 'react'
import { WORDS, accentFor, plainPinyin, word } from '../data/course'
import { deckRows, deckWords, dueCount, dueNow, statsOf, wholeUnits } from '../lib/cards'
import { learnedWords, setStudyOptions, useProgress } from '../lib/progress'
import { WordSheet } from '../components/WordSheet'
import { AudioButton } from '../components/AudioButton'
import { CardSession, type SessionMode } from './CardSession'

type Props = { onWrite: (char: string, n: number) => void }
type Section = 'study' | 'stats' | 'words'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'study', label: 'Study' },
  { id: 'stats', label: 'Stats' },
  { id: 'words', label: 'Words' },
]

/** Spaced-repetition cards in the style of Anki, with their statistics and the dictionary. */
export function Review({ onWrite }: Props) {
  const [section, setSection] = useState<Section>('study')
  // `key` starts a fresh session when one ends and the learner asks for another.
  const [session, setSession] = useState<{ mode: SessionMode; pool?: number[]; key: number } | null>(null)
  const begin = (mode: SessionMode, pool?: number[]) => setSession({ mode, pool, key: Date.now() })
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex rounded-2xl border-2 border-line bg-card p-1 text-sm font-extrabold">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`flex-1 rounded-xl px-4 py-2 ${section === s.id ? 'bg-sky-soft text-sky-dark' : 'text-muted'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'study' && <Study onStudy={begin} />}
      {section === 'stats' && <Stats onOpen={setOpen} />}
      {section === 'words' && <Words onOpen={setOpen} />}

      {session && (
        <CardSession key={session.key} mode={session.mode} pool={session.pool} onRestart={(m) => begin(m, session.pool)} onExit={() => setSession(null)} />
      )}
      <WordSheet
        n={open}
        onClose={() => setOpen(null)}
        onWrite={(c, n) => {
          setOpen(null)
          onWrite(c, n)
        }}
      />
    </div>
  )
}

const Counter = ({ value, label, color }: { value: number; label: string; color: string }) => (
  <div className="flex-1 text-center">
    <p className={`text-4xl leading-none font-black ${color}`}>{value}</p>
    <p className="mt-1 text-sm font-bold text-muted">{label}</p>
  </div>
)

function Study({ onStudy }: { onStudy: (mode: SessionMode, pool?: number[]) => void }) {
  const progress = useProgress()
  const due = dueNow(progress)
  const total = dueCount(due)
  const rows = deckRows(progress)
  const decks = rows.filter((r) => r.cards > 0)
  const learned = deckWords(progress).length
  const units = wholeUnits(progress)
  const size = progress.sessionSize
  const batch = Math.min(total, size)

  return (
    <>
      <section className="card flex flex-col gap-4 p-5">
        <div className="flex">
          <Counter value={due.fresh.length} label="New" color="text-sky-dark" />
          <Counter value={due.learning.length} label="Learning" color="text-brand" />
          <Counter value={due.review.length} label="Review" color="text-jade-dark" />
        </div>
        <button type="button" disabled={total === 0} onClick={() => onStudy('study')} className="btn btn-primary w-full">
          {total ? `Study ${batch} ${batch === 1 ? 'card' : 'cards'}` : learned ? 'Nothing due right now' : 'Finish a lesson first'}
        </button>
        {total > batch && (
          <p className="text-center text-sm text-muted">
            {total} cards are due in all, {size} at a time. When a session ends, the next one starts right away.
          </p>
        )}
        {!learned && <p className="text-center text-sm text-muted">Every word you learn in a lesson becomes a card.</p>}
        {learned > 0 && (
          <>
            <button type="button" onClick={() => onStudy('practice')} className="btn btn-ghost w-full">
              Practice {Math.min(learned, size)} words
            </button>
            <p className="text-center text-sm text-muted">
              Drill the trickiest words as many times as you like. Practice never changes when your cards come back.
            </p>
          </>
        )}
      </section>

      {decks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold tracking-widest text-muted uppercase">Decks</h3>
          {decks.map(({ unit, cards, total: all, due: d }) => {
            const accent = accentFor(unit.id)
            return (
              <div key={unit.id} className="tile flex items-center gap-3 px-3 py-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                  style={{ background: accent.bg }}
                >
                  {unit.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{unit.title}</p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-sky" style={{ width: `${(cards / all) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-muted">
                    {cards} of {all} words
                  </p>
                </div>
                <span className={`min-w-8 text-right text-xl font-black ${d ? 'text-jade-dark' : 'text-muted'}`}>{d || '–'}</span>
              </div>
            )
          })}
        </section>
      )}

      {units.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold tracking-widest text-muted uppercase">Whole units</h3>
          {units.map(({ unit, words, inDeck, due }) => {
            const accent = accentFor(unit.id)
            const batch = Math.min(due, size)
            return (
              <div key={unit.id} className="tile flex flex-col gap-3 px-3 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                    style={{ background: accent.bg }}
                  >
                    {unit.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{unit.title}</p>
                    <p className="text-xs font-bold text-muted">
                      All {words.length} words · {inDeck} in your deck
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={due === 0} onClick={() => onStudy('study', words)} className="btn btn-primary px-3! py-2.5!">
                    {due ? `Study ${batch}` : 'Done'}
                  </button>
                  <button type="button" onClick={() => onStudy('practice', words)} className="btn btn-ghost px-3! py-2.5!">
                    Practice {words.length}
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      )}

      <Options />
    </>
  )
}

const SESSION_OPTIONS = [10, 15, 20, 30]
const RETENTION_OPTIONS = [0.85, 0.9, 0.95]

function Options() {
  const { sessionSize, retention } = useProgress()
  const pick = <T extends number>(items: T[], value: T, onPick: (v: T) => void, show: (v: T) => string) => (
    <div className="flex rounded-2xl border-2 border-line bg-card p-1 text-sm font-extrabold">
      {items.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className={`flex-1 rounded-xl px-3 py-2 ${value === v ? 'bg-sky-soft text-sky-dark' : 'text-muted'}`}
        >
          {show(v)}
        </button>
      ))}
    </div>
  )
  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-2">
        <h3 className="font-black">Cards per session</h3>
        {pick(SESSION_OPTIONS, sessionSize, (v) => setStudyOptions({ sessionSize: v }), String)}
        <p className="text-sm text-muted">There is no daily limit: start as many sessions as you want.</p>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-black">Remember</h3>
        {pick(RETENTION_OPTIONS, retention, (v) => setStudyOptions({ retention: v }), (v) => `${Math.round(v * 100)}%`)}
        <p className="text-sm text-muted">A higher goal brings cards back sooner, so you review more.</p>
      </div>
    </section>
  )
}

function Stats({ onOpen }: { onOpen: (n: number) => void }) {
  const progress = useProgress()
  const s = useMemo(() => statsOf(progress), [progress])
  const { fresh, learning, young, mature } = s.counts
  const max = Math.max(1, ...s.forecast)
  const peak = Math.max(1, ...s.calendar.map((d) => d.count))
  const dash = 2 * Math.PI * 22
  const bar = (n: number) => `${s.cards ? (n / s.cards) * 100 : 0}%`

  if (!s.cards) {
    return <p className="py-10 text-center text-muted">Your statistics appear after your first lesson.</p>
  }

  return (
    <>
      <section className="card flex items-center gap-5 p-5">
        <svg viewBox="0 0 54 54" className="h-20 w-20 shrink-0 -rotate-90" role="img" aria-label="Retention">
          <circle cx="27" cy="27" r="22" fill="none" stroke="var(--color-line)" strokeWidth="6" />
          {s.retention !== null && (
            <circle
              cx="27"
              cy="27"
              r="22"
              fill="none"
              stroke="var(--color-jade)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(s.retention / 100) * dash} ${dash}`}
            />
          )}
          <text x="27" y="27" textAnchor="middle" dominantBaseline="central" transform="rotate(90 27 27)" className="fill-ink text-[13px] font-black">
            {s.retention === null ? '–' : `${s.retention}%`}
          </text>
        </svg>
        <div>
          <h3 className="text-lg font-black">Retention</h3>
          <p className="text-sm text-muted">
            {s.retention === null
              ? 'Appears once you have answered a few cards that were already learned.'
              : `Right when a card came back, last 30 days. Your goal is ${Math.round(progress.retention * 100)}%.`}
          </p>
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h3 className="text-lg font-black">Today</h3>
        <div className="flex">
          <Counter value={s.today.reviews} label="Answers" color="text-ink" />
          <Counter value={s.today.again} label="Again" color="text-wrong" />
          <Counter value={s.today.hard} label="Hard" color="text-gold-dark" />
          <Counter value={s.today.good} label="Good" color="text-jade-dark" />
          <Counter value={s.today.easy} label="Easy" color="text-sky-dark" />
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h3 className="text-lg font-black">{s.cards} cards</h3>
        <div className="flex h-3 overflow-hidden rounded-full bg-line">
          <span className="bg-jade" style={{ width: bar(mature) }} />
          <span className="bg-jade/50" style={{ width: bar(young) }} />
          <span className="bg-brand" style={{ width: bar(learning) }} />
          <span className="bg-sky" style={{ width: bar(fresh) }} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-bold">
          <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-jade" />Mature {mature}</span>
          <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-jade/50" />Young {young}</span>
          <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-brand" />Learning {learning}</span>
          <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-sky" />New {fresh}</span>
        </div>
        <p className="text-xs text-muted">Mature cards have an interval of 21 days or more.</p>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h3 className="text-lg font-black">Last 4 weeks</h3>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
          {s.calendar.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.count}`}
              className={`aspect-square rounded-md ${d.count ? 'bg-jade' : 'bg-line'}`}
              style={d.count ? { opacity: 0.35 + 0.65 * (d.count / peak) } : undefined}
            />
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h3 className="text-lg font-black">Due in the next 7 days</h3>
        <div className="flex h-24 items-end gap-2">
          {s.forecast.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-bold text-muted">{v || ''}</span>
              <div className={`w-full rounded-md ${i === 0 ? 'bg-jade' : 'bg-sky'}`} style={{ height: `${Math.max(4, (v / max) * 64)}px`, opacity: v ? 1 : 0.25 }} />
              <span className="text-xs font-bold text-muted">{i === 0 ? 'Today' : `+${i}`}</span>
            </div>
          ))}
        </div>
      </section>

      {s.hardest.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-extrabold tracking-widest text-muted uppercase">Hardest cards</h3>
          <div className="flex flex-wrap gap-2">
            {s.hardest.map(({ n, lapses }) => (
              <button key={n} type="button" onClick={() => onOpen(n)} className="tile flex items-baseline gap-2 border-wrong/30 px-3 py-2">
                <span className="han text-xl">{word(n).hanzi}</span>
                <span className="text-sm text-muted">{word(n).en}</span>
                <span className="text-xs font-extrabold text-wrong">×{lapses}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function Words({ onOpen }: { onOpen: (n: number) => void }) {
  const progress = useProgress()
  const learned = learnedWords(progress)
  const learnedSet = new Set(learned)
  const [scope, setScope] = useState<'learned' | 'all'>(learned.length ? 'learned' : 'all')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = scope === 'learned' ? WORDS.filter((w) => learnedSet.has(w.n)) : WORDS
    if (!q) return pool
    const qp = plainPinyin(q)
    return pool.filter(
      (w) => w.hanzi.includes(q) || w.en.toLowerCase().includes(q) || (qp && plainPinyin(w.pinyin).startsWith(qp)),
    )
  }, [scope, query, learned.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-black">Dictionary</h3>
        <div className="flex rounded-2xl border-2 border-line bg-card p-1 text-sm font-extrabold">
          {(['learned', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`flex-1 rounded-xl px-4 py-2 ${scope === s ? 'bg-sky-soft text-sky-dark' : 'text-muted'}`}
            >
              {s === 'learned' ? `Learned (${learned.length})` : 'All (300)'}
            </button>
          ))}
        </div>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by hanzi, pinyin or English"
        className="w-full rounded-2xl border-2 border-line bg-card px-4 py-3 text-base outline-none focus:border-sky"
      />
      {list.length === 0 ? (
        <p className="py-8 text-center text-muted">
          {scope === 'learned' && !query ? 'You haven’t learned any words yet. Start your first lesson!' : 'No results.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((w) => (
            <div
              key={w.n}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(w.n)}
              onKeyDown={(e) => e.key === 'Enter' && onOpen(w.n)}
              className="tile relative flex flex-col items-center gap-1 px-2 pt-9 pb-3 text-center"
            >
              <span className="absolute top-2 right-2">
                <AudioButton text={w.hanzi} size="sm" />
              </span>
              {!learnedSet.has(w.n) && scope === 'all' && (
                <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-line-dark" title="Not learned yet" />
              )}
              <span className="han text-4xl">{w.hanzi}</span>
              <span className="text-sm font-bold text-sky-dark">{w.pinyin}</span>
              <span className="line-clamp-2 text-sm leading-tight">{w.en}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
