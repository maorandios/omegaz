import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearSession } from '@/store/persist'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

async function resetAppStorage() {
  try {
    clearSession()
    localStorage.removeItem('FOLDS-app')
  } catch {
    // ignore
  }
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    // ignore
  }
  window.location.reload()
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
          <h1 className="text-lg font-semibold text-primary">FOLDS could not start</h1>
          <p className="max-w-sm text-sm text-muted">
            Something went wrong loading the app. Reset stored data and reload — your saved
            projects on this device will be cleared.
          </p>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => void resetAppStorage()}
          >
            Reset app &amp; reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
