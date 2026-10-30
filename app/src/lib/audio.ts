// Mandarin speech, plus short feedback chimes.
// Words and example sentences play pre-generated clips (Azure neural voices, see
// tools/azure_tts_colab.py) from public/audio/<voice>/<id>.mp3. The voice changes at random so
// learners get used to different speakers, but stays put within one exercise or word card, so
// replaying (or the slow button) sounds the same. Any text without a clip, or a clip that fails
// to load, falls back to the device's own Chinese voice.

import raw from '../data/hsk1.json'
import voices from '../data/voices.json'
import { lowBandwidth } from './network'

const pad = (n: number) => String(n).padStart(3, '0')
const CLIPS = new Map<string, string>()
for (const w of raw.words) {
  CLIPS.set(w.hanzi, `w${pad(w.n)}`)
  if (!CLIPS.has(w.example.hanzi)) CLIPS.set(w.example.hanzi, `s${pad(w.n)}`)
}

let lastVoice = ''
/** One voice for the whole session: on a poor connection every voice would be its own download. */
let steady = ''
/** A random voice, never the same one twice in a row; always the same one on a poor connection, where its clips are the ones fetched ahead. */
function randomVoice() {
  if (lowBandwidth()) return (steady ||= voices.voices[Math.floor(Math.random() * voices.voices.length)])
  const options = voices.voices.filter((v) => v !== lastVoice)
  lastVoice = options[Math.floor(Math.random() * options.length)]
  return lastVoice
}

/** Clips already asked for, so each is fetched once. */
const fetched = new Set<string>()
/**
 * Fetches the voice clips of these words ahead of time (the service worker keeps them), so a lesson's first plays do not
 * wait on the network. Every voice on a good connection, only the session's voice on a poor one, and no more than
 * `MAX_AHEAD` words (a checkpoint covers a whole unit).
 */
const MAX_AHEAD = 12
export async function prefetchClips(words: number[]) {
  const low = lowBandwidth()
  const who = low ? [randomVoice()] : voices.voices
  const urls = words
    .slice(0, MAX_AHEAD)
    .flatMap((n) => [`w${pad(n)}`, `s${pad(n)}`])
    .flatMap((id) => who.map((v) => `${import.meta.env.BASE_URL}audio/${v}/${id}.mp3`))
    .filter((u) => !fetched.has(u) && fetched.add(u))
  let next = 0
  const worker = async () => {
    while (next < urls.length) await fetch(urls[next++]).then((r) => r.arrayBuffer()).catch(() => undefined)
  }
  await Promise.all([worker(), worker()])
}

let pinned: string | null = null
/** Pick a new random voice and keep it until the next call (one exercise, one word card). */
export function pinRandomVoice() {
  pinned = randomVoice()
}
/** Back to a fresh random voice on every play. */
export function unpinVoice() {
  pinned = null
}

const missing = new Set<string>()
let player: HTMLAudioElement | null = null

function playClip(id: string, slow: boolean, fallback: () => void) {
  const key = `${pinned ?? randomVoice()}/${id}`
  if (missing.has(key)) return fallback()
  player?.pause()
  const a = new Audio(`${import.meta.env.BASE_URL}audio/${key}.mp3`)
  player = a
  a.preservesPitch = true
  a.playbackRate = slow ? 0.7 : 1
  let fellBack = false
  const fail = () => {
    missing.add(key)
    if (player === a && !fellBack) {
      fellBack = true
      fallback()
    }
  }
  a.addEventListener('error', fail)
  a.play().catch((e: DOMException) => {
    // Autoplay rules block sound until the first tap; anything else means the clip can't play.
    if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') fail()
  })
}

const PREFERRED = ['Lili', 'Tingting', 'Ting-Ting', 'Google 普通话', 'Xiaoxiao', 'Yunxi', 'Meijia']
let voice: SpeechSynthesisVoice | null = null

function pickVoice() {
  if (!('speechSynthesis' in window)) return
  const zh = speechSynthesis.getVoices().filter((v) => /^zh[-_](CN|Hans)/i.test(v.lang) || v.lang === 'zh')
  voice =
    PREFERRED.map((name) => zh.find((v) => v.name.includes(name) && /premium|enhanced/i.test(v.name))).find(Boolean) ??
    PREFERRED.map((name) => zh.find((v) => v.name.includes(name))).find(Boolean) ??
    zh[0] ??
    null
}
if ('speechSynthesis' in window) {
  pickVoice()
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

export function speak(text: string, opts: { slow?: boolean } = {}) {
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  const id = CLIPS.get(text)
  if (id) playClip(id, !!opts.slow, () => speakWithDevice(text, opts))
  else speakWithDevice(text, opts)
}

function speakWithDevice(text: string, opts: { slow?: boolean }) {
  if (!('speechSynthesis' in window)) return
  player?.pause()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  if (voice) u.voice = voice
  u.rate = opts.slow ? 0.55 : 0.85
  speechSynthesis.speak(u)
}

let ctx: AudioContext | null = null
function tone(freqs: number[], step: number, type: OscillatorType, gain = 0.08) {
  try {
    ctx ??= new AudioContext()
    const start = ctx.currentTime
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const g = ctx!.createGain()
      osc.type = type
      osc.frequency.value = f
      const t = start + i * step
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(gain, t + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + step * 2.2)
      osc.connect(g).connect(ctx!.destination)
      osc.start(t)
      osc.stop(t + step * 2.4)
    })
  } catch {
    /* audio blocked: stay silent */
  }
}

export const chime = {
  correct: () => tone([660, 880], 0.09, 'sine'),
  wrong: () => tone([300, 240], 0.11, 'triangle', 0.06),
  done: () => tone([523, 659, 784, 1046], 0.1, 'sine'),
}
