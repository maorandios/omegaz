import { useEffect, useState } from 'react'

export function useWebGLAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ??
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false })
      setAvailable(Boolean(gl))
    } catch {
      setAvailable(false)
    }
  }, [])

  return available
}
