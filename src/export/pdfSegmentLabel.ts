import type { jsPDF } from 'jspdf'

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
): void {
  doc.setFontSize(fontSizePt)
  doc.text(text, centerX, centerY, {
    align: 'center',
    baseline: 'middle',
    angle: -angleDeg,
  })
}
