import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const OPTIONAL_CHUNKS = /konva|react-konva/

// Where the Vite dev server should proxy /api/* requests. Vercel serverless
// functions don't run under plain `vite`, so we forward them to the live
// deployment. Override per-environment via VITE_DEV_API_TARGET in .env.local.
const DEV_API_TARGET =
  process.env.VITE_DEV_API_TARGET || 'https://app.getsegments.co'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Pipe /api/* through the deployed Vercel API so the PayPal subscribe /
      // confirm / cancel routes work in `npm run dev`. The local Supabase
      // session is forwarded as-is, so the production API authenticates the
      // same user that's signed in locally.
      '/api': {
        target: DEV_API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
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
      // Auto-activate new SWs so the latest deploy ships to returning users on
      // the next page load. Without this, the old bundle keeps serving until
      // the user manually clears storage.
      registerType: 'autoUpdate',
      includeAssets: ['new_fav.png', 'segments-logo.svg'],
      manifest: {
        name: 'Segments — Fabrication Request',
        short_name: 'Segments',
        description: 'Fast guided fabrication request generator for folded metal profiles',
        theme_color: '#0D0D0D',
        background_color: '#0D0D0D',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'new_fav.png', sizes: '192x192', type: 'image/png' },
          { src: 'new_fav.png', sizes: 'any', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
        globIgnores: ['**/konva-canvas-*.js'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        // Take control of any open clients the moment the new SW activates,
        // and skip the "waiting" state — combined with registerType:'autoUpdate'
        // this means returning users get the latest deploy on next reload.
        clientsClaim: true,
        skipWaiting: true,
        // PayPal redirect URLs must always hit the network so the user lands
        // on the live billing landing page, not a stale cached copy.
        navigateFallbackDenylist: [/^\/api\//, /^\/billing\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
