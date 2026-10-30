import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH lets the same build run at a domain root (Vercel) or under /repo/ (GitHub Pages).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
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
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'brand/*.webp', 'journey/{map-illustrated-clean-lo,map-fog-clean-lo,splash-day,splash-night,nav-*}.webp'],
        // Opening the app never waits on the network: the page is answered from the copy kept with the app (precache),
        // which always points at the scripts and styles installed with it. A deploy is picked up in the background
        // (src/lib/updates.ts) and takes over the next time the learner leaves the app.
        navigateFallback: 'index.html',
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
