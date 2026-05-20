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
        theme_color: '#9cac94',
        background_color: '#fdfbf7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
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
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Audio/fingerprint engine — separate chunk
          if (
            id.includes('audioFingerprintEngine') ||
            id.includes('petEmotionLibrary') ||
            id.includes('audioPipeline') ||
            id.includes('unifiedEngine')
          ) return 'audio-engine';
          // Heavy page routes — each gets its own async chunk
          if (id.includes('DogWhisperer'))     return 'page-dog';
          if (id.includes('CatWhisperer'))     return 'page-cat';
          if (id.includes('HorseWhisperer'))   return 'page-horse';
          if (id.includes('AnxietyTracker'))   return 'page-scans';
          if (id.includes('VocalCalibration')) return 'page-validation';
          if (id.includes('ApiDocs'))          return 'page-api';
          // Framer-motion — isolate animation lib
          if (id.includes('framer-motion'))    return 'vendor-motion';
          // React core
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) return 'vendor-react';
        }
      }
    }
  }
})
