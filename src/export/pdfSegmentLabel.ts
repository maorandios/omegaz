import type { jsPDF } from 'jspdf'

/** Draw dim text with its visual center at (centerX, centerY). */
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
    angle: angleDeg,
  })
}
