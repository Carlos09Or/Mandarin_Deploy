import { useEffect, useMemo, useState } from 'react'
import { PROVINCES, asset, hasContent, type Province } from '../data/journey'
import { useProgress } from '../lib/progress'
import { stampDate, stampSvg } from './art'
import { provinceDone } from './stops'
import './journey.css'

type Props = {
  /** A province that just earned its stamp: the passport opens on it and stamps it. */
  fresh?: Province | null
  onNext?: () => void
  nextLabel?: string
}

/**
 * The passport: two stamps per page (top right, bottom left), then one page per postcard.
 * Stamps are drawn from text, like real entry stamps; each province has its own shape and ink.
 */
export function Passport({ fresh, onNext, nextLabel }: Props) {
  const progress = useProgress()
  const provinces = PROVINCES.filter(hasContent)
  const stamped = provinces.filter((p) => provinceDone(p, progress))
  const stampPages = Math.max(1, Math.ceil(provinces.length / 2))
  const pages = [...Array.from({ length: stampPages }, (_, i) => ({ kind: 'stamps' as const, i })), ...stamped.map((p) => ({ kind: 'postcard' as const, p }))]
  const freshPage = fresh ? Math.floor(provinces.indexOf(fresh) / 2) : 0
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(freshPage)
  const [slam, setSlam] = useState(false)
  const [flipped, setFlipped] = useState<string | null>(null)

  // The ink is drawn once per visit so the filters keep stable ids.
  const stamps = useMemo(
    () => Object.fromEntries(stamped.map((p) => [p.id, stampSvg(p, stampDate(progress.nodes[`u${p.unit}-cp`]?.lastAt))])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stamped.length],
  )

  // A new stamp: open the book, stamp the page, then turn to its postcard.
  useEffect(() => {
    if (!fresh) return
    const timers = [
      setTimeout(() => setOpen(true), 500),
      setTimeout(() => setSlam(true), 1550),
      setTimeout(() => setPage(pages.findIndex((g) => g.kind === 'postcard' && g.p.id === fresh.id)), 3300),
    ]
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const g = pages[page]
  const label = g.kind === 'stamps' ? `Visas · ${page + 1}/${pages.length}` : `Postcards · ${page + 1}/${pages.length}`
  return (
    <div className="j-pp">
      <small className="kicker">Your passport</small>
      <h2>Stamps &amp; postcards</h2>
      <div className={`j-book ${open ? 'open' : ''}`}>
        <div className={`j-page ${slam ? 'shake' : ''}`} style={{ backgroundImage: `url(${asset('passport-page.webp')})` }}>
          {pages.map((pg, i) => (
            <div key={i} className={`j-leaf ${i < page ? 'left' : i > page ? 'right' : ''}`}>
              {pg.kind === 'stamps' ? (
                <>
                  <div className="j-page-title">
                    VISAS · <span className="j-han">签证</span>
                  </div>
                  {provinces.slice(pg.i * 2, pg.i * 2 + 2).map((p, slot) => {
                    const at = slot === 0 ? 'a' : 'b'
                    if (!stamps[p.id] || (p.id === fresh?.id && !slam)) {
                      return (
                        <div
                          key={p.id}
                          className="j-slot"
                          style={slot === 0 ? { right: 16, top: 52, width: 150, height: 150 } : { left: 18, bottom: 34, width: 176, height: 112 }}
                        >
                          <div>
                            NEXT STAMP<span className="j-han">{p.zh}</span>
                            {p.name}
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div
                        key={p.id}
                        className={`j-stamp ${at} ${p.stamp!.shape} ${p.id === fresh?.id ? 'slam' : ''}`}
                        dangerouslySetInnerHTML={{ __html: stamps[p.id] }}
                      />
                    )
                  })}
                </>
              ) : (
                <>
                  <div className="j-page-title">
                    POSTCARDS · <span className="j-han">明信片</span>
                  </div>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 112 }}>
                    <Postcard
                      p={pg.p}
                      flipped={flipped === pg.p.id}
                      drop={pg.p.id === fresh?.id}
                      onFlip={() => setFlipped(flipped === pg.p.id ? null : pg.p.id)}
                    />
                    <p style={{ marginTop: 18, fontSize: 12.5, fontWeight: 800, color: '#9a7b4c' }}>Tap the postcard to turn it over</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="j-cover"
          style={{ backgroundImage: `url(${asset('passport-cover.webp')})` }}
          onClick={() => setOpen(true)}
          aria-label="Open the passport"
        >
          <div className="j-cover-text top">
            PASSPORT<span className="j-han">护照</span>
          </div>
          <div className="j-cover-text bottom">PANAMA → 中国</div>
        </button>
      </div>

      {open ? (
        <div className="j-pager">
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">
            ‹
          </button>
          <span>{label}</span>
          <button type="button" disabled={page === pages.length - 1} onClick={() => setPage(page + 1)} aria-label="Next page">
            ›
          </button>
        </div>
      ) : (
        <p style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: '#8b7f75' }}>Tap the passport to open it</p>
      )}

      {onNext && (
        <button type="button" className="btn btn-primary mx-auto mt-6 w-full max-w-xs" onClick={onNext}>
          {nextLabel ?? 'Continue'}
        </button>
      )}
    </div>
  )
}

function Postcard({ p, flipped, drop, onFlip }: { p: Province; flipped: boolean; drop: boolean; onFlip: () => void }) {
  const card = p.postcard!
  return (
    <button type="button" className={`j-postcard ${flipped ? 'flipped' : ''} ${drop ? 'drop' : ''}`} onClick={onFlip} style={{ rotate: '-3deg' }}>
      <div className="j-pc-inner">
        <div className="j-pc-front" style={{ backgroundImage: `url(${asset(card.image)})` }} />
        <div className="j-pc-back">
          <div className="j-pc-msg">
            <span className="zh j-han">{card.zh}</span>
            <span className="py">{card.py}</span>
            <span className="en">{card.en}</span>
          </div>
          <div className="j-pc-addr">
            <div className="j-postage">
              <div style={{ backgroundImage: `url(${asset(p.landmark!.image)})` }} />
            </div>
            <i>To: you</i>
            <i>{p.name}</i>
            <i>Panama</i>
          </div>
        </div>
      </div>
    </button>
  )
}
