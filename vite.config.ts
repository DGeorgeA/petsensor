import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sense My Pet',
        short_name: 'Sense Pet',
        description: 'A deeply endearing, emotionally warm Zen-like pet wellness companion.',
        theme_color: '#9cac94', // Sage Green
        background_color: '#fdfbf7', // Warm Cream
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['_backup']
  },
  server: {
    watch: {
      ignored: ['**/_backup/**']
    }
  }
})
