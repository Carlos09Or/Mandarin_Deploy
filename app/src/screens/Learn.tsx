import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PATH, UNITS, accentFor, nodesOfUnit, word, type PathNode } from '../data/course'
import { currentIndex, useProgress } from '../lib/progress'
import { IconCheck, IconLock, IconStar, IconTrophy } from '../components/icons'
import { Mascot } from '../components/Mascot'
import { FriendScene } from '../components/Friends'
import type { FriendId } from '../data/friends'

// Horizontal offsets (px) that give the path its gentle zig-zag.
const ZIGZAG = [0, 46, 70, 46, 0, -46, -70, -46]

// One friend per unit, beside the bend of the path that leaves room for it.
const SCENES: FriendId[] = ['harpia', 'wawa', 'sloth', 'tucan']
const sceneFor = (unitId: number) => ({
  id: SCENES[(unitId - 1) % SCENES.length],
  // Rows 1–3 lean right, so the friend sits on the left; rows 4–6 lean left.
  row: unitId % 2 ? 2 : 5,
})

type Props = { onStart: (node: PathNode) => void }

export function Learn({ onStart }: Props) {
  const progress = useProgress()
  const current = currentIndex(progress)
  const [open, setOpen] = useState<string | null>(null)
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="flex flex-col gap-10 pb-10">
      {UNITS.map((unit) => {
        const nodes = nodesOfUnit(unit.id)
        const accent = accentFor(unit.id)
        const doneCount = nodes.filter((n) => progress.nodes[n.id]).length
        const unitLocked = PATH.indexOf(nodes[0]) > current
        const scene = sceneFor(unit.id)
        return (
          <section key={unit.id} className="flex flex-col items-center gap-6">
            <header
              className="relative flex w-full items-center gap-4 overflow-hidden rounded-3xl p-4 pr-3 text-white shadow-[0_5px_0_var(--d)] sm:p-5"
              style={{ background: unitLocked ? '#b9ada0' : accent.bg, ['--d' as string]: unitLocked ? '#9d9184' : accent.dark }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold tracking-widest uppercase opacity-85">
                  Unit {unit.id} · {doneCount}/{nodes.length}
                </p>
                <h2 className="mt-0.5 text-xl leading-tight font-black sm:text-2xl">{unit.title}</h2>
                <p className="mt-1 text-sm leading-snug opacity-90">{unit.description}</p>
              </div>
              <img
                src={`${import.meta.env.BASE_URL}units/unit-${unit.id}.jpg`}
                alt=""
                loading="lazy"
                className={`h-20 w-24 shrink-0 rounded-2xl object-cover ring-2 ring-white/40 sm:h-24 sm:w-32 ${unitLocked ? 'grayscale' : ''}`}
              />
            </header>

            <div className="flex w-full flex-col items-center gap-4 pt-6">
              {nodes.map((node) => {
                const i = PATH.indexOf(node)
                const done = !!progress.nodes[node.id]
                const isCurrent = i === current
                const locked = i > current
                const isOpen = open === node.id
                const x = ZIGZAG[node.index % ZIGZAG.length]
                return (
                  <div
                    key={node.id}
                    ref={isCurrent ? currentRef : undefined}
                    className="relative flex w-full flex-col items-center"
                  >
                    {node.index === scene.row && (
                      <div
                        className={`pointer-events-none absolute -top-6 ${scene.row === 2 ? '-left-2 sm:left-4' : '-right-2 sm:right-4'} ${
                          unitLocked ? 'friend-locked' : ''
                        }`}
                      >
                        <FriendScene id={scene.id} size={160} />
                      </div>
                    )}
                    <div className="relative" style={{ transform: `translateX(${x}px)` }}>
                      {isCurrent && !isOpen && Math.abs(node.index - scene.row) > 1 && (
                        <motion.div
                          className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 rounded-xl border-2 border-line bg-card px-3 py-1.5 text-sm font-black whitespace-nowrap uppercase"
                          style={{ color: accent.bg }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6 }}
                        >
                          {done ? 'Review' : 'Start'}
                          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-line bg-card" />
                        </motion.div>
                      )}
                      {isCurrent && !isOpen && Math.abs(node.index - scene.row) > 1 && (
                        <div
                          className="pointer-events-none absolute -top-6"
                          style={x >= 0 ? { right: '100%', marginRight: 18 } : { left: '100%', marginLeft: 18 }}
                        >
                          <Mascot mood="wave" size={92} />
                        </div>
                      )}
                      {isCurrent && (
                        <span
                          className="absolute -inset-1.5 animate-ping rounded-full opacity-15"
                          style={{ background: accent.bg, animationDuration: '2.2s' }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : node.id)}
                        aria-label={`${node.kind === 'checkpoint' ? 'Unit review' : `Lesson ${node.index + 1}`}${locked ? ' (locked)' : ''}`}
                        className={`relative flex items-center justify-center rounded-full transition-transform duration-75 active:translate-y-[4px] ${
                          node.kind === 'checkpoint' ? 'h-[84px] w-[84px]' : 'h-[72px] w-[72px]'
                        }`}
                        style={
                          locked
                            ? { background: '#e7ddd0', boxShadow: '0 6px 0 #cfc2b1', color: '#b4a797' }
                            : done && !isCurrent
                              ? { background: '#f2b544', boxShadow: '0 6px 0 #c98d1c', color: '#fff' }
                              : { background: accent.bg, boxShadow: `0 6px 0 ${accent.dark}`, color: '#fff' }
                        }
                      >
                        {locked ? (
                          <IconLock className="h-8 w-8" />
                        ) : node.kind === 'checkpoint' ? (
                          <IconTrophy className="h-10 w-10" />
                        ) : done ? (
                          <IconCheck className="h-9 w-9" />
                        ) : (
                          <IconStar className="h-9 w-9" />
                        )}
                      </button>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full max-w-sm overflow-hidden"
                        >
                          <NodeCard
                            node={node}
                            locked={locked}
                            done={done}
                            color={locked ? '#b9ada0' : accent.bg}
                            dark={locked ? '#9d9184' : accent.dark}
                            onStart={() => {
                              setOpen(null)
                              onStart(node)
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

type CardProps = { node: PathNode; locked: boolean; done: boolean; color: string; dark: string; onStart: () => void }

function NodeCard({ node, locked, done, color, dark, onStart }: CardProps) {
  const lessons = nodesOfUnit(node.unitId).filter((n) => n.kind === 'lesson').length
  const title = node.kind === 'checkpoint' ? 'Unit review' : `Lesson ${node.index + 1} of ${lessons}`
  const preview = node.kind === 'checkpoint' ? node.words.slice(0, 8) : node.words
  return (
    <div className="mt-5 rounded-3xl p-4 text-white" style={{ background: color }}>
      <p className="text-lg font-black">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {preview.map((n) => (
          <span key={n} className="han rounded-lg bg-white/20 px-2 py-0.5 text-lg">
            {word(n).hanzi}
          </span>
        ))}
        {node.kind === 'checkpoint' && <span className="self-center px-1 text-sm font-bold">+{node.words.length - 8}</span>}
      </div>
      <p className="mt-2 text-sm opacity-90">
        {locked
          ? 'Finish the previous lessons to unlock it.'
          : node.kind === 'checkpoint'
            ? 'Review the words you find hardest across the whole unit.'
            : '5 new words, their sounds, and a character to write.'}
      </p>
      <button
        type="button"
        disabled={locked}
        onClick={onStart}
        className="btn mt-4 w-full bg-white disabled:bg-white/40 disabled:text-white"
        style={{ color, boxShadow: locked ? 'none' : `0 4px 0 ${dark}` }}
      >
        {locked ? 'Locked' : done ? 'Review · +10 XP' : 'Start · +10 XP'}
      </button>
    </div>
  )
}
