import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { appCsp, baseHeaders } from './worker/security.ts'

/** Longest the app's scripts and styles wait for the splash painting (index.html) before they are asked for anyway. */
const PAINTING_FIRST_MS = 1500

/**
 * The splash painting comes before the app's scripts and styles: on a slow line they shared the connection with it,
 * so the painting arrived seconds late although it was asked for first. The built page asks for them only once the
 * painting has arrived (or after PAINTING_FIRST_MS): the scripts are fetched at once, and the app starts once the
 * stylesheet is in, so the loading screen is never drawn unstyled.
 */
const paintingFirst = (): Plugin => ({
  name: 'painting-first',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const entry = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/)
      if (!entry) throw new Error('painting-first: no entry script in index.html')
      const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">\s*/g)]
      const styles = [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">\s*/g)]
      for (const m of [entry, ...preloads, ...styles]) html = html.replace(m[0], '')
      const list = (ms: RegExpMatchArray[]) => JSON.stringify(ms.map((m) => m[1]))
      const loader = `<script>
      ;(function () {
        var started = false
        var add = function (rel, href) {
          var link = document.createElement('link')
          link.rel = rel
          link.href = href
          link.crossOrigin = ''
          document.head.appendChild(link)
          return link
        }
        var start = function () {
          if (started) return
          started = true
          ;[${JSON.stringify(entry[1])}].concat(${list(preloads)}).forEach(function (href) { add('modulepreload', href) })
          var styles = ${list(styles)}.map(function (href) {
            var link = add('stylesheet', href)
            return new Promise(function (done) { link.onload = link.onerror = done })
          })
          Promise.all(styles).then(function () {
            var script = document.createElement('script')
            script.type = 'module'
            script.crossOrigin = ''
            script.src = ${JSON.stringify(entry[1])}
            document.body.appendChild(script)
          })
        }
        var art = document.getElementById('boot-art')
        if (art.complete) start()
        else {
          art.addEventListener('load', start)
          art.addEventListener('error', start)
          setTimeout(start, ${PAINTING_FIRST_MS})
        }
      })()
    </script>
  </body>`
      return html.replace('</body>', loader)
    },
  },
})

/**
 * Writes dist/_headers, which Cloudflare applies to the static files (they never reach the Worker): the shared security
 * headers plus a Content-Security-Policy that allows the page's inline scripts by their hash. It reads the built page,
 * so the hashes follow whatever index.html and painting-first produce.
 */
const securityHeaders = (): Plugin => {
  let hashes: string[] = []
  let outDir = 'dist'
  return {
    name: 'security-headers',
    apply: 'build',
    configResolved: (config) => void (outDir = config.build.outDir),
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        hashes = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) =>
          createHash('sha256').update(m[1]).digest('base64'),
        )
      },
    },
    writeBundle() {
      if (!hashes.length) throw new Error('security-headers: found no inline scripts to allow')
      const lines = Object.entries({ ...baseHeaders, 'content-security-policy': appCsp(hashes) }).map(([k, v]) => `  ${k}: ${v}`)
      mkdirSync(outDir, { recursive: true })
      writeFileSync(join(outDir, '_headers'), `/*\n${lines.join('\n')}\n`)
    },
  }
}

// BASE_PATH lets the same build run at a domain root (Vercel) or under /repo/ (a sub-path host).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  // `npm run dev` talks to the Worker that `npm run dev:api` runs.
  server: { proxy: { '/api': 'http://localhost:8787', '/admin': 'http://localhost:8787' } },
  plugins: [
    react(),
    tailwindcss(),
    paintingFirst(),
    securityHeaders(),
    VitePWA({
      // A new service worker waits until the learner leaves the app; src/lib/updates.ts registers it and swaps it in then.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png'],
      // The manifest's big icons (512 px, ~0.6 MB) are fetched by the browser when the app is installed, not by the install here.
      includeManifestIcons: false,
      manifest: {
        name: 'Mandarin Journey · HSK 1',
        short_name: 'Mandarin Journey',
        description: 'Learn HSK 1 Mandarin for free: lessons, hanzi writing and review.',
        lang: 'en',
        theme_color: '#fbf7f0',
        background_color: '#fbf7f0',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // A new version never takes over in the middle of a visit (that reloaded the page under the learner's finger):
        // it waits, and src/lib/updates.ts swaps it in once the app goes to the background.
        skipWaiting: false,
        clientsClaim: true,
        // The install only fetches the app itself and what the first view of the map is made of, so it never competes
        // with the loading screen on a slow connection. Everything else (doors, friends, train, passport, stroke data)
        // is kept the first time it is fetched: src/journey/preload.ts warms it in the background when the connection
        // allows, and a screen that needs it sooner just asks for it.
        // The big install icons are only fetched by the browser when the app is installed, never needed offline.
        globIgnores: ['icon-512.png', 'icon-maskable-512.png'],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'brand/*.webp', 'journey/{map/lo,map-fog-v2-lo,splash-day,splash-night,nav-*}.webp'],
        // Opening the app never waits on the network: the page is answered from the copy kept with the app (precache),
        // which always points at the scripts and styles installed with it. A deploy is picked up in the background
        // (src/lib/updates.ts) and takes over the next time the learner leaves the app.
        navigateFallback: 'index.html',
        // The server's pages (the API and the admin page) are never answered with the app.
        navigateFallbackDenylist: [/^\/api\//, /^\/admin/],
        runtimeCaching: [
          {
            // Voice clips are kept as they are fetched (the lesson's clips are fetched ahead of it, src/lib/audio.ts), so
            // lessons already heard work offline. The browser asks audio for byte ranges, and Safari refuses a whole file
            // in answer: rangeRequests cuts the kept copy to the range asked for.
            urlPattern: ({ url }) => url.pathname.includes('/audio/'),
            handler: 'CacheFirst',
            options: { cacheName: 'audio', expiration: { maxEntries: 4000 }, rangeRequests: true },
          },
          {
            // Journey artwork (doors, friends, train, passport) is cached the first time it is shown or warmed.
            urlPattern: ({ url }) => url.pathname.includes('/journey/'),
            handler: 'CacheFirst',
            options: { cacheName: 'journey', expiration: { maxEntries: 400 } },
          },
          {
            // Stroke data for the writing trainer, so writing works offline once it has been fetched or warmed.
            urlPattern: ({ url }) => url.pathname.includes('/hanzi/'),
            handler: 'CacheFirst',
            options: { cacheName: 'hanzi', expiration: { maxEntries: 400 } },
          },
        ],
      },
    }),
  ],
})
