import type { jsPDF } from 'jspdf'

/**
 * Lazily fetches Unicode TTF fonts from /public/fonts and registers them with
 * the supplied jsPDF document. This is what lets users type Hebrew (and other
 * non-Latin scripts) into notes, names, etc. without the PDF showing
 * gibberish — jsPDF's bundled helvetica only covers WinAnsi.
 *
 * Fonts are downloaded once per session and cached as base64 strings; each
 * jsPDF document still needs them re-registered into its own virtual FS.
 */

const FONT_URLS = {
  latinRegular: '/fonts/NotoSans-Regular.ttf',
  latinBold: '/fonts/NotoSans-Bold.ttf',
  hebrewRegular: '/fonts/NotoSansHebrew-Regular.ttf',
  hebrewBold: '/fonts/NotoSansHebrew-Bold.ttf',
} as const

interface LoadedFonts {
  latinRegular: string
  latinBold: string
  hebrewRegular: string
  hebrewBold: string
}

export const PDF_FONT_LATIN = 'NotoSans'
export const PDF_FONT_HEBREW = 'NotoSansHebrew'
export const PDF_FONT_FALLBACK = 'helvetica'

let fontsPromise: Promise<LoadedFonts | null> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  return btoa(binary)
}

async function fetchFont(url: string): Promise<string> {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`)
  const buffer = await response.arrayBuffer()
  return arrayBufferToBase64(buffer)
}

function loadFonts(): Promise<LoadedFonts | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFont(FONT_URLS.latinRegular),
      fetchFont(FONT_URLS.latinBold),
      fetchFont(FONT_URLS.hebrewRegular),
      fetchFont(FONT_URLS.hebrewBold),
    ])
      .then(([latinRegular, latinBold, hebrewRegular, hebrewBold]) => ({
        latinRegular,
        latinBold,
        hebrewRegular,
        hebrewBold,
      }))
      .catch((err) => {
        console.warn(
          'PDF Unicode fonts failed to load; falling back to built-in helvetica.',
          err,
        )
        return null
      })
  }
  return fontsPromise
}

/**
 * Registers the Unicode fonts on the given document and sets the Latin font
 * as the default. Returns true when both font families are available; false
 * means callers must use the bundled helvetica fallback (non-Latin text will
 * still come through as gibberish, same as before this change).
 */
export async function ensurePdfFonts(doc: jsPDF): Promise<boolean> {
  const fonts = await loadFonts()
  if (!fonts) return false

  doc.addFileToVFS('NotoSans-Regular.ttf', fonts.latinRegular)
  doc.addFont('NotoSans-Regular.ttf', PDF_FONT_LATIN, 'normal')
  doc.addFileToVFS('NotoSans-Bold.ttf', fonts.latinBold)
  doc.addFont('NotoSans-Bold.ttf', PDF_FONT_LATIN, 'bold')

  doc.addFileToVFS('NotoSansHebrew-Regular.ttf', fonts.hebrewRegular)
  doc.addFont('NotoSansHebrew-Regular.ttf', PDF_FONT_HEBREW, 'normal')
  doc.addFileToVFS('NotoSansHebrew-Bold.ttf', fonts.hebrewBold)
  doc.addFont('NotoSansHebrew-Bold.ttf', PDF_FONT_HEBREW, 'bold')

  doc.setFont(PDF_FONT_LATIN, 'normal')
  return true
}

/** Hebrew block in BMP. Arabic (\u0600-\u06FF) would also belong here if its
 * font ever ships. */
const RTL_PATTERN = /[\u0590-\u05FF]/
const HEBREW_CHAR = /[\u0590-\u05FF]/

export function isRtlText(text: string | undefined | null): boolean {
  return text != null && RTL_PATTERN.test(text)
}

export interface FontContext {
  /** True once Unicode fonts are registered with the doc. */
  unicodeReady: boolean
}

/**
 * Picks the right registered font family for a piece of text. When Unicode
 * fonts are loaded the result is `NotoSans` or `NotoSansHebrew`; otherwise it
 * falls back to the built-in helvetica.
 */
export function fontFamilyForText(text: string, ctx: FontContext): string {
  if (!ctx.unicodeReady) return PDF_FONT_FALLBACK
  return isRtlText(text) ? PDF_FONT_HEBREW : PDF_FONT_LATIN
}

/**
 * Converts a logical-order string with Hebrew text into the visual order jsPDF
 * actually paints. jsPDF 4.x has no bidi pass, so Hebrew has to be reversed by
 * hand; we keep Latin/digit runs in their original order so embedded words or
 * numbers still read correctly inside Hebrew sentences.
 */
export function toVisualOrder(text: string): string {
  if (!HEBREW_CHAR.test(text)) return text

  type Run = { text: string; rtl: boolean }
  const runs: Run[] = []
  let buffer = ''
  let bufferIsRtl: boolean | null = null

  const flush = () => {
    if (buffer.length === 0) return
    runs.push({ text: buffer, rtl: bufferIsRtl ?? false })
    buffer = ''
    bufferIsRtl = null
  }

  for (const char of text) {
    const isHebrew = HEBREW_CHAR.test(char)
    if (bufferIsRtl === null) {
      bufferIsRtl = isHebrew
      buffer = char
      continue
    }
    if (isHebrew === bufferIsRtl) {
      buffer += char
    } else {
      flush()
      bufferIsRtl = isHebrew
      buffer = char
    }
  }
  flush()

  return runs
    .reverse()
    .map((run) => (run.rtl ? Array.from(run.text).reverse().join('') : run.text))
    .join('')
}
