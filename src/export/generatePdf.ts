import { jsPDF } from 'jspdf'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import {
  computeLabelCentroid,
  computeProfileDrawingLabels,
  labelStyleForPdfDrawing,
} from '@/geometry/profileDrawingLabels'
import { normalizeFabrication, type FoldedProfile, type Point2D, type Segment } from '@/geometry/types'
import { buildPlateInfoFields } from '@/export/plateInfoFields'
import { drawPdfSegmentDimLabel } from '@/export/pdfSegmentLabel'
import type { PdfExportOptions } from '@/export/pdfExportTypes'
import { loadPdfLogo } from '@/export/pdfLogo'
import { NAME_SERIAL_SEPARATOR } from '@/lib/format'
import type { ProfileMetrics } from '@/lib/profileMetrics'

const MARGIN = 14
const TITLE_SECTION_H = 15
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
/** Extra space between the branded headline and the disclaimer body. */
const FOOTER_HEADLINE_GAP = 1.6
const FOOTER_LOGO_SIZE = 4.6 / 1.25
const FOOTER_LOGO_GAP_BEFORE = 1
const FOOTER_LOGO_GAP_AFTER = 0.3
const SECTION_STROKE = 0.25
const PROFILE_STROKE = 0.5 * 1.25
const PDF_DIM_FONT = 10 * 1.25
const PDF_DEG_FONT = 11 * 1.25

const PDF_FOOTER_BRAND_PREFIX = 'Generated via'
const PDF_FOOTER_BRAND_SUFFIX = 'Segments — www.getsegments.co'
const PDF_FOOTER_HEADLINE_FALLBACK = `${PDF_FOOTER_BRAND_PREFIX} ${PDF_FOOTER_BRAND_SUFFIX}`
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

const TITLE_PROJECT_FRACTION = 0.5
const TITLE_PLATE_NAME_FRACTION = 0.25
/** Slightly larger middle dot in PDF title values (mm text is small). */
const TITLE_SEP_FONT_SIZE = CELL_VALUE_SIZE + 2.5

function pdfTextWidthMm(doc: jsPDF, text: string, fontSizePt: number): number {
  doc.setFontSize(fontSizePt)
  const sf = doc.internal.scaleFactor
  return (doc.getStringUnitWidth(text) * fontSizePt) / sf
}

function drawTitleValueCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  name: string | undefined,
  serial: string | undefined,
): void {
  doc.setFontSize(CELL_LABEL_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(label, x + CELL_PAD_X, y + CELL_PAD_TOP)

  const valueY = y + CELL_VALUE_Y
  const padX = x + CELL_PAD_X
  const displayName = name?.trim()
  const displaySerial = serial?.trim()

  doc.setFontSize(CELL_VALUE_SIZE)

  if (!displayName && !displaySerial) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0)
    doc.text('—', padX, valueY)
    return
  }

  if (!displaySerial) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0)
    doc.text(
      doc.splitTextToSize(displayName!, w - CELL_PAD_X * 2),
      padX,
      valueY,
    )
    doc.setTextColor(0)
    return
  }

  if (!displayName) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0)
    doc.text(displaySerial, padX, valueY)
    return
  }

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0)
  doc.text(displayName, padX, valueY)

  const nameW = pdfTextWidthMm(doc, displayName, CELL_VALUE_SIZE)
  const sepX = padX + nameW

  doc.setFontSize(TITLE_SEP_FONT_SIZE)
  doc.setFont('helvetica', 'normal')
  const sepW = pdfTextWidthMm(doc, NAME_SERIAL_SEPARATOR, TITLE_SEP_FONT_SIZE)
  doc.text(NAME_SERIAL_SEPARATOR, sepX, valueY - 0.15)

  doc.setFontSize(CELL_VALUE_SIZE)
  doc.text(displaySerial, sepX + sepW, valueY)
  doc.setTextColor(0)
}

