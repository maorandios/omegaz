import { jsPDF } from 'jspdf'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import {
  computeLabelCentroid,
  computeProfileDrawingLabels,
  estimateLabelTextBox,
  labelStyleForPdfDrawing,
} from '@/geometry/profileDrawingLabels'
import { normalizeFabrication, type FoldedProfile, type Point2D, type Segment } from '@/geometry/types'
import { buildPlateInfoFields } from '@/export/plateInfoFields'
import { drawPdfSegmentDimLabel } from '@/export/pdfSegmentLabel'
import type { PdfExportOptions } from '@/export/pdfExportTypes'
import { loadPdfLogo } from '@/export/pdfLogo'
import {
  ensurePdfFonts,
  fontFamilyForText,
  isRtlText,
  PDF_FONT_FALLBACK,
  PDF_FONT_LATIN,
  toVisualOrder,
  type FontContext,
} from '@/export/pdfFonts'
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

/** UI/label font (always Latin; falls back to helvetica before fonts load). */
function setLabelFont(
  doc: jsPDF,
  ctx: FontContext,
  weight: 'normal' | 'bold' = 'normal',
): void {
  doc.setFont(ctx.unicodeReady ? PDF_FONT_LATIN : PDF_FONT_FALLBACK, weight)
}

/** Picks the right registered font for a user-entered value (Hebrew vs Latin). */
function setValueFont(
  doc: jsPDF,
  ctx: FontContext,
  text: string,
  weight: 'normal' | 'bold' = 'normal',
): void {
  doc.setFont(fontFamilyForText(text, ctx), weight)
}

/**
 * Renders user-entered text, swapping in the Hebrew font for RTL strings and
 * applying a manual visual-order pass since jsPDF 4.x doesn't do bidi.
 */
function drawValueText(
  doc: jsPDF,
  ctx: FontContext,
  text: string,
  x: number,
  y: number,
  options: Parameters<jsPDF['text']>[3] = {},
): void {
  setValueFont(doc, ctx, text, 'normal')
  const display = ctx.unicodeReady && isRtlText(text) ? toVisualOrder(text) : text
  doc.text(display, x, y, options)
}

/** Same as drawValueText but for an array of pre-split lines. */
function drawValueLines(
  doc: jsPDF,
  ctx: FontContext,
  text: string,
  lines: string[],
  x: number,
  y: number,
  options: Parameters<jsPDF['text']>[3] = {},
): void {
  setValueFont(doc, ctx, text, 'normal')
  const display =
    ctx.unicodeReady && isRtlText(text)
      ? lines.map((line) => toVisualOrder(line))
      : lines
  doc.text(display, x, y, options)
}

function clampToClip(
  x: number,
  y: number,
  text: string,
  fontSizePt: number,
  clip: ClipRect,
  rotationDeg = 0,
): Point2D {
  const fontMm = fontSizePt * (25.4 / 72)
  const { width, height } = estimateLabelTextBox(text, fontMm)
  const halfW = width / 2
  const halfH = height / 2
  const rad = (rotationDeg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const aabbHalfW = halfW * cos + halfH * sin + 0.5
  const aabbHalfH = halfW * sin + halfH * cos + 0.5

  return {
    x: Math.min(Math.max(x, clip.left + aabbHalfW), clip.right - aabbHalfW),
    y: Math.min(Math.max(y, clip.top + aabbHalfH), clip.bottom - aabbHalfH),
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
  ctx: FontContext,
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

  setLabelFont(doc, ctx, 'normal')
  doc.setTextColor(0)

  segmentLabels.forEach((lbl) => {
    const p = clampToClip(lbl.x, lbl.y, lbl.text, PDF_DIM_FONT, clip, lbl.rotationDeg)
    drawPdfSegmentDimLabel(
      doc,
      lbl.text,
      p.x,
      p.y,
      PDF_DIM_FONT,
      lbl.rotationDeg,
      lbl.normalX,
      lbl.normalY,
    )
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
  ctx: FontContext,
  x: number,
  y: number,
  w: number,
  cell: DataCell,
): void {
  doc.setFontSize(CELL_LABEL_SIZE)
  setLabelFont(doc, ctx, 'bold')
  doc.setTextColor(0)
  doc.text(cell.label, x + CELL_PAD_X, y + CELL_PAD_TOP)
  setValueFont(doc, ctx, cell.value, 'normal')
  doc.setFontSize(CELL_VALUE_SIZE)
  // splitTextToSize must measure with the value font so Hebrew widths are right.
  const valueLines = doc.splitTextToSize(cell.value, w - CELL_PAD_X * 2)
  drawValueLines(doc, ctx, cell.value, valueLines, x + CELL_PAD_X, y + CELL_VALUE_Y)
}

function drawThreeColumnGrid(
  doc: jsPDF,
  ctx: FontContext,
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
      drawDataCell(doc, ctx, x + col * colW, y + row * DATA_ROW_H, colW, cell)
    })
  })

  return gridH
}

