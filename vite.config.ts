import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const OPTIONAL_CHUNKS = /konva|react-konva/

export default defineConfig({
  build: {
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !OPTIONAL_CHUNKS.test(dep)),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/konva') || id.includes('node_modules/react-konva')) {
            return 'konva-canvas'
          }
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'pwa-192.svg'],
      manifest: {
        name: 'OMEGAZ — Fabrication Request',
        short_name: 'OMEGAZ',
        description: 'Fast guided fabrication request generator for folded metal profiles',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'pwa-192.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/konva-canvas-*.js'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
