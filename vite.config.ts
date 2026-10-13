import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://jayr-ai.github.io/worship-board/ — asset paths need
// this subpath prefix or they'll 404.
export default defineConfig({
  base: '/worship-board/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Worship Board',
        short_name: 'Worship Board',
        description: '4-in-1 worship audio pad board',
        start_url: '.',
        display: 'standalone',
        orientation: 'landscape',
        theme_color: '#0B1530',
        background_color: '#0B1530',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
      },
    }),
  ],
})
