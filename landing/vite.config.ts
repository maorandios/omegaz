import { defineConfig } from 'vite'

/** Marketing site — always http://localhost:5174 (run from repo root: npm run dev:landing) */
export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
  },
})
