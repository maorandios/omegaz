import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const landingDir = path.dirname(fileURLToPath(import.meta.url))

/** Marketing site — always http://localhost:5174 (run from repo root: npm run dev:landing) */
export default defineConfig({
  root: landingDir,
  server: {
    port: 5174,
    strictPort: true,
  },
})
