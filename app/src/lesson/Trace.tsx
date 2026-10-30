import HanziWriter from 'hanzi-writer'
import { useEffect, useRef, useState } from 'react'
import { word } from '../data/course'
import { speak } from '../lib/audio'
import { loadChar } from '../lib/hanzi'
import type { Guide } from '../lib/lesson'
import { Stage } from './Stage'

type Props = { char: string; n: number; guide: Guide; onDone: (mistakes: number) => void }

// How visible the character's outline is behind the grid, and how soon a missed stroke gets a hint.
const OUTLINE: Record<Guide, string> = { full: '--color-guide-full', faint: '--color-guide-faint', none: '--color-card' }


export function Trace({ char, n, guide, onDone }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const [size] = useState(() => Math.min(320, window.innerWidth - 72))
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
      showHintAfterMisses: guide === 'none' ? 3 : 2,
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
      showOutline: guide !== 'none',
      strokeColor: '#2f9e7e',
      outlineColor: getComputedStyle(el).getPropertyValue(OUTLINE[guide]).trim() || '#d8cdbd',
      drawingColor: '#2f9e7e',
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
  }, [char, guide, size]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const chars = [...w.hanzi]
  return (
    <Stage eyebrow={guide === 'none' ? 'Draw from memory' : 'Trace'} title={`Write “${w.en}”.`}>
      {chars.length > 1 && (
        <p className="han -mt-3 text-3xl font-bold">
          {chars.map((c, i) =>
            c === char ? (
              <span key={i} className="mx-0.5 inline-block rounded-lg border-2 border-dashed border-jade px-1.5 text-jade">
                {guide === 'none' ? '？' : c}
              </span>
            ) : (
              <span key={i} className="text-muted/70">
                {c}
              </span>
            ),
          )}
        </p>
      )}

      <div className="flex justify-center">
        <div className="relative rounded-3xl border-2 border-line bg-card p-2" style={{ width: size + 20, height: size + 20 }}>
          {/* 米字格: the practice grid used in Chinese copybooks */}
          <svg className="pointer-events-none absolute inset-2.5" width={size} height={size} aria-hidden>
            <rect x="1" y="1" width={size - 2} height={size - 2} fill="none" style={{ stroke: 'var(--color-grid)' }} strokeWidth="2" rx="8" />
            <g style={{ stroke: 'var(--color-grid-soft)' }} strokeWidth="1.5" strokeDasharray="6 6">
              <line x1={size / 2} y1="0" x2={size / 2} y2={size} />
              <line x1="0" y1={size / 2} x2={size} y2={size / 2} />
              <line x1="0" y1="0" x2={size} y2={size} />
              <line x1={size} y1="0" x2="0" y2={size} />
            </g>
          </svg>
          <div ref={box} className="relative touch-none" />
          {failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-muted">
              <p>Couldn’t load the strokes for {char}.</p>
              <button type="button" className="btn btn-ghost py-2.5 text-sm" onClick={() => onDone(0)}>
                Skip
              </button>
            </div>
          )}
        </div>
      </div>

      {!finished && !failed && (
        <div className="flex justify-center">
          <button
            type="button"
            className="px-3 py-2 text-sm font-extrabold text-sky-dark"
            onClick={animating ? skipDemo : showOrder}
          >
            {animating ? 'Skip and write' : 'Show stroke order'}
          </button>
        </div>
      )}
    </Stage>
  )
}
