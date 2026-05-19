import { jsPDF } from 'jspdf'
import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import {
  FLAT_WIDTH_DISCLAIMER,
  FLAT_WIDTH_LABEL,
  type FoldedProfile,
} from '@/geometry/types'
import { formatMm, todayIsoDate } from '@/lib/format'

interface ProfileMetrics {
  flatWidth: number
  bendCount: number
  bounds: { width: number; height: number }
  area: number
  weight: number
}

export function generatePdf(profile: FoldedProfile, metrics: ProfileMetrics): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const fab = profile.fabrication
  const flatWidth = calculateGeometricFlatWidth(profile.segments)

  let y = 18
  doc.setFontSize(18)
  doc.text(fab.partName || profile.name, 14, y)
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(`Date: ${todayIsoDate()}`, 14, y)
  doc.setTextColor(0)
  y += 12

  const bounds = calculateProfileBounds(profile.segments)
  const drawW = pageW - 28
  const drawH = 70
  const bw = Math.max(bounds.width, 1)
  const bh = Math.max(bounds.height, 1)
  const scale = Math.min(drawW / bw, drawH / bh)
  const originX = 14 + (drawW - bw * scale) / 2 - bounds.minX * scale
  const originY = y + drawH / 2

  const tx = (p: { x: number; y: number }) => ({
    x: originX + p.x * scale,
    y: originY - p.y * scale,
  })

  doc.setDrawColor(0)
  doc.setLineWidth(0.4)
  profile.segments.forEach((seg) => {
    const s = tx(seg.startPoint)
    const e = tx(seg.endPoint)
    doc.line(s.x, s.y, e.x, e.y)
    const midX = (s.x + e.x) / 2
    const midY = (s.y + e.y) / 2
    doc.setFontSize(8)
    doc.text(`${seg.length}`, midX + 1, midY - 2)
  })

  profile.bends.forEach((bend, i) => {
    const vertex = profile.segments[i]?.endPoint
    if (!vertex) return
    const p = tx(vertex)
    doc.setFontSize(7)
    doc.text(
      `${bend.interiorAngle ?? bend.angle}°`,
      p.x + 2,
      p.y + 2,
    )
  })

  y += drawH + 10

  const lines: [string, string][] = [
    ['Material', fab.material],
    ['Thickness', formatMm(fab.thickness)],
    ['Part Length', formatMm(fab.partLength)],
    ['Quantity', String(fab.quantity)],
    ['Hem', fab.hem ? 'Yes' : 'No'],
    ['Finish', fab.finish],
    ['Notes', fab.notes || '—'],
    [FLAT_WIDTH_LABEL, formatMm(flatWidth)],
    ['Bend Count', String(metrics.bendCount)],
    ['Profile Width', formatMm(metrics.bounds.width)],
    ['Profile Height', formatMm(metrics.bounds.height)],
  ]

  doc.setFontSize(10)
  lines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 70, y)
    y += 6
  })

  y += 4
  doc.setFontSize(8)
  doc.setTextColor(100)
  const disclaimer = doc.splitTextToSize(FLAT_WIDTH_DISCLAIMER, pageW - 28)
  doc.text(disclaimer, 14, y)

  return doc.output('blob')
}