function drawNotesStripe(
  doc: jsPDF,
  ctx: FontContext,
  x: number,
  y: number,
  w: number,
  notes: string,
): number {
  doc.line(x, y, x + w, y)
  const labelY = y + CELL_PAD_TOP
  doc.setFontSize(CELL_LABEL_SIZE)
  setLabelFont(doc, ctx, 'bold')
  doc.text('Notes', x + CELL_PAD_X, labelY)
  const body = notes.trim() ? notes.trim() : 'None'
  setValueFont(doc, ctx, body, 'normal')
  doc.setFontSize(CELL_VALUE_SIZE)
  const lines = doc.splitTextToSize(body, w - CELL_PAD_X * 2)
  const lineH = 4
  drawValueLines(doc, ctx, body, lines, x + CELL_PAD_X, y + CELL_VALUE_Y)
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
/** Floor for title auto-shrink so values never become unreadable. */
const TITLE_VALUE_MIN_FONT = CELL_VALUE_SIZE * 0.65

function pdfTextWidthMm(doc: jsPDF, text: string, fontSizePt: number): number {
  doc.setFontSize(fontSizePt)
  const sf = doc.internal.scaleFactor
  return (doc.getStringUnitWidth(text) * fontSizePt) / sf
}

/**
 * Returns the largest font size <= base that lets `text` (or `text` + sep + serial)
 * fit on a single line inside `maxWidth`. Falls back to `min` if even that overflows.
 */
function fitTitleFontSize(
  doc: jsPDF,
  name: string,
  serial: string | undefined,
  maxWidth: number,
  base: number,
  min: number,
): number {
  const measure = (size: number) => {
    let w = pdfTextWidthMm(doc, name, size)
    if (serial) {
      const sepSize = size + (TITLE_SEP_FONT_SIZE - CELL_VALUE_SIZE)
      w += pdfTextWidthMm(doc, NAME_SERIAL_SEPARATOR, sepSize)
      w += pdfTextWidthMm(doc, serial, size)
    }
    return w
  }

  if (measure(base) <= maxWidth) return base

  let lo = min
  let hi = base
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2
    if (measure(mid) <= maxWidth) lo = mid
    else hi = mid
  }
  return Math.max(min, lo)
}

