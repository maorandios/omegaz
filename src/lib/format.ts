import { getBendInteriorAngle } from '@/geometry/calculateProfilePoints'
import type { Bend } from '@/geometry/types'

const enNumber = new Intl.NumberFormat('en-US')

/** Thousand separators; optional fixed decimal places. */
export function formatNumber(value: number, decimals?: number): string {
  if (!Number.isFinite(value)) return '—'
  if (decimals !== undefined) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }
  const rounded = Math.round(value)
  const isInt = Math.abs(value - rounded) < 1e-9
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: isInt ? 0 : 2,
  }).format(value)
}

/** Whole numbers with thousand separators (quantities, counts). */
export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return enNumber.format(Math.round(value))
}

export function formatMm(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNumber(value, decimals)} mm`
}

/** Numeric mm value only (unit belongs in the label). */
export function formatMmValue(value: number, decimals = 1): string {
  return formatNumber(value, decimals)
}

export function formatWeightParts(kg: number): { value: string; unit: 'g' | 'kg' } {
  if (!Number.isFinite(kg) || kg <= 0) return { value: '—', unit: 'g' }
  if (kg < 1) return { value: formatInteger(kg * 1000), unit: 'g' }
  return { value: formatNumber(kg, 2), unit: 'kg' }
}

export function formatDeg(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatInteger(Math.round(value))}°`
}


/** Display fabricator interior angle (only what the user entered / template default). */
export function formatInteriorBendDeg(bend: Bend | number): string {
  const v = typeof bend === 'number' ? bend : getBendInteriorAngle(bend)
  if (!Number.isFinite(v)) return '—'
  return Number.isInteger(v) ? `${formatInteger(v)}°` : `${formatNumber(v, 1)}°`
}

export function formatKg(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—'
  if (value < 1) return `${formatInteger(value * 1000)} g`
  return `${formatNumber(value, 2)} kg`
}

export function formatAreaM2(mm2: number): string {
  if (!Number.isFinite(mm2) || mm2 <= 0) return '—'
  const m2 = mm2 / 1_000_000
  return `${formatNumber(m2, 4)} m²`
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'custom-profile'
  )
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Middle dot between name and serial (matches project/plate list UI). */
export const NAME_SERIAL_SEPARATOR = ' · '

/** Join display name and serial with a dot; order matches list rows when serialFirst. */
export function formatNameWithSerial(
  name: string | undefined,
  serial: string | undefined,
  serialFirst = false,
): string {
  const label = name?.trim()
  const code = serial?.trim()
  if (label && code) {
    return serialFirst
      ? `${code}${NAME_SERIAL_SEPARATOR}${label}`
      : `${label}${NAME_SERIAL_SEPARATOR}${code}`
  }
  if (label) return label
  if (code) return code
  return '—'
}

/** Display date for PDF title blocks: DD/MM/YYYY */
export function formatPdfDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/** Smaller display size for dense metric cards when the formatted string is long. */
export function metricCardValueClass(formatted: string): string {
  const len = formatted.length
  if (len > 14) return 'text-[0.65rem] leading-tight'
  if (len > 11) return 'text-xs leading-tight'
  if (len > 8) return 'text-sm leading-tight'
  if (len > 6) return 'text-lg leading-none'
  return 'text-[1.75rem] leading-none'
}
