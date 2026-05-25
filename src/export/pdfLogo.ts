/**
 * Rasterises the public PDF logo (SVG) to a PNG data URL so jsPDF can embed
 * it inside the document footer. Cached for the lifetime of the page.
 */

const LOGO_SRC = '/logo-pdf.svg'
const LOGO_RENDER_SIZE = 256

let logoPromise: Promise<string | null> | null = null

async function loadLogoSvg(): Promise<HTMLImageElement> {
  const response = await fetch(LOGO_SRC, { cache: 'force-cache' })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${LOGO_SRC} (${response.status})`)
  }
  const svgText = await response.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to decode logo SVG'))
      img.src = url
    })
  } finally {
    // Defer cleanup so the image has finished decoding.
    queueMicrotask(() => URL.revokeObjectURL(url))
  }
}

function rasteriseToPng(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = LOGO_RENDER_SIZE
  canvas.height = LOGO_RENDER_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.clearRect(0, 0, LOGO_RENDER_SIZE, LOGO_RENDER_SIZE)
  ctx.drawImage(img, 0, 0, LOGO_RENDER_SIZE, LOGO_RENDER_SIZE)
  return canvas.toDataURL('image/png')
}

/** Returns a PNG data URL for the PDF logo, or null when the asset is unavailable. */
export function loadPdfLogo(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null)
  }
  if (!logoPromise) {
    logoPromise = loadLogoSvg()
      .then(rasteriseToPng)
      .catch((err) => {
        console.warn('PDF logo unavailable, falling back to text-only footer.', err)
        return null
      })
  }
  return logoPromise
}
