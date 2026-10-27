# Mandarin Learning Hub · v2

Free HSK 1 Mandarin course for Spanish speakers, built as an installable web app (PWA).
The legacy static app still lives at the repository root; this folder is its replacement.

## Learning model

- **Aprender** — 10 units (the thematic blocks), each with 6 lessons of 5 words plus a unit review.
  A lesson mixes: new word → meaning → match pairs → listening / pinyin / Spanish → Hanzi,
  two older words for spaced review, and one character to trace with stroke-order checking.
  Wrong answers come back at the end of the lesson. No lives, no paywall.
- **Repasar** — smart review of the weakest learned words, plus the full 300-word dictionary.
- **Escribir** — trace each unlocked character, then write it twice from memory.
- **Perfil** — streak, XP, accuracy, weekly chart, and a JSON export of the learner's data.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS 4, Motion for animation, Hanzi Writer for strokes,
vite-plugin-pwa for install/offline. Stroke data for the 248 HSK 1 characters is bundled in
`public/hanzi/`, so writing works offline.

Progress is local-first (`src/lib/progress.ts`): it is saved on the device and finished lessons
are queued in `outbox`, ready to be uploaded once accounts and sync are added.

## Develop

```bash
npm install
npm run dev
```

## Data

`src/data/hsk1.json`, `public/hanzi/` and `public/units/` are generated from the legacy files in
`../js/` and `../assets/ui/`. After changing the vocabulary, run from the repository root:

```bash
node tools/export-v2-data.mjs
```

## Voice audio

Words and example sentences play pre-generated clips from four Azure neural voices
(`src/data/voices.json`). Each exercise and each word card picks one at random, never the same as the
previous one, and keeps it for replays. Anything without a clip falls back to the device's Chinese voice.

1. `node tools/export-audio-manifest.mjs` writes `tools/audio-manifest.json`: 600 items
   (`w001`–`w300` words, `s001`–`s300` sentences) with their text and pinyin.
2. In Google Colab, upload the manifest and run `tools/azure_tts_colab.py` (Azure key and region in
   Colab Secrets). It writes `<voice>/<id>.mp3` (mono, 48 kbps, 24 kHz) to Drive and zips it.
   `tools/kokoro_colab.py` does the same with the open Kokoro model.
3. Unzip into `app/public/audio/`, so files land at `app/public/audio/<voice>/<id>.mp3`.

The folder names must match the voice names in `src/data/voices.json`. Clips are cached by the
service worker as they are played, so heard lessons work offline. The slow button plays the same
clip at 0.7× speed with the pitch preserved.

## Deploy

`.github/workflows/deploy-v2.yml` builds this folder and publishes it to GitHub Pages on every
push to `main`. In the repository settings, set **Pages → Source** to **GitHub Actions**.
For another host (Vercel, Cloudflare Pages), use `app` as the root directory and `npm run build`;
leave `BASE_PATH` unset when the app is served from a domain root.
