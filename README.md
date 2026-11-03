# Mandarin Journey · HSK 1

Free HSK 1 Mandarin course for Spanish speakers, built as an installable web app (PWA). The learner travels
through Panama: each unit is a province on an illustrated map, each lesson a door, and every learned word
becomes a spaced-repetition review card. A day and night version of the map, doors and lessons follows the learner's light.

The app lives in [`app/`](app/README.md) (React 19 + TypeScript + Vite). Its README covers the learning model,
the stack, local development, voice audio and deployment.

## Repository layout

- `app/` — the app: source in `app/src`, static files (artwork, audio, stroke data) in `app/public`.
- `design/` — art direction and working material that is not shipped: image briefs and prompts, source
  artwork (`design/assets`), references, previews, and the Panama pilot plan (`design/PANAMA-PILOT.md`).
  `design/respaldo-descargas/` is a local backup of Downloads and is ignored by git.
- `tools/` — scripts that prepare artwork, fonts and audio for the app (map and boat cutting, font subsetting,
  audio manifest and text-to-speech notebooks).
- `.github/workflows/ci.yml` — on every pull request: build, lint, `npm audit`, the progress-validator tests and a check that
  the build keeps its security headers. `.github/dependabot.yml` asks for dependency updates weekly. The site itself is
  deployed by Cloudflare from `main` (see `app/README.md`).

## Develop

```bash
cd app
npm install
npm run dev
```

## Deploy

Pushing changes under `app/` to `main` triggers the workflow above. In the repository settings, set
**Pages → Source** to **GitHub Actions**.

The earlier static version of the app (cards, practice blocks, worksheets) is no longer part of this repository.
