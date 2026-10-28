import type HanziWriter from 'hanzi-writer'

type Loader = NonNullable<Parameters<typeof HanziWriter.create>[2]>['charDataLoader']
export type CharData = { strokes: string[]; medians: number[][][]; radStrokes?: number[] }

/** Stroke data comes from public/hanzi, so writing works offline. */
export const fetchChar = (char: string): Promise<CharData> =>
  fetch(`${import.meta.env.BASE_URL}hanzi/${char}.json`).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))

export const loadChar: Loader = (char, onLoad, onError) => {
  fetchChar(char).then(onLoad).catch(onError)
}
