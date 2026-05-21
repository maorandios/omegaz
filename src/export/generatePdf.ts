import { jsPDF } from 'jspdf'
import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import {
  computeLabelCentroid,
  computeProfileDrawingLabels,
  labelStyleForPdfDrawing,
} from '@/geometry/profileDrawingLabels'
import { getFabricationMaterialLabel } from '@/geometry/constants'
import type { FoldedProfile, Point2D, Segment } from '@/geometry/types'
import { drawPdfSegmentDimLabel } from '@/export/pdfSegmentLabel'
import type { PdfExportOptions } from '@/export/pdfExportTypes'
import type { ProfileMetrics } from '@/lib/profileMetrics'
import { formatInteger, formatMmValue, formatNumber, formatPdfDate } from '@/lib/format'

const MARGIN = 14
const TITLE_SECTION_H = 16
const DRAWING_PAD = 8
const LABEL_RESERVE = 11
const DATA_ROW_H = 15
const DATA_COLS = 3
const DATA_GRID_ROWS = 5
const NOTES_STRIPE_MIN_H = 14 * 1.25
const CELL_PAD_X = 4
const CELL_PAD_TOP = 5.5
const CELL_LABEL_VALUE_GAP = 2
const CELL_LABEL_SIZE = 8 * 1.25
const CELL_VALUE_SIZE = 9 * 1.25
const CELL_VALUE_Y =
  CELL_PAD_TOP + CELL_LABEL_SIZE * 0.38 + CELL_LABEL_VALUE_GAP
const FOOTER_FONT_SIZE = 6.5 * 1.25
const FOOTER_PAD = 4
const FOOTER_LINE_H = 3.6
const SECTION_STROKE = 0.25
const PROFILE_STROKE = 0.5 * 1.25
const PDF_DIM_FONT = 10 * 1.25
const PDF_DEG_FONT = 11 * 1.25

const PDF_FOOTER_HEADLINE = 'Generated via Segments App (www.segments.pro)'
const PDF_FOOTER_BODY =
  'All dimensions are nominal outside dimensions. Fabricator: Please apply your shop\'s specific bend deductions, thickness allowances, and tooling configurations before production. The user assumes responsibility for final fitment verification.'

interface ClipRect {
  left: number
  top: number
  right: number
  bottom: number
}

interface DataCell {
  label: string
  value: string
}

function drawSectionRect(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  doc.setDrawColor(0)
  doc.setLineWidth(SECTION_STROKE)
  doc.rect(x, y, w, h)
}

function clampToClip(
  x: number,
  y: number,
  text: string,
  fontSizePt: number,
  clip: ClipRect,
  rotationDeg = 0,
): Point2D {
  const rad = (rotationDeg * Math.PI) / 180
  const halfW =
    (Math.abs(Math.cos(rad)) * text.length + Math.abs(Math.sin(rad)) * 1.2) *
      fontSizePt *
      0.16 +
    1
  const halfH =
    Math.abs(Math.cos(rad)) * 1.2 * fontSizePt * 0.16 +
    Math.abs(Math.sin(rad)) * text.length * fontSizePt * 0.08 +
    1

  return {
    x: Math.min(Math.max(x, clip.left + halfW), clip.right - halfW),
    y: Math.min(Math.max(y, clip.top + halfH), clip.bottom - halfH),
  }
}

function createProfileTransform(
  segments: Segment[],
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  padding: number,
  labelReserve: number,
): {
  tx: (p: Point2D) => Point2D
  scale: number
} {
  const bounds = calculateProfileBounds(segments)
  const innerW = boxW - padding * 2 - labelReserve * 2
  const innerH = boxH - padding * 2 - labelReserve * 2
  const bw = Math.max(bounds.width, 1)
  const bh = Math.max(bounds.height, 1)
  const scale = Math.min(innerW / bw, innerH / bh)
  const offsetX =
    boxX + padding + labelReserve + (innerW - bw * scale) / 2 - bounds.minX * scale
  const offsetY =
    boxY + padding + labelReserve + (innerH - bh * scale) / 2 - bounds.minY * scale

  return {
    tx: (p: Point2D) => ({
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale,
    }),
    scale,
  }
}

