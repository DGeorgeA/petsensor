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
      workbox: {
        // TF.js worker bundle can exceed the default precache cap.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            // COCO-SSD model weights (downloaded once, then cached for offline use).
            urlPattern: /^https:\/\/storage\.googleapis\.com\/tfjs-models\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tfjs-model',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // TF.js WASM backend binaries (fallback path).
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@tensorflow\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tfjs-wasm',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Sense My Pet — Dog & Cat Stress Screening',
        short_name: 'Sense My Pet',
        description: 'Privacy-first, on-device AI that screens your dog or cat for stress and anxiety from their sounds and body language. Nothing is uploaded.',
        theme_color: '#ff8c7a',
        background_color: '#fff1e6',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['health', 'lifestyle', 'medical'],
        lang: 'en',
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
