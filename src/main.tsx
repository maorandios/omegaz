import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

function markReady() {
  document.documentElement.dataset.appReady = 'true'
  const boot = document.getElementById('boot-fallback')
  if (boot) boot.remove()
}

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)

markReady()
