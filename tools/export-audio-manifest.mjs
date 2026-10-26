// Writes tools/audio-manifest.json: every text the app speaks, with a stable id.
// Feed it to tools/kokoro_colab.py, then put the resulting files in app/public/audio/<voice>/<id>.mp3.
// Run from the repo root after changing the vocabulary: node tools/export-audio-manifest.mjs
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'app/src/data/hsk1.json'), 'utf8'))
const voices = JSON.parse(fs.readFileSync(path.join(root, 'app/src/data/voices.json'), 'utf8'))

const pad = (n) => String(n).padStart(3, '0')
const items = [
  ...data.words.map((w) => ({ id: `w${pad(w.n)}`, kind: 'word', text: w.hanzi, pinyin: w.pinyin, es: w.es })),
  ...data.words.map((w) => ({
    id: `s${pad(w.n)}`,
    kind: 'sentence',
    text: w.example.hanzi,
    pinyin: w.example.pinyin,
    en: w.example.en,
  })),
]

const manifest = {
  version: 1,
  format: { container: 'mp3', channels: 1, bitrate: '48k', sampleRate: 24000 },
  path: 'app/public/audio/{voice}/{id}.mp3',
  voices: voices.voices,
  items,
}
fs.writeFileSync(path.join(root, 'tools/audio-manifest.json'), JSON.stringify(manifest, null, 1) + '\n')
const chars = items.reduce((a, i) => a + [...i.text].length, 0)
console.log(`${items.length} clips per voice, ${chars} characters, ${voices.voices.length} voices`)
