// Mandarin speech through the device's voices, plus short feedback chimes.
// Recorded audio can replace speak() later without touching the screens.

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
  if (!('speechSynthesis' in window)) return
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
