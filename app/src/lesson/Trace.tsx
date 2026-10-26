import HanziWriter from 'hanzi-writer'
import { useEffect, useRef, useState } from 'react'
import { word } from '../data/course'
import { speak } from '../lib/audio'
import { AudioButton } from '../components/AudioButton'

type Props = { char: string; n: number; guided: boolean; onDone: (mistakes: number) => void }

type Loader = NonNullable<Parameters<typeof HanziWriter.create>[2]>['charDataLoader']

const loadChar: Loader = (char, onLoad, onError) => {
  fetch(`${import.meta.env.BASE_URL}hanzi/${char}.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(onLoad)
    .catch(onError)
}

export function Trace({ char, n, guided, onDone }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const [size] = useState(() => Math.min(300, window.innerWidth - 64))
  const [finished, setFinished] = useState(false)
  const [failed, setFailed] = useState(false)
  const [animating, setAnimating] = useState(false)
  // Bumped whenever a demo is skipped, so a finished demo doesn't restart the quiz twice.
  const demo = useRef(0)
  const w = word(n)

  const startQuiz = () => {
    demo.current++
    setAnimating(false)
    writer.current?.quiz({
      showHintAfterMisses: guided ? 2 : 3,
      highlightOnComplete: true,
      onComplete: ({ totalMistakes }) => {
        setFinished(true)
        // The whole word: a lone character can be read with the wrong tone (们 alone vs 我们).
        speak(w.hanzi)
        onDone(totalMistakes)
      },
    })
  }

  useEffect(() => {
    const el = box.current
    if (!el || !size) return
    el.innerHTML = ''
    writer.current = HanziWriter.create(el, char, {
      width: size,
      height: size,
      padding: 18,
      showCharacter: false,
      showOutline: guided,
      strokeColor: '#2b2420',
      outlineColor: '#e6dccd',
      drawingColor: '#2b2420',
      drawingWidth: 26,
      highlightColor: '#3b8fd9',
      highlightCompleteColor: '#2f9e7e',
      // The library defaults (1 s pause between strokes) make a demo of 8 strokes last 10+ s.
      strokeAnimationSpeed: 2.5,
      delayBetweenStrokes: 120,
      strokeFadeDuration: 200,
      strokeHighlightSpeed: 4,
      charDataLoader: loadChar,
      onLoadCharDataError: () => setFailed(true),
    })
    startQuiz()
    return () => {
      writer.current?.cancelQuiz()
      writer.current = null
      el.innerHTML = ''
    }
  }, [char, guided, size]) // eslint-disable-line react-hooks/exhaustive-deps

  const showOrder = async () => {
    const wr = writer.current
    if (!wr) return
    const run = ++demo.current
    wr.cancelQuiz()
    setAnimating(true)
    await wr.animateCharacter()
    if (run !== demo.current) return
    await new Promise((r) => setTimeout(r, 250))
    if (run !== demo.current) return
    await wr.hideCharacter({ duration: 150 })
    if (run === demo.current) startQuiz()
  }

  const skipDemo = () => {
    const wr = writer.current
    if (!wr) return
    demo.current++
    wr.hideCharacter({ duration: 0 })
    startQuiz()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-extrabold">{guided ? 'Traza el carácter' : 'Escríbelo de memoria'}</h2>
        <p className="mt-1 text-muted">
          {guided ? 'Sigue el contorno en el orden correcto de trazos.' : 'Si fallas tres veces, verás una pista.'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <AudioButton text={w.hanzi} size="sm" />
        <p className="text-lg">
          <span className="han text-2xl">
            {[...w.hanzi].map((c, i) => (
              <span key={i} className={c === char ? 'text-brand' : 'text-muted/60'}>
                {c}
              </span>
            ))}
          </span>{' '}
          <span className="font-bold text-sky-dark">{w.pinyin}</span> · <span className="font-bold">{w.es}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative rounded-3xl border-2 border-line bg-card p-2" style={{ width: size + 20, height: size + 20 }}>
          {/* 米字格: the practice grid used in Chinese copybooks */}
          <svg className="pointer-events-none absolute inset-2.5" width={size} height={size} aria-hidden>
            <rect x="1" y="1" width={size - 2} height={size - 2} fill="none" stroke="#f0c9c2" strokeWidth="2" rx="8" />
            <g stroke="#f4d6d0" strokeWidth="1.5" strokeDasharray="6 6">
              <line x1={size / 2} y1="0" x2={size / 2} y2={size} />
              <line x1="0" y1={size / 2} x2={size} y2={size / 2} />
              <line x1="0" y1="0" x2={size} y2={size} />
              <line x1={size} y1="0" x2="0" y2={size} />
            </g>
          </svg>
          <div ref={box} className="relative touch-none" />
          {failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-muted">
              <p>No se pudieron cargar los trazos de {char}.</p>
              <button type="button" className="btn btn-ghost py-2.5 text-sm" onClick={() => onDone(0)}>
                Saltar
              </button>
            </div>
          )}
        </div>
      </div>

      {!finished && !failed && (
        <div className="flex justify-center">
          <button type="button" className="btn btn-ghost py-2.5 text-sm" onClick={animating ? skipDemo : showOrder}>
            {animating ? 'Saltar y escribir' : 'Ver orden de trazos'}
          </button>
        </div>
      )}
    </div>
  )
}
