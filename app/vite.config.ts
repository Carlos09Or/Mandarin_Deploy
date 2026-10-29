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
      // A new service worker takes over at once; src/lib/updates.ts registers it and reloads onto it.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png'],
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
        // A new service worker takes over at once instead of waiting for every tab to close.
        skipWaiting: true,
        clientsClaim: true,
        // The journey artwork is precached too, so after the first visit everything opens from the device.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,json,webp}'],
        // Opening or reloading the app asks the network for the page first, so a deploy shows up on the next
        // reload; the stored copy of index.html is only the offline fallback. Scripts and styles have hashed
        // names, so the page it returns always points at files that match it.
        navigateFallback: null,
        directoryIndex: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              // Skip the browser's own HTTP cache too (GitHub Pages sends max-age=600).
              fetchOptions: { cache: 'no-cache' },
              precacheFallback: { fallbackURL: 'index.html' },
            },
          },
          {
            // Voice clips are cached as they are played, so lessons already heard work offline.
            urlPattern: ({ url }) => url.pathname.includes('/audio/'),
            handler: 'CacheFirst',
            options: { cacheName: 'audio', expiration: { maxEntries: 4000 } },
          },
          {
            // Journey artwork (map, train, passport) is cached the first time it is shown.
            urlPattern: ({ url }) => url.pathname.includes('/journey/'),
            handler: 'CacheFirst',
            options: { cacheName: 'journey', expiration: { maxEntries: 200 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
