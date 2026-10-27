import { FRIEND_IDS, type FriendId } from '../data/friends'
import { asset, type Province } from '../data/journey'

// Helpers shared by the journey screens: train geometry, smoke, strips and passport stamps.

/** Chimney top in train.webp pixels (1672 × 941). */
export const CHIMNEY = [1408, 196]

/** The traveller drives; the other three friends lean out of the carriage windows. */
export const crewFor = (driver: FriendId): FriendId[] => [...FRIEND_IDS.filter((f) => f !== driver).slice(0, 3), driver]

/** One smoke puff that rises, grows and fades. dir −1 drifts back, +1 forward. */
export function puff(layer: HTMLElement, left: string, top: string, dir = -1, size?: string) {
  const p = document.createElement('img')
  p.className = 'j-smoke'
  p.src = asset('train-smoke.webp')
  p.alt = ''
  p.style.left = left
  p.style.top = top
  if (size) p.style.width = size
  layer.appendChild(p)
  const dx = dir * (60 + Math.random() * 60)
  const dy = -(60 + Math.random() * 50)
  const rot = (Math.random() - 0.5) * 60
  p.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 },
      { opacity: 0.95, offset: 0.12 },
      { transform: `translate(calc(-50% + ${dx}%), calc(-50% + ${dy}%)) scale(1.3) rotate(${rot}deg)`, opacity: 0 },
    ],
    { duration: 1500 + Math.random() * 600, easing: 'ease-out' },
  ).onfinish = () => p.remove()
}

/** Loops a strip of four copies (two pairs) endlessly to the left. */
export const loop = (el: HTMLElement, seconds: number) =>
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: seconds * 1000, iterations: Infinity })

// ---- Passport stamps: drawn from text and frames only, like real entry stamps ----

let stampN = 0
const inkFilter = (id: string, seed: number) => `<filter id="${id}" x="-8%" y="-8%" width="116%" height="116%">
  <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="${seed}" result="n" />
  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" result="d" />
  <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.5" result="holes" />
  <feComposite in="d" in2="holes" operator="in" /></filter>`
const FONT = `font-family="Nunito, 'Noto Sans SC', sans-serif" font-weight="900"`

export function stampSvg(p: Province, date: string) {
  const id = `st${++stampN}`
  const color = p.stamp!.color
  const name = p.name.toUpperCase()
  if (p.stamp!.shape === 'round') {
    return `<svg viewBox="0 0 200 200"><defs>${inkFilter(`${id}f`, stampN * 7)}
      <path id="${id}t" d="M36 100 A64 64 0 0 1 164 100" /><path id="${id}b" d="M22 100 A78 78 0 0 0 178 100" /></defs>
      <g filter="url(#${id}f)" fill="${color}" ${FONT}>
        <g fill="none" stroke="${color}"><circle cx="100" cy="100" r="93" stroke-width="5" /><circle cx="100" cy="100" r="86" stroke-width="1.6" />
          <circle cx="100" cy="100" r="56" stroke-width="2.6" /><rect x="52" y="104" width="96" height="21" rx="3" stroke-width="2" /></g>
        <text font-size="14.5" letter-spacing="1.2"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${name} · ${p.zh}</textPath></text>
        <text font-size="11.5" letter-spacing="1.4"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">UNIT ${p.unit} · MANDARIN JOURNEY</textPath></text>
        <text x="29" y="105" font-size="12" text-anchor="middle">★</text><text x="171" y="105" font-size="12" text-anchor="middle">★</text>
        <text x="100" y="96" font-size="30" text-anchor="middle">入境</text>
        <text x="100" y="119.5" font-size="12.5" text-anchor="middle" letter-spacing=".5">${date}</text>
        <text x="100" y="140" font-size="10" text-anchor="middle" letter-spacing="2.5">ENTRY</text>
      </g></svg>`
  }
  return `<svg viewBox="0 0 220 140"><defs>${inkFilter(`${id}f`, stampN * 7)}</defs>
    <g filter="url(#${id}f)" fill="${color}" ${FONT}>
      <g fill="none" stroke="${color}"><rect x="4" y="4" width="212" height="132" rx="16" stroke-width="4.5" />
        <rect x="11" y="11" width="198" height="118" rx="11" stroke-width="1.5" /><line x1="24" y1="94" x2="196" y2="94" stroke-width="1.5" /></g>
      <text x="110" y="34" font-size="15" text-anchor="middle" letter-spacing="2">${name}</text>
      <text x="110" y="70" font-size="28" text-anchor="middle">${p.zh}</text>
      <text x="110" y="87" font-size="10" text-anchor="middle" letter-spacing="2.5">UNIT ${p.unit} · ENTRY 入境</text>
      <text x="110" y="117" font-size="14" text-anchor="middle" letter-spacing="1">${date}</text>
    </g></svg>`
}

export const stampDate = (iso?: string) =>
  new Date(iso ?? Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
