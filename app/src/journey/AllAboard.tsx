import { useEffect, useRef, useState } from 'react'
import type { FriendId } from '../data/friends'
import { asset, type Province } from '../data/journey'
import { CHIMNEY, crewFor, puff } from './art'
import { Face, Train } from './parts'
import './journey.css'

type Props = { from: Province; to: Province; traveler: FriendId; onDone: () => void }

/** The train sits on the bridge at the painting's own scale (train-travel 941 × 1672, rails at y 793). */
const TRAIN_W = 78.3
const TRAIN_TOP = 27.8
const TRAIN_H = 24.8
const ZOOM = 1.9
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)

/**
 * Moving to the next province: the camera starts close on the bridge, the train crosses with
 * everyone at the windows, then the view pulls back and the train ticket fills in.
 */
export function AllAboard({ from, to, traveler, onDone }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)
  const smokeRef = useRef<HTMLDivElement>(null)
  const [ticket, setTicket] = useState(false)
  const [ride, setRide] = useState(0)
  const [punched, setPunched] = useState(false)
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    const frame = frameRef.current!
    const train = trainRef.current!
    let alive = true
    let lastPuff = 0
    const t0 = performance.now()
    const cross = (now: number) => {
      if (!alive) return
      const k = Math.min(1, (now - t0) / 4400)
      const u = k - 0.5
      // Fast in, a slow pass in front of the camera, fast out.
      const x = 0.3 * k + 0.7 * (0.5 + 0.5 * Math.sign(u) * Math.pow(Math.abs(2 * u), 3))
      const left = -85 + x * 195
      train.style.left = `${left}%`
      frame.style.transform = `scale(${k < 0.6 ? ZOOM : ZOOM - (ZOOM - 1) * ease((k - 0.6) / 0.4)})`
      if (now - lastPuff > 110) {
        puff(smokeRef.current!, `${left + (CHIMNEY[0] / 1672) * TRAIN_W}%`, `${TRAIN_TOP + (CHIMNEY[1] / 941) * TRAIN_H}%`, -1, '9%')
        lastPuff = now
      }
      if (k > 0.72) setTicket(true)
      if (k < 1) requestAnimationFrame(cross)
      else travel()
    }
    // Then the traveller's portrait rides along the ticket's line to the next stop.
    const travel = () => {
      setPunched(true)
      const t1 = performance.now() + 350
      const bar = (now: number) => {
        if (!alive) return
        const k = Math.min(1, Math.max(0, (now - t1) / 2200))
        setRide(k)
        if (k < 1) requestAnimationFrame(bar)
        else {
          setArrived(true)
          setTimeout(() => alive && onDone(), 1300)
        }
      }
      requestAnimationFrame(bar)
    }
    requestAnimationFrame(cross)
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()
  return (
    <div className="j-overlay j-aboard">
      <div className="j-ab-frame" ref={frameRef} style={{ transform: `scale(${ZOOM})` }}>
        <div className="j-ab-img" style={{ backgroundImage: `url(${asset('train-travel-empty.webp')})` }} />
        <div className="j-ab-water" />
        <div ref={smokeRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <Train ref={trainRef} className="j-ab-train moving fast" crew={crewFor(traveler)} />
      </div>

      <div className={`j-ticket-wrap ${ticket ? 'on' : ''}`}>
        <div className="j-ticket" style={{ backgroundImage: `url(${asset('passport-page.webp')})` }}>
          <div className="j-tk-main">
            <div className="j-tk-head">
              <span>TRAIN TICKET</span>
              <span className="j-han">车票 chēpiào</span>
            </div>
            <div className="j-tk-route">
              <div>
                <small>FROM</small>
                <b>{from.name}</b>
                <span className="j-han">{from.zh}</span>
              </div>
              <svg viewBox="0 0 34 14" style={{ width: 34, height: 14, marginBottom: 14 }} aria-hidden="true">
                <path d="M2 7 H29 M23 2 L30 7 L23 12" fill="none" stroke="#0a426d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="to">
                <small>TO</small>
                <b>{to.name}</b>
                <span className="j-han">{to.zh}</span>
              </div>
            </div>
            <div className="j-tk-line">
              <i style={{ width: `${ride * 100}%` }} />
              <span className="st" />
              <span className="st b" />
              <div className="j-tk-me" style={{ left: `${ride * 100}%` }}>
                <Face id={traveler} />
              </div>
            </div>
            <div className="j-tk-meta">
              <span>
                <small>CAR</small>
                {to.unit}
              </span>
              <span>
                <small>SEAT</small>8A
              </span>
              <span>
                <small>DATE</small>
                {date}
              </span>
              <span>
                <small>UNIT</small>
                {from.unit} → {to.unit}
              </span>
            </div>
            <div className={`j-tk-arrived ${arrived ? 'on' : ''}`}>
              <span className="j-han">到了</span>
              <small>DÀO LE · ARRIVED</small>
            </div>
          </div>
          <div className="j-tk-stub">
            <div className={`j-tk-punch ${punched ? 'on' : ''}`} />
            <div className="j-tk-zh j-han">上车</div>
            <div className="j-tk-py">shàng chē!</div>
            <div className="j-tk-en">All aboard</div>
          </div>
        </div>
      </div>
    </div>
  )
}
