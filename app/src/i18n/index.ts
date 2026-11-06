import type { Unit, Word } from '../data/course'
import { useProgress } from '../lib/progress'
import { en, type Texts } from './en'
import { es } from './es'

export type { Texts }
export type Language = 'en' | 'es'
export const TEXTS: Record<Language, Texts> = { en, es }

/** The language the phone is set to. */
export const phoneLanguage = (): Language => (navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en')

/** The language of the app: the one the learner chose; until they have, the phone's. */
export const useLang = (): Language => {
  const { lang } = useProgress()
  return lang === 'es' || lang === 'en' ? lang : phoneLanguage()
}

/** The words of the app in the learner's language. */
export const useT = (): Texts => TEXTS[useLang()]

/** The same, for code that is not a component (it reads what is saved right now). */
export const textsOf = (lang: string): Texts => TEXTS[lang === 'es' ? 'es' : 'en']

/** A province or a place on the map, in the learner's language (English names have no entry: they stay as they are). */
export const placeName = (lang: Language, name: string) => TEXTS[lang].places[name] ?? name

// What the words of the course say, in each language. Spanish is kept in the data next to the English.
export const meaningOf = (w: Word, lang: Language) => (lang === 'es' && w.es) || w.en
export const noteOf = (w: Word, lang: Language) => (lang === 'es' && w.noteEs) || w.note
export const exampleOf = (w: Word, lang: Language) => (lang === 'es' && w.example.es) || w.example.en
export const unitTitleOf = (u: Unit, lang: Language) => (lang === 'es' && u.titleEs) || u.title

/** Everything a screen needs to say a word in the learner's language. */
export function useWords() {
  const lang = useLang()
  return {
    lang,
    meaning: (w: Word) => meaningOf(w, lang),
    note: (w: Word) => noteOf(w, lang),
    example: (w: Word) => exampleOf(w, lang),
    unitTitle: (u: Unit) => unitTitleOf(u, lang),
    place: (name: string) => placeName(lang, name),
  }
}
