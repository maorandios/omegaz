import type { jsPDF } from 'jspdf'
import { estimateLabelTextBox } from '@/geometry/profileDrawingLabels'

const PT_TO_MM = 25.4 / 72

/**
 * jsPDF rotates dim text around the anchor but shifts ~90° labels by half the
 * string width along the segment tangent (right-hand verticals with +90° screen
 * rotation end up on top of the stroke). Re-center before drawing.
 */
function pdfSegmentLabelAnchor(
  centerX: number,
  centerY: number,
  text: string,
  fontSizePt: number,
  angleDeg: number,
  normalX: number,
  normalY: number,
): { x: number; y: number } {
  const fontMm = fontSizePt * PT_TO_MM
  const halfAlongText = estimateLabelTextBox(text, fontMm).width / 2

  // Near-vertical dims: jsPDF rotation shifts the visual center ~half the string
  // width against the exterior normal on X.
  if (Math.abs(Math.abs(angleDeg) - 90) < 0.5 && Math.abs(normalX) > 0.5) {
    return {
      x: centerX + halfAlongText * Math.sign(normalX),
      y: centerY,
    }
  }

  if (Math.abs(Math.abs(angleDeg) - 90) < 0.5 && Math.abs(normalY) > 0.5) {
    return {
      x: centerX,
      y: centerY + halfAlongText * Math.sign(normalY),
    }
  }

  return { x: centerX, y: centerY }
}

/**
 * Draw dim text with its visual center at (centerX, centerY).
 *
 * `angleDeg` follows the Konva / screen convention (positive = clockwise in a
 * y-down coordinate system). jsPDF rotates counter-clockwise for positive
 * angles, so we negate before forwarding to keep the on-screen preview and
 * the printed PDF visually identical.
 */
export function drawPdfSegmentDimLabel(
  doc: jsPDF,
  text: string,
  centerX: number,
  centerY: number,
  fontSizePt: number,
  angleDeg: number,
  normalX: number,
  normalY: number,
): void {
  doc.setFontSize(fontSizePt)
  const anchor = pdfSegmentLabelAnchor(
    centerX,
    centerY,
    text,
    fontSizePt,
    angleDeg,
    normalX,
    normalY,
  )
  doc.text(text, anchor.x, anchor.y, {
    align: 'center',
    baseline: 'middle',
    angle: -angleDeg,
  })
}
