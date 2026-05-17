export function formatMm(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(decimals)} mm`
}

export function formatDeg(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${Math.round(value)}°`
}

export function formatKg(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—'
  if (value < 1) return `${(value * 1000).toFixed(0)} g`
  return `${value.toFixed(2)} kg`
}

export function formatAreaM2(mm2: number): string {
  if (!Number.isFinite(mm2) || mm2 <= 0) return '—'
  const m2 = mm2 / 1_000_000
  return `${m2.toFixed(4)} m²`
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
