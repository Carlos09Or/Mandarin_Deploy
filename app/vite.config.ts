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
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mandarin Learning Hub · HSK 1',
        short_name: 'Mandarin Hub',
        description: 'Learn HSK 1 Mandarin for free: lessons, hanzi writing and review.',
        lang: 'en',
        theme_color: '#e0453a',
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
        // The journey artwork is precached too, so after the first visit everything opens from the device.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,json,webp}'],
        runtimeCaching: [
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
