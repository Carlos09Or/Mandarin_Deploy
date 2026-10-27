import HanziWriter from 'hanzi-writer'
import { useEffect, useRef, useState } from 'react'
import { loadChar } from '../lib/hanzi'

type Props = { char: string; pictures: string[]; size?: number }

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Reveals a character from pictures: the pictogram(s) appear in colour, fade to a soft shadow,
 * and the character is drawn stroke by stroke on top of them. Tap to watch it again.
 */
export function Reveal(props: Props) {
  const [run, setRun] = useState(0)
  const size = props.size ?? 220
  // A new key restarts the whole sequence from the coloured pictures.
  return (
    <button
      type="button"
      onClick={() => setRun((r) => r + 1)}
      aria-label={`Watch ${props.char} again`}
      className="relative"
      style={{ width: size, height: size }}
    >
      <RevealRun key={run} {...props} size={size} />
    </button>
  )
}

function RevealRun({ char, pictures, size }: Required<Props>) {
  const writerBox = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'show' | 'shadow' | 'done'>('show')

  useEffect(() => {
    const box = writerBox.current!
    let alive = true
    const writer = HanziWriter.create(box, char, {
      width: size,
      height: size,
      padding: 14,
      showOutline: false,
      showCharacter: false,
      strokeColor: '#d21034',
      strokeAnimationSpeed: 1.4,
      delayBetweenStrokes: 120,
      charDataLoader: loadChar,
    })
    ;(async () => {
      await wait(1000)
      if (!alive) return
      setPhase('shadow')
      await wait(650)
      if (!alive) return
      await new Promise<void>((resolve) => writer.animateCharacter({ onComplete: () => resolve() }))
      if (!alive) return
      setPhase('done')
      writer.updateColor('strokeColor', '#2b2420', { duration: 600 })
    })()
    return () => {
      alive = false
      box.innerHTML = ''
    }
  }, [char, size])

  return (
    <>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-[filter,opacity] duration-700 ${
          phase === 'show' ? '' : phase === 'shadow' ? 'opacity-[.14] brightness-0' : 'opacity-0'
        }`}
      >
        {pictures.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className="h-full object-contain"
            style={{ width: `${100 / pictures.length}%` }}
          />
        ))}
      </div>
      <div ref={writerBox} className="absolute inset-0" />
    </>
  )
}
