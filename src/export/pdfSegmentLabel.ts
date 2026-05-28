import type { jsPDF } from 'jspdf'

/** Rotate around (centerX, centerY) — same degrees as Konva Group.rotation. */
function rotationMatrixAroundPoint(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  angleDeg: number,
) {
  const rad = (angleDeg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const rot = doc.Matrix(c, s, -s, c, 0, 0)
  const toCenter = doc.Matrix(1, 0, 0, 1, centerX, centerY)
  const fromCenter = doc.Matrix(1, 0, 0, 1, -centerX, -centerY)
  return toCenter.multiply(rot.multiply(fromCenter))
}

/**
 * Draw dim text with its visual center at (centerX, centerY).
 *
 * `angleDeg` is the same Konva / screen rotation (clockwise, y-down). Pass it
 * through unchanged — do not negate positives or ±90° labels render horizontal
 * in jsPDF advanced mode. Matrix rotation keeps the anchor centered.
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
  doc.advancedAPI(() => {
    doc.text(text, centerX, centerY, {
      align: 'center',
      baseline: 'middle',
      angle: rotationMatrixAroundPoint(doc, centerX, centerY, angleDeg),
    })
  })
}