function drawProfileGeometry(
  doc: jsPDF,
  profile: FoldedProfile,
  tx: (p: Point2D) => Point2D,
  labelStyle: ReturnType<typeof labelStyleForPdfDrawing>,
  clip: ClipRect,
): void {
  const centroid = computeLabelCentroid(profile.segments, tx, {
    x: (clip.left + clip.right) / 2,
    y: (clip.top + clip.bottom) / 2,
  })
  const { segmentLabels, bendLabels } = computeProfileDrawingLabels(
    profile,
    tx,
    centroid,
    labelStyle,
  )

  doc.setDrawColor(0)
  doc.setLineWidth(PROFILE_STROKE)

  profile.segments.forEach((seg) => {
    const s = tx(seg.startPoint)
    const e = tx(seg.endPoint)
    doc.line(s.x, s.y, e.x, e.y)
  })

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0)

  segmentLabels.forEach((lbl) => {
    drawPdfSegmentDimLabel(doc, lbl.text, lbl.x, lbl.y, PDF_DIM_FONT, lbl.rotationDeg)
  })

  bendLabels.forEach((lbl) => {
    const p = clampToClip(lbl.x, lbl.y, lbl.text, PDF_DEG_FONT, clip)
    doc.setFontSize(PDF_DEG_FONT)
    doc.text(lbl.text, p.x, p.y, {
      align: 'center',
      baseline: 'middle',
    })
  })
}

function drawDataCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  cell: DataCell,
): void {
  doc.setFontSize(CELL_LABEL_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(cell.label, x + CELL_PAD_X, y + CELL_PAD_TOP)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(CELL_VALUE_SIZE)
  const valueLines = doc.splitTextToSize(cell.value, w - CELL_PAD_X * 2)
  doc.text(valueLines, x + CELL_PAD_X, y + CELL_VALUE_Y)
}

function drawThreeColumnGrid(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  columns: [DataCell[], DataCell[], DataCell[]],
): number {
  const colW = w / DATA_COLS
  const rowCount = DATA_GRID_ROWS
  const gridH = rowCount * DATA_ROW_H

  doc.setLineWidth(SECTION_STROKE)
  doc.setDrawColor(0)

  for (let row = 1; row < rowCount; row++) {
    const lineY = y + row * DATA_ROW_H
    doc.line(x, lineY, x + w, lineY)
  }
  for (let col = 1; col < DATA_COLS; col++) {
    const lineX = x + col * colW
    doc.line(lineX, y, lineX, y + gridH)
  }

  columns.forEach((cells, col) => {
    cells.forEach((cell, row) => {
      drawDataCell(doc, x + col * colW, y + row * DATA_ROW_H, colW, cell)
    })
  })

  return gridH
}

function drawNotesStripe(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  notes: string,
): number {
  doc.line(x, y, x + w, y)
  const labelY = y + CELL_PAD_TOP
  doc.setFontSize(CELL_LABEL_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.text('Notes', x + CELL_PAD_X, labelY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(CELL_VALUE_SIZE)
  const body = notes.trim() ? notes.trim() : 'None'
  const lines = doc.splitTextToSize(body, w - CELL_PAD_X * 2)
  const lineH = 4
  doc.text(lines, x + CELL_PAD_X, y + CELL_VALUE_Y)
  const stripeH = Math.max(
    NOTES_STRIPE_MIN_H,
    CELL_VALUE_Y + lines.length * lineH + CELL_PAD_TOP,
  )
  return stripeH
}

function buildPlateInfoColumns(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  options?: PdfExportOptions,
): [DataCell[], DataCell[], DataCell[]] {
  const fab = profile.fabrication
  const flatWidth = calculateGeometricFlatWidth(profile.segments)
  const qty = Math.max(0, fab.quantity)
  const weightPerUnit = metrics.weight
  const totalWeight = weightPerUnit * qty
  const sqmPerUnit = metrics.area / 1_000_000
  const totalSqm = sqmPerUnit * qty
  const client =
    options?.clientName?.trim() ||
    '—'

  const left: DataCell[] = [
    { label: 'Material', value: getFabricationMaterialLabel(fab.material, fab.materialCustom) },
    { label: 'Grade', value: '—' },
    { label: 'Thickness', value: `${formatMmValue(fab.thickness)} mm` },
    { label: 'Quantity', value: formatInteger(qty) },
    { label: 'Finish', value: fab.finish || '—' },
  ]

  const center: DataCell[] = [
    { label: 'Est. flat width (mm)', value: `${formatMmValue(flatWidth)} mm` },
    { label: 'Est. weight per unit (kg)', value: `${formatNumber(weightPerUnit, 2)} kg` },
    { label: 'Est. sqm per unit (m²)', value: `${formatNumber(sqmPerUnit, 3)} m²` },
    { label: 'Est. total weight (kg)', value: `${formatNumber(totalWeight, 2)} kg` },
    { label: 'Est. total sqm (m²)', value: `${formatNumber(totalSqm, 3)} m²` },
  ]

  const right: DataCell[] = [
    { label: 'Client name', value: client },
    { label: 'Date', value: formatPdfDate() },
    { label: 'Hem', value: fab.hem ? 'Yes' : 'No' },
    { label: 'Checker Plate', value: fab.checkerPlate ? 'Yes' : 'No' },
    { label: 'Bend counts', value: formatInteger(metrics.bendCount) },
  ]

  return [left, center, right]
}

export function generatePdf(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  options?: PdfExportOptions,
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - MARGIN * 2
  const fab = profile.fabrication

  const titleY = MARGIN
  drawSectionRect(doc, MARGIN, titleY, contentW, TITLE_SECTION_H)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(0)
  doc.text(fab.partName || profile.name, MARGIN + 5, titleY + 11)

  doc.setFontSize(FOOTER_FONT_SIZE)
  const footerCenterX = MARGIN + contentW / 2
  const footerWrapW = contentW - 10
  const headlineLines = doc.splitTextToSize(PDF_FOOTER_HEADLINE, footerWrapW)
  const bodyLines = doc.splitTextToSize(PDF_FOOTER_BODY, footerWrapW)
  const footerLineCount = headlineLines.length + bodyLines.length
  const footerH = footerLineCount * FOOTER_LINE_H + FOOTER_PAD * 2
  const footerY = pageH - MARGIN - footerH

  const columns = buildPlateInfoColumns(profile, metrics, options)
  const gridH = DATA_GRID_ROWS * DATA_ROW_H
  doc.setFontSize(CELL_VALUE_SIZE)
  const notesBody = fab.notes.trim() ? fab.notes.trim() : 'None'
  const notesLines = doc.splitTextToSize(notesBody, contentW - CELL_PAD_X * 2)
  const notesStripeH = Math.max(
    NOTES_STRIPE_MIN_H,
    CELL_VALUE_Y + notesLines.length * 4 + CELL_PAD_TOP,
  )
  const dataSectionH = gridH + notesStripeH
  const dataSectionY = footerY - dataSectionH

  const drawBoxY = titleY + TITLE_SECTION_H
  const drawingSectionH = dataSectionY - drawBoxY

  drawSectionRect(doc, MARGIN, drawBoxY, contentW, drawingSectionH)

  const clip: ClipRect = {
    left: MARGIN + 1.5,
    top: drawBoxY + 1.5,
    right: MARGIN + contentW - 1.5,
    bottom: drawBoxY + drawingSectionH - 1.5,
  }

  const { tx, scale } = createProfileTransform(
    profile.segments,
    MARGIN,
    drawBoxY,
    contentW,
    drawingSectionH,
    DRAWING_PAD,
    LABEL_RESERVE,
  )
  const bounds = calculateProfileBounds(profile.segments)
  const drawSpanMm = Math.max(bounds.width * scale, bounds.height * scale, 1)
  const labelStyle = labelStyleForPdfDrawing(drawSpanMm)
  drawProfileGeometry(doc, profile, tx, labelStyle, clip)

  drawSectionRect(doc, MARGIN, dataSectionY, contentW, dataSectionH)
  drawThreeColumnGrid(doc, MARGIN, dataSectionY, contentW, columns)
  drawNotesStripe(doc, MARGIN, dataSectionY + gridH, contentW, fab.notes)

  doc.setFontSize(FOOTER_FONT_SIZE)
  doc.setTextColor(80)
  const footerTextBlockH = footerLineCount * FOOTER_LINE_H
  let footerTextY = footerY + (footerH - footerTextBlockH) / 2 + FOOTER_LINE_H / 2

  doc.setFont('helvetica', 'bold')
  headlineLines.forEach((line) => {
    doc.text(line, footerCenterX, footerTextY, { align: 'center', baseline: 'middle' })
    footerTextY += FOOTER_LINE_H
  })

  doc.setFont('helvetica', 'normal')
  bodyLines.forEach((line) => {
    doc.text(line, footerCenterX, footerTextY, { align: 'center', baseline: 'middle' })
    footerTextY += FOOTER_LINE_H
  })
  doc.setTextColor(0)

  return doc.output('blob')
}
