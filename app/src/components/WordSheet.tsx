import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { pinRandomVoice, unpinVoice } from '../lib/audio'
import { CHARS, RADICALS, charsOf, word } from '../data/course'
import { AudioButton } from './AudioButton'
import { IconClose } from './icons'

type Props = { n: number | null; onClose: () => void; onWrite?: (char: string, n: number) => void }

/** Full card for one word: sound, meaning, example, and its characters. */
export function WordSheet({ n, onClose, onWrite }: Props) {
  return (
    <AnimatePresence>
      {n !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="safe-bottom max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 sm:rounded-3xl"
          >
            <Body n={n} onClose={onClose} onWrite={onWrite} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Body({ n, onClose, onWrite }: { n: number } & Omit<Props, 'n'>) {
  const w = word(n)
  // One voice per open card, so the word, the slow button and the example match.
  useEffect(() => {
    pinRandomVoice()
    return unpinVoice
  }, [n])
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <span className="rounded-full bg-line px-3 py-1 text-xs font-extrabold text-muted">HSK 1 · #{w.n}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="text-muted">
          <IconClose />
        </button>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="han text-7xl">{w.hanzi}</span>
        <span className="text-2xl font-bold text-sky-dark">{w.pinyin}</span>
        <div className="mt-1 flex gap-3">
          <AudioButton text={w.hanzi} />
          <AudioButton text={w.hanzi} slow />
        </div>
        <p className="mt-2 text-2xl font-extrabold">{w.en}</p>
      </div>
      <p className="rounded-2xl bg-paper p-4 text-sm leading-relaxed text-ink/80">{w.note}</p>
      <div className="flex items-start gap-3 rounded-2xl border-2 border-line p-4">
        <AudioButton text={w.example.hanzi} size="sm" />
        <div>
          <p className="han text-xl">{w.example.hanzi}</p>
          <p className="text-sm font-semibold text-sky-dark">{w.example.pinyin}</p>
          <p className="text-sm text-muted">{w.example.en}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {charsOf(w.hanzi).map((c) => {
          const info = CHARS[c]
          return (
            <div key={c} className="flex items-center gap-3 rounded-2xl bg-jade-soft p-3">
              <span className="han flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card text-3xl">{c}</span>
              <p className="min-w-0 flex-1 text-sm text-jade-dark">
                {info?.radical ? (
                  <>
                    Radical <span className="han font-bold">{info.radical}</span>
                    {RADICALS[info.radical] ? ` · ${RADICALS[info.radical]}` : ''}
                  </>
                ) : (
                  'Character'
                )}
              </p>
              {onWrite && (
                <button type="button" className="btn btn-jade px-3 py-2 text-xs" onClick={() => onWrite(c, n)}>
                  Write
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
