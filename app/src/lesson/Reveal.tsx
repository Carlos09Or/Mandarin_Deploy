import HanziWriter from 'hanzi-writer'
import { useEffect, useRef, useState } from 'react'
import type { Reveal as RevealData, RevealStep } from '../data/reveals'
import { fetchChar } from '../lib/hanzi'

const SIZE = 240
const INK = '#2b2420'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Look = 'hidden' | 'silhouette' | 'color' | 'faded' | 'gone'
type Shown = { src: string; place: RevealStep['place'] | 'center'; look: Look }

const PLACE = {
  center: { left: '6%', width: '88%' },
  left: { left: '0%', width: '48%' },
  right: { left: '52%', width: '48%' },
}
const LOOK: Record<Look, { opacity: number; filter: string }> = {
  hidden: { opacity: 0, filter: 'brightness(0)' },
  silhouette: { opacity: 1, filter: 'brightness(0)' },
  color: { opacity: 1, filter: 'none' },
  faded: { opacity: 0.22, filter: 'none' },
  gone: { opacity: 0, filter: 'none' },
}

/**
 * Introduces a character from its pictures, one part at a time: each picture appears as a black
 * silhouette, turns to colour, slides under its part and fades while that part is drawn. When the
 * parts are done, a picture of them together can show before the character settles in ink.
 * Tap to watch it again.
 */
export function Reveal({ data }: { data: RevealData }) {
  const [run, setRun] = useState(0)
  return (
    <button
      type="button"
      onClick={() => setRun((r) => r + 1)}
      aria-label={`Watch ${data.char} again`}
      className="relative"
      style={{ width: SIZE, height: SIZE }}
    >
      <RevealRun key={run} data={data} />
    </button>
  )
}

function RevealRun({ data }: { data: RevealData }) {
  const box = useRef<HTMLDivElement>(null)
  const [pictures, setPictures] = useState<Shown[]>(() => [
    ...data.steps.filter((s) => s.image).map((s): Shown => ({ src: s.image!, place: 'center', look: 'hidden' })),
    ...(data.together ? [{ src: data.together, place: 'center' as const, look: 'hidden' as Look }] : []),
  ])
  const show = (i: number, change: Partial<Shown>) =>
    setPictures((all) => all.map((p, j) => (j === i ? { ...p, ...change } : p)))

  useEffect(() => {
    const el = box.current!
    let alive = true
    ;(async () => {
      const chr = await fetchChar(data.char)
      if (!alive) return
      const all = chr.strokes.map((_, i) => i)
      const radical = chr.radStrokes ?? []
      const writer = HanziWriter.create(el, data.char, {
        width: SIZE,
        height: SIZE,
        padding: 12,
        showOutline: false,
        showCharacter: false,
        strokeColor: data.strokeColor,
        radicalColor: data.radicalColor,
        strokeAnimationSpeed: 1.3,
        delayBetweenStrokes: 90,
        charDataLoader: (_c, onLoad) => onLoad(chr),
      })
      const drawn = new Set<number>()
      const draw = async (strokes: number[]) => {
        for (const s of strokes) {
          if (!alive || drawn.has(s)) continue
          drawn.add(s)
          await new Promise<void>((resolve) => writer.animateStroke(s, { onComplete: () => resolve() }))
        }
      }
      let pic = 0
      for (const step of data.steps) {
        if (!alive) return
        const strokes = step.strokes === 'radical' ? radical : step.strokes === 'rest' ? all.filter((i) => !drawn.has(i)) : step.strokes
        if (step.image) {
          const i = pic++
          show(i, { look: 'silhouette' })
          await wait(800)
          if (!alive) return
          show(i, { look: 'color' })
          await wait(1000)
          if (!alive) return
          show(i, { place: step.place, look: 'faded' })
          await wait(650)
        }
        await draw(strokes)
        await wait(300)
      }
      if (!alive) return
      await draw(all)
      // The parts come together: their pictures give way to the picture of the whole.
      if (data.together) {
        setPictures((p) => p.map((x, j) => (j < pic ? { ...x, look: 'gone' } : x)))
        show(pic, { look: 'color' })
        await wait(1300)
        if (!alive) return
      }
      setPictures((p) => p.map((x) => ({ ...x, look: 'gone' })))
      writer.updateColor('strokeColor', INK, { duration: 600 })
      writer.updateColor('radicalColor', INK, { duration: 600 })
    })()
    return () => {
      alive = false
      el.innerHTML = ''
    }
  }, [data])

  return (
    <>
      {pictures.map((p) => (
        <img
          key={p.src}
          src={p.src}
          alt=""
          draggable={false}
          className="absolute top-0 h-full object-contain transition-all duration-700 ease-out"
          style={{ ...PLACE[p.place], ...LOOK[p.look] }}
        />
      ))}
      <div ref={box} className="absolute inset-0" />
    </>
  )
}