function drawTitleValueCell(
  doc: jsPDF,
  ctx: FontContext,
  x: number,
  y: number,
  w: number,
  label: string,
  name: string | undefined,
  serial: string | undefined,
): void {
  doc.setFontSize(CELL_LABEL_SIZE)
  setLabelFont(doc, ctx, 'bold')
  doc.setTextColor(0)
  doc.text(label, x + CELL_PAD_X, y + CELL_PAD_TOP)

  const valueY = y + CELL_VALUE_Y
  const padX = x + CELL_PAD_X
  const innerW = w - CELL_PAD_X * 2
  const displayName = name?.trim()
  const displaySerial = serial?.trim()

  doc.setTextColor(0)

  if (!displayName && !displaySerial) {
    setLabelFont(doc, ctx, 'normal')
    doc.setFontSize(CELL_VALUE_SIZE)
    doc.text('—', padX, valueY)
    return
  }

  if (!displaySerial) {
    setValueFont(doc, ctx, displayName!, 'normal')
    const valueSize = fitTitleFontSize(
      doc,
      displayName!,
      undefined,
      innerW,
      CELL_VALUE_SIZE,
      TITLE_VALUE_MIN_FONT,
    )
    doc.setFontSize(valueSize)
    drawValueText(doc, ctx, displayName!, padX, valueY)
    return
  }

  if (!displayName) {
    setValueFont(doc, ctx, displaySerial, 'normal')
    const valueSize = fitTitleFontSize(
      doc,
      displaySerial,
      undefined,
      innerW,
      CELL_VALUE_SIZE,
      TITLE_VALUE_MIN_FONT,
    )
    doc.setFontSize(valueSize)
    drawValueText(doc, ctx, displaySerial, padX, valueY)
    return
  }

  setValueFont(doc, ctx, displayName, 'normal')
  const valueSize = fitTitleFontSize(
    doc,
    displayName,
    displaySerial,
    innerW,
    CELL_VALUE_SIZE,
    TITLE_VALUE_MIN_FONT,
  )
  const sepSize = valueSize + (TITLE_SEP_FONT_SIZE - CELL_VALUE_SIZE)

  doc.setFontSize(valueSize)
  drawValueText(doc, ctx, displayName, padX, valueY)

  const nameW = pdfTextWidthMm(doc, displayName, valueSize)
  const sepX = padX + nameW

  setLabelFont(doc, ctx, 'normal')
  doc.setFontSize(sepSize)
  const sepW = pdfTextWidthMm(doc, NAME_SERIAL_SEPARATOR, sepSize)
  doc.text(NAME_SERIAL_SEPARATOR, sepX, valueY - 0.15)

  setValueFont(doc, ctx, displaySerial, 'normal')
  doc.setFontSize(valueSize)
  drawValueText(doc, ctx, displaySerial, sepX + sepW, valueY)
}

function drawTitleBar(
  doc: jsPDF,
  ctx: FontContext,
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
    ctx,
    x,
    y,
    projectColW,
    'Project name',
    options?.projectName,
    options?.projectSerial,
  )
  drawTitleValueCell(
    doc,
    ctx,
    plateNameX,
    y,
    plateNameColW,
    'Plate name',
    plateName,
    undefined,
  )
  drawTitleValueCell(
    doc,
    ctx,
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
  const [logoDataUrl, unicodeReady] = await Promise.all([
    loadPdfLogo(),
    ensurePdfFonts(doc),
  ])
  const ctx: FontContext = { unicodeReady }

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - MARGIN * 2
  const fab = normalizeFabrication(profile.fabrication)

  const titleY = MARGIN
  drawSectionRect(doc, MARGIN, titleY, contentW, TITLE_SECTION_H)
  doc.setTextColor(0)
  drawTitleBar(doc, ctx, MARGIN, titleY, contentW, profile, options)

  setLabelFont(doc, ctx, 'normal')
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
  const notesBody = fab.notes.trim() ? fab.notes.trim() : 'None'
  // Use the value font so notes width is measured against the right glyphs
  // (Hebrew is narrower than helvetica's stand-ins, so this prevents
  // over-wrapping when the notes are in Hebrew).
  setValueFont(doc, ctx, notesBody, 'normal')
  doc.setFontSize(CELL_VALUE_SIZE)
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
  drawProfileGeometry(doc, ctx, profile, tx, labelStyle, clip)

  drawSectionRect(doc, MARGIN, dataSectionY, contentW, dataSectionH)
  drawThreeColumnGrid(doc, ctx, MARGIN, dataSectionY, contentW, columns)
  drawNotesStripe(doc, ctx, MARGIN, dataSectionY + gridH, contentW, fab.notes)

  setLabelFont(doc, ctx, 'normal')
  doc.setFontSize(FOOTER_FONT_SIZE)
  doc.setTextColor(80)
  let footerTextY = footerY + (footerH - footerTextH) / 2 + FOOTER_LINE_H / 2

  drawFooterHeadline(doc, ctx, footerCenterX, footerTextY, logoDataUrl)
  footerTextY += FOOTER_LINE_H + FOOTER_HEADLINE_GAP

  setLabelFont(doc, ctx, 'normal')
  bodyLines.forEach((line: string) => {
    doc.text(line, footerCenterX, footerTextY, { align: 'center', baseline: 'middle' })
    footerTextY += FOOTER_LINE_H
  })
  doc.setTextColor(0)
}

function drawFooterHeadline(
  doc: jsPDF,
  ctx: FontContext,
  centerX: number,
  baselineY: number,
  logoDataUrl: string | null,
): void {
  setLabelFont(doc, ctx, 'bold')
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
