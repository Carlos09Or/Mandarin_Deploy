// The friends who bring in a new word (lesson/Intro.tsx): which pictures each one has. They are cut
// from the design storyboards and live in public/journey/words.

export const QUICK = ['wawa', 'harpia', 'tucan'] as const
export type Friend = (typeof QUICK)[number] | 'sloth'
export type Pose = 'enter' | 'alert' | 'settled' | 'idle' | 'peek' | 'effort' | 'up-effort' | 'up-done'

export const file = (friend: Friend, pose: Pose) => `words/${friend}-${pose}.webp`
export const POSES: Record<Friend, Pose[]> = {
  wawa: ['enter', 'alert', 'settled', 'idle'],
  harpia: ['enter', 'alert', 'settled', 'idle'],
  tucan: ['enter', 'alert', 'settled', 'idle'],
  sloth: ['peek', 'effort', 'up-effort', 'up-done'],
}
/** Every picture of every friend, so the lesson can warm them up. */
export const WORD_FRIEND_FILES = (Object.keys(POSES) as Friend[]).flatMap((f) => POSES[f].map((p) => file(f, p)))
