// Run with: node --test tools/validate-progress.test.mjs
// The first group is what real clients send and must never be refused; the second is what the server must refuse.
import test from 'node:test'
import assert from 'node:assert/strict'
import { progressProblem } from '../app/worker/validate.ts'

// A document a browser really saved (fresh install, 2026-11-03).
const fresh = {"v":1,"deviceId":"bb5ea1d8-41b4-42f8-ae16-74b660640717","createdAt":"2026-11-03T16:19:50.898Z","xp":0,"gems":0,"outfits":{},"traveler":"wawa","revealed":["panama"],"scenery":"auto","dailyXp":{},"streak":{"last":null,"count":0},"nodes":{},"words":{},"chars":{},"outbox":[],"cards":{},"reviews":[],"sessionSize":15,"retention":0.9,"reviewDay":null,"ratings":{},"modifiedAt":1793722793357,"epoch":"initial","epochAt":0}

// A learner some weeks in, built to the types in src/lib/progress.ts and srs.ts.
const busy = {
  ...fresh,
  xp: 4210, gems: 380, scenery: 'night', outfits: { wawa: 'auto', pip: 'night' },
  dailyXp: { '2026-10-30': 120, '2026-10-31': 45, '2026-11-01': 0 },
  streak: { count: 12, last: '2026-11-03' },
  nodes: { '1-1': { completions: 3, bestAccuracy: 100, lastAt: '2026-11-01T10:00:00.000Z' }, '1-cp': { completions: 1, bestAccuracy: 83, lastAt: '2026-11-02T10:00:00.000Z' } },
  words: { 1: { seen: 30, correct: 25, wrong: 5, last: 1793722793357 }, 502: { seen: 2, correct: 2, wrong: 0, last: 1793722793357 } },
  chars: { 我: { traced: 4, clean: 2 }, 你: { traced: 1, clean: 0 } },
  cards: { 1: { due: 1793900000000, stability: 4.5, difficulty: 5.1, scheduledDays: 4, learningSteps: 0, reps: 6, lapses: 1, state: 2, last: 1793722793357 }, 2: { due: 1793722793357, stability: 0, difficulty: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: 0, last: null } },
  reviews: [{ n: 1, at: 1793722793357, r: 3, s: 2, src: 'card' }, { n: 2, at: 1793722793999, r: 1, s: 0, src: 'lesson' }],
  outbox: [{ type: 'lesson_completed', node: '1-1', at: '2026-11-01T10:00:00.000Z', durationMs: 412_000, answers: 20, mistakes: 3, accuracy: 85, xp: 40, gems: 5 }],
  ratings: { '1-1': { stars: 5, at: 1793722793357 } },
  sessionSize: 30, retention: 0.95, reviewDay: '2026-11-03',
}
// A lesson left open overnight, and a full review log: long but legitimate.
const overnight = { ...busy, outbox: [{ ...busy.outbox[0], durationMs: 12 * 3_600_000 }] }
const fullLog = { ...busy, reviews: Array.from({ length: 3000 }, (_, i) => ({ n: i % 500, at: 1793722793357 + i, r: 1 + (i % 4), s: i % 4, src: 'card' })) }
// An older save that lacks most fields.
const old = { v: 1, xp: 10, streak: { count: 1, last: '2026-01-02' } }

test('what real clients send is accepted', () => {
  for (const [name, doc] of Object.entries({ fresh, busy, overnight, fullLog, old })) assert.equal(progressProblem(doc), null, name)
})

test('a field the server does not know passes untouched', () => {
  assert.equal(progressProblem({ ...busy, somethingNew: { a: 1 } }), null)
})

const bad = (name, doc, field) => test(`refused: ${name}`, () => assert.equal(progressProblem(doc), field))
bad('not an object', 'hello', 'v')
bad('an array', [], 'v')
bad('wrong version', { ...busy, v: 2 }, 'v')
bad('negative xp', { ...busy, xp: -1 }, 'xp')
bad('infinite xp', { ...busy, xp: 1e30 }, 'xp')
bad('xp as text', { ...busy, xp: '5000' }, 'xp')
bad('streak count far too high', { ...busy, streak: { count: 1e9, last: null } }, 'streak')
bad('streak date that is not a date', { ...busy, streak: { count: 1, last: 'yesterday' } }, 'streak')
bad('scenery not one of three', { ...busy, scenery: 'purple' }, 'scenery')
bad('retention of 5', { ...busy, retention: 5 }, 'retention')
bad('rating of 9 stars', { ...busy, ratings: { '1-1': { stars: 9, at: 1 } } }, 'ratings')
bad('rating of 0 stars', { ...busy, ratings: { '1-1': { stars: 0, at: 1 } } }, 'ratings')
bad('rating as text', { ...busy, ratings: { '1-1': { stars: '5', at: 1 } } }, 'ratings')
bad('a lesson that lasted a month', { ...busy, outbox: [{ ...busy.outbox[0], durationMs: 30 * 86_400_000 }] }, 'outbox')
bad('a lesson with a negative duration', { ...busy, outbox: [{ ...busy.outbox[0], durationMs: -5 }] }, 'outbox')
bad('an outbox of 5000 lessons', { ...busy, outbox: Array.from({ length: 5000 }, () => busy.outbox[0]) }, 'outbox')
bad('a review log of 10000 answers', { ...busy, reviews: Array.from({ length: 10_000 }, () => busy.reviews[0]) }, 'reviews')
bad('a review answered with button 9', { ...busy, reviews: [{ ...busy.reviews[0], r: 9 }] }, 'reviews')
bad('a card in state 7', { ...busy, cards: { 1: { ...busy.cards[1], state: 7 } } }, 'cards')
bad('100000 cards', { ...busy, cards: Object.fromEntries(Array.from({ length: 100_000 }, (_, i) => [i, busy.cards[1]])) }, 'cards')
bad('a day key that is not a date', { ...busy, dailyXp: { today: 5 } }, 'dailyXp')
bad('a node that is not an object', { ...busy, nodes: { '1-1': 5 } }, 'nodes')
bad('a node key of 1000 characters', { ...busy, nodes: { ['x'.repeat(1000)]: busy.nodes['1-1'] } }, 'nodes')
bad('collections as arrays', { ...busy, words: [] }, 'words')
