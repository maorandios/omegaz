import type { jsPDF } from 'jspdf'

/**
 * Draw dim text with its visual center at (centerX, centerY).
 * jsPDF rotates around the anchor; vertical text needs a Y correction.
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
  const sf = doc.internal.scaleFactor
  const textW = (doc.getStringUnitWidth(text) * fontSizePt) / sf

  const norm = ((angleDeg % 360) + 360) % 360
  const isVertical = (norm > 85 && norm < 95) || (norm > 265 && norm < 275)

  if (isVertical) {
    // Rotated 90°/270°: bbox extent along page Y ≈ text width — correct jsPDF anchor drift.
    const halfExtent = textW / 2
    const drawY = norm > 180 ? centerY - halfExtent : centerY + halfExtent
    doc.text(text, centerX, drawY, {
      align: 'center',
      baseline: 'middle',
      angle: angleDeg,
    })
    return
  }

  doc.text(text, centerX, centerY, {
    align: 'center',
    baseline: 'middle',
    angle: angleDeg,
  })
}
