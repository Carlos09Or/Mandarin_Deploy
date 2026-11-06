import { useState } from 'react'
import { asset } from '../data/journey'
import { TEXTS } from '../i18n'
import { setLang } from '../lib/progress'

type Pick = 'es' | 'en'

/** The language the phone is set to, so the right one is already chosen and a tap on Continue is enough. */
const phoneLanguage = (): Pick => (navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en')

const OPTIONS: { id: Pick; name: string }[] = [
  { id: 'es', name: 'Español' },
  { id: 'en', name: 'English' },
]

/**
 * The very first screen: Spanish or English, for everything the app says. It is in both languages, since the learner has not
 * chosen yet. Wāwa waves from the corner, the two felt medallions are the choice, and the language the phone uses is
 * already marked.
 */
export function LanguageScreen() {
  const [pick, setPick] = useState<Pick>(phoneLanguage)

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[#6fb2ee]">
      <img src={asset('language/lang-bg.webp')} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover select-none" />

      <div className="relative mx-auto flex h-full w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]">
        <header className="pt-10 text-center text-white [text-shadow:0_2px_0_rgba(10,66,109,0.5),0_0_18px_rgba(10,66,109,0.35)]">
          <h1 className="text-[34px] leading-tight font-black">Elige tu idioma</h1>
          <p className="mt-1 text-lg font-extrabold opacity-95">Choose your language</p>
        </header>

        <div role="radiogroup" aria-label="Elige tu idioma / Choose your language" className="flex flex-1 items-center justify-center gap-5 pb-24">
          {OPTIONS.map((o) => {
            const on = pick === o.id
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPick(o.id)}
                className="flex flex-col items-center gap-3 outline-none"
              >
                <span
                  className={`relative block h-[8.5rem] w-[8.5rem] rounded-full transition-transform duration-150 ${
                    on ? '-translate-y-1.5 scale-105 shadow-[0_0_0_5px_#fff,0_0_0_9px_var(--color-jade)]' : 'opacity-95'
                  }`}
                >
                  <img
                    src={asset(`language/lang-${o.id}.webp`)}
                    alt=""
                    draggable={false}
                    className="h-full w-full select-none drop-shadow-[0_8px_8px_rgba(60,30,0,0.4)]"
                  />
                  {on && (
                    <span className="absolute -top-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-jade text-xl font-black text-white">
                      ✓
                    </span>
                  )}
                </span>
                <span className={`rounded-full px-4 py-1 text-lg font-black shadow-[0_3px_0_rgba(0,0,0,0.18)] ${on ? 'bg-jade text-white' : 'bg-card text-ink'}`}>
                  {o.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Wāwa waves from the corner, over the floor of the terrace. */}
        <img
          src={asset('language/lang-wawa.webp')}
          alt=""
          draggable={false}
          className="pointer-events-none absolute bottom-[4.75rem] left-0 w-[46%] max-w-52 -translate-x-3 select-none drop-shadow-[0_10px_8px_rgba(60,30,0,0.35)]"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-[15.5rem] left-[42%] rounded-2xl border-2 border-line bg-card px-3.5 py-1.5 text-[15px] font-black shadow-[0_3px_0_var(--color-line)]"
        >
          ¡Hola! · Hello!
          <span className="absolute top-1/2 -left-[7px] h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-line bg-card" />
        </span>

        <button type="button" autoFocus onClick={() => setLang(pick)} className="btn btn-primary relative mt-auto w-full">
          {TEXTS[pick].language.continue}
        </button>
      </div>
    </div>
  )
}
