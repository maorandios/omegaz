import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const examplePath = resolve(root, '.env.example')
const localPath = resolve(root, '.env.local')

if (!existsSync(localPath) && existsSync(examplePath)) {
  copyFileSync(examplePath, localPath)
  console.log('Created .env.local from .env.example')
}

if (!existsSync(localPath)) {
  console.warn('[segments] Missing .env.local — copy .env.example and add Supabase keys.')
  process.exit(0)
}

const content = readFileSync(localPath, 'utf8')
const hasUrl = /^VITE_SUPABASE_URL=(?!https:\/\/your-project\.supabase\.co)/m.test(content)
const hasKey = /^VITE_SUPABASE_ANON_KEY=(?!your-anon-key)/m.test(content)

if (!hasUrl || !hasKey) {
  console.warn('')
  console.warn('[segments] Local Supabase auth is not configured yet.')
  console.warn('  1. Open Supabase → Project Settings → API')
  console.warn('  2. Paste Project URL + anon key into .env.local')
  console.warn('  3. Restart: npm run dev')
  console.warn('  (Use the same values as Vercel Production env vars.)')
  console.warn('')
}

const hasPaypalClient = /^VITE_PAYPAL_CLIENT_ID=.+$/m.test(content)
const hasPaypalPlan = /^VITE_PAYPAL_PLAN_ID=.+$/m.test(content)

if (!hasPaypalClient || !hasPaypalPlan) {
  console.warn('[segments] PayPal subscriptions are not configured locally.')
  console.warn('  1. PayPal Developer → My Apps & Credentials → grab the client id.')
  console.warn('  2. Create a GBP £39/month subscription plan and copy its plan id.')
  console.warn('  3. Set VITE_PAYPAL_CLIENT_ID + VITE_PAYPAL_PLAN_ID in .env.local.')
  console.warn('  4. For webhooks + cancel routes, also set PAYPAL_CLIENT_ID,')
  console.warn('     PAYPAL_SECRET, PAYPAL_WEBHOOK_ID, and SUPABASE_SERVICE_ROLE_KEY')
  console.warn('     in Vercel env vars (Production + Preview).')
  console.warn('')
}
