# Mandarin Learning Hub · v2

Free HSK 1 Mandarin course for Spanish speakers, built as an installable web app (PWA).

## Learning model

- **Aprender** — 10 units (the thematic blocks), each with 6 lessons of 5 words plus a unit review.
  A lesson mixes: new word → meaning → match pairs → listening / pinyin / Spanish → Hanzi,
  two older words for spaced review, and one character to trace with stroke-order checking.
  Wrong answers come back at the end of the lesson. No lives, no paywall.
- **Repasar** — Anki-style review cards: every word from a finished lesson becomes a card, and a card comes back
  when you are about to forget it (FSRS scheduling, `src/lib/srs.ts`). Study, Stats (retention, card counts,
  calendar, forecast, hardest cards) and the full 300-word dictionary.
  There is no daily limit: a study session holds 15 cards (adjustable) and the next one starts right away, and
  Practice drills the trickiest words in rounds without touching the schedule.
- **Escribir** — trace each unlocked character, then write it twice from memory.
- **Perfil** — streak, XP, accuracy, weekly chart, and a JSON export of the learner's data.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS 4, Motion for animation, Hanzi Writer for strokes,
ts-fsrs for card scheduling, vite-plugin-pwa for install/offline. Stroke data for the 248 HSK 1 characters is bundled in
`public/hanzi/`, so writing works offline.

Progress is local-first (`src/lib/progress.ts`): it is saved on the device and works offline. Signed-in
learners also have it synced to their account (see **Accounts** below).
Each card's schedule (`cards`) and every answer (`reviews`, the last 3000) are kept there too; the review
statistics are worked out from them in `src/lib/cards.ts`.

## Develop

```bash
npm install
npm run dev
```

## Data

`src/data/hsk1.json` holds the 300-word vocabulary and is the source for the audio manifest below.
`public/hanzi/` holds the stroke data for the writing trainer.

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

Cloudflare builds and deploys this folder on every push to `main` (root `app`, build `npm run build`). There is no
GitHub Pages deploy any more. For another host, use `app` as the root directory and `npm run build`; leave `BASE_PATH`
unset when the app is served from a domain root (set it only to serve under `/repo/`).

## Accounts

Sign in with Google; progress syncs between devices. Without an account (or on hosting with no server) the app works
exactly as before.

- `worker/index.ts` — the Cloudflare Worker: Google sign-in (code flow + PKCE), cookie sessions, one progress document
  per learner in **D1**, and `/admin` (`worker/admin.ts`). Static files are served straight from the assets; the Worker
  only runs for `/api/*` and `/admin` (`wrangler.jsonc`).
- `migrations/` — the D1 schema.
- `src/lib/account.ts` — sign-in state and background sync. `src/lib/merge.ts` — how two copies of one learner's progress
  (two devices) are combined: the work of both is kept; a reset wins over older data (`epoch`).
- `src/components/Account.tsx` — the Profile section.

### Develop

```bash
cp .dev.vars.example .dev.vars   # DEV_LOGIN=1 lets you sign in as any email, no Google needed
npm run db:local                 # creates the local D1 tables
npm run build && npm run dev:api # the app and API on http://localhost:8787
```

### Set up on Cloudflare (once)

1. `npx wrangler login`, then `npx wrangler d1 create mandarin-journey` and paste the `database_id` it prints into
   `wrangler.jsonc`.
2. `npx wrangler d1 migrations apply DB --remote`
3. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application). Authorized redirect URI:
   `https://<your-worker-url>/` (with the trailing slash; add `http://localhost:8787/` to try it locally). Copy the client ID and secret.
4. `npx wrangler secret put GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_EMAILS` (comma-separated emails that may open `/admin`).
5. In the Cloudflare dashboard (Workers → the project → Settings → Build) set the deploy command to `npx wrangler deploy`
   (the old `--assets ./dist …` flags are not needed any more: `wrangler.jsonc` has them).
