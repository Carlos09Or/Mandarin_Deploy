import { useProgress } from '../lib/progress'
import { en, type Texts } from './en'
import { es } from './es'

export type { Texts }
export const TEXTS: Record<'en' | 'es', Texts> = { en, es }

/** The language of the app: the one the learner chose, English until they have. */
export const useLang = (): 'en' | 'es' => (useProgress().lang === 'es' ? 'es' : 'en')

/** The words of the app in the learner's language. */
export const useT = (): Texts => TEXTS[useLang()]

/** The same, for code that is not a component (it reads what is saved right now). */
export const textsOf = (lang: string): Texts => TEXTS[lang === 'es' ? 'es' : 'en']
