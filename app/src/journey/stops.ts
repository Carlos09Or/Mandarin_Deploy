import { nodesOfUnit, word, type PathNode, type Word } from '../data/course'
import { PROVINCES, hasContent, type Province } from '../data/journey'
import type { Progress } from '../lib/progress'

/** A stop on a province's line: a lesson at a place, the story, or the landmark checkpoint. */
export type Stop =
  | { kind: 'lesson'; node: PathNode; place: string; key: Word }
  | { kind: 'story'; title: string; sub: string }
  | { kind: 'goal'; node: PathNode; place: string }

export function stopsOf(p: Province): Stop[] {
  const stops: Stop[] = []
  for (const node of nodesOfUnit(p.unit)) {
    if (node.kind === 'checkpoint') {
      stops.push({ kind: 'goal', node, place: p.landmark!.name })
      continue
    }
    stops.push({ kind: 'lesson', node, place: p.stops![node.index] ?? `Stop ${node.index + 1}`, key: word(node.words[0]) })
    if (node.index === 1 && p.story) stops.push({ kind: 'story', ...p.story })
  }
  return stops
}

/** Index of the next stop to ride to; the story never blocks the line. */
export function nextStop(stops: Stop[], progress: Progress) {
  const i = stops.findIndex((s) => s.kind !== 'story' && !progress.nodes[s.node.id])
  return i === -1 ? stops.length : i
}

export const provinceDone = (p: Province, progress: Progress) => !!progress.nodes[`u${p.unit}-cp`]

/** A province opens once the one before it has passed its checkpoint. */
export const isUnlocked = (p: Province, progress: Progress) => {
  const before = PROVINCES.find((q) => q.unit === p.unit - 1)
  return !before || provinceDone(before, progress)
}

/** Open provinces with lessons, in travel order. */
export const openProvinces = (progress: Progress) => PROVINCES.filter((p) => hasContent(p) && isUnlocked(p, progress))

/** Where the traveller is: the last open province not finished yet (or the last one open). */
export function currentProvince(progress: Progress): Province {
  const open = openProvinces(progress)
  return open.find((p) => !provinceDone(p, progress)) ?? open[open.length - 1] ?? PROVINCES[0]
}

/** The next province with lessons after p, if there is one. */
export const nextProvince = (p: Province) => PROVINCES.find((q) => q.unit === p.unit + 1 && hasContent(q))