function drawTitleBar(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  profile: FoldedProfile,
  options?: PdfExportOptions,
): void {
  const projectColW = w * TITLE_PROJECT_FRACTION
  const plateNameColW = w * TITLE_PLATE_NAME_FRACTION
  const plateNumberColW = w - projectColW - plateNameColW

  const plateNameX = x + projectColW
  const plateNumberX = plateNameX + plateNameColW

  doc.setLineWidth(SECTION_STROKE)
  doc.setDrawColor(0)
  doc.line(plateNameX, y, plateNameX, y + TITLE_SECTION_H)
  doc.line(plateNumberX, y, plateNumberX, y + TITLE_SECTION_H)

  const fab = normalizeFabrication(profile.fabrication)
  const plateName = options?.plateName ?? fab.partName ?? profile.name

  drawTitleValueCell(
    doc,
    x,
    y,
    projectColW,
    'Project name',
    options?.projectName,
    options?.projectSerial,
  )
  drawTitleValueCell(
    doc,
    plateNameX,
    y,
    plateNameColW,
    'Plate name',
    plateName,
    undefined,
  )
  drawTitleValueCell(
    doc,
    plateNumberX,
    y,
    plateNumberColW,
    'Plate number',
    options?.plateSerial,
    undefined,
  )
}

function buildPlateInfoColumns(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  options?: PdfExportOptions,
): [DataCell[], DataCell[], DataCell[]] {
  const fields = buildPlateInfoFields(profile, metrics, options).map((f) => ({
    label: f.label,
    value: String(f.value),
  }))
  return [fields.slice(0, 5), fields.slice(5, 10), fields.slice(10, 15)]
}

/** Renders one A4 plate drawing page onto an existing jsPDF document. */
export async function appendPlateDrawingPage(
  doc: jsPDF,
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  options?: PdfExportOptions,
): Promise<void> {
  const logoDataUrl = await loadPdfLogo()

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - MARGIN * 2
  const fab = normalizeFabrication(profile.fabrication)

  const titleY = MARGIN
  drawSectionRect(doc, MARGIN, titleY, contentW, TITLE_SECTION_H)
  doc.setTextColor(0)
  drawTitleBar(doc, MARGIN, titleY, contentW, profile, options)

  doc.setFontSize(FOOTER_FONT_SIZE)
  const footerCenterX = MARGIN + contentW / 2
  const footerWrapW = contentW - 10
  const bodyLines = doc.splitTextToSize(PDF_FOOTER_BODY, footerWrapW)
  const footerLineCount = 1 + bodyLines.length
  const footerTextH =
    footerLineCount * FOOTER_LINE_H + FOOTER_HEADLINE_GAP
  const footerH = footerTextH + FOOTER_PAD * 2
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
  let footerTextY = footerY + (footerH - footerTextH) / 2 + FOOTER_LINE_H / 2

  drawFooterHeadline(doc, footerCenterX, footerTextY, logoDataUrl)
  footerTextY += FOOTER_LINE_H + FOOTER_HEADLINE_GAP

  doc.setFont('helvetica', 'normal')
  bodyLines.forEach((line: string) => {
    doc.text(line, footerCenterX, footerTextY, { align: 'center', baseline: 'middle' })
    footerTextY += FOOTER_LINE_H
  })
  doc.setTextColor(0)
}

function drawFooterHeadline(
  doc: jsPDF,
  centerX: number,
  baselineY: number,
  logoDataUrl: string | null,
): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FOOTER_FONT_SIZE)

  if (!logoDataUrl) {
    doc.text(PDF_FOOTER_HEADLINE_FALLBACK, centerX, baselineY, {
      align: 'center',
      baseline: 'middle',
    })
    return
  }

  const prefixText = `${PDF_FOOTER_BRAND_PREFIX} `
  const suffixText = ` ${PDF_FOOTER_BRAND_SUFFIX}`
  const prefixW = pdfTextWidthMm(doc, prefixText, FOOTER_FONT_SIZE)
  const suffixW = pdfTextWidthMm(doc, suffixText, FOOTER_FONT_SIZE)
  const logoW = FOOTER_LOGO_SIZE
  const totalW =
    prefixW + FOOTER_LOGO_GAP_BEFORE + logoW + FOOTER_LOGO_GAP_AFTER + suffixW
  const startX = centerX - totalW / 2

  doc.text(prefixText, startX, baselineY, { baseline: 'middle' })

  const logoX = startX + prefixW + FOOTER_LOGO_GAP_BEFORE
  const logoY = baselineY - FOOTER_LOGO_SIZE / 2
  doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, FOOTER_LOGO_SIZE)

  doc.text(suffixText, logoX + logoW + FOOTER_LOGO_GAP_AFTER, baselineY, {
    baseline: 'middle',
  })
}

export async function generatePdf(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  options?: PdfExportOptions,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await appendPlateDrawingPage(doc, profile, metrics, options)
  return doc.output('blob')
}
