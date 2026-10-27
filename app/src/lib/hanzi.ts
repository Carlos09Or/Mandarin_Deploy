import type HanziWriter from 'hanzi-writer'

type Loader = NonNullable<Parameters<typeof HanziWriter.create>[2]>['charDataLoader']

/** Stroke data comes from public/hanzi, so writing works offline. */
export const loadChar: Loader = (char, onLoad, onError) => {
  fetch(`${import.meta.env.BASE_URL}hanzi/${char}.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(onLoad)
    .catch(onError)
}
