import { getBendVertexPoint } from '@/geometry/calculateProfilePoints'
import { getSquareCornerPairs } from '@/geometry/squareProfile'
import type { FoldedProfile, Point2D, Segment } from '@/geometry/types'
import { formatInteriorBendDeg } from '@/lib/format'

export interface LabelStyle {
  segmentLabelOffset: number
  bendLabelOffset: number
  bendLabelCharWidth: number
  labelHalfHeight: number
  labelClearMargin: number
}

/** Matches ProfileCanvas defaults (12px base × 1.25). */
export const CANVAS_LABEL_STYLE: LabelStyle = {
  segmentLabelOffset: 26,
  bendLabelOffset: 28,
  bendLabelCharWidth: 4.4,
  labelHalfHeight: 8,
  labelClearMargin: 4,
}

/** PDF export: same layout rules with 1.25× offsets for mm drawing space. */
export const PDF_LABEL_STYLE: LabelStyle = {
  segmentLabelOffset: 26 * 1.25,
  bendLabelOffset: 28 * 1.25,
  bendLabelCharWidth: 4.4 * 1.25,
  labelHalfHeight: 8 * 1.25,
  labelClearMargin: 4 * 1.25,
}

export interface SegmentLabelLayout {
  text: string
  x: number
  y: number
  rotationDeg: number
}

export interface BendLabelLayout {
  text: string
  x: number
  y: number
  bendId?: string
  squareCornerIndex?: number
}

/** Estimated text box for center-anchored rotation (screen / mm units). */
export function estimateLabelTextBox(
  text: string,
  fontSize: number,
): { width: number; height: number } {
  return {
    width: text.length * fontSize * 0.58,
    height: fontSize * 1.2,
  }
}

/** Konva: place (x,y) at the visual center of rotated segment dim text. */
export function konvaSegmentLabelOffsets(
  text: string,
  fontSize: number,
): { offsetX: number; offsetY: number } {
  const { width, height } = estimateLabelTextBox(text, fontSize)
  return { offsetX: width / 2, offsetY: height / 2 }
}

function formatSegmentDim(n: number): string {
  const v = Math.round(n * 10) / 10
  const decimals = Number.isInteger(v) ? 0 : 1
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v)
}

function unitVec(x: number, y: number, len: number): { x: number; y: number } {
  if (len < 1e-6) return { x: 0, y: 0 }
  return { x: x / len, y: y / len }
}

/** Perpendicular unit normal on the side farther from the profile centroid (exterior). */
function outwardSegmentNormal(
  txu: number,
  tyu: number,
  midX: number,
  midY: number,
  centroid: Point2D,
): { nx: number; ny: number } {
  const n1x = -tyu
  const n1y = txu
  const n2x = tyu
  const n2y = -txu
  const d1 =
    (midX + n1x - centroid.x) ** 2 + (midY + n1y - centroid.y) ** 2
  const d2 =
    (midX + n2x - centroid.x) ** 2 + (midY + n2y - centroid.y) ** 2
  return d1 >= d2 ? { nx: n1x, ny: n1y } : { nx: n2x, ny: n2y }
}

function interiorAngleBisector(
  segIn: Segment,
  segOut: Segment,
  tx: (p: Point2D) => Point2D,
): { x: number; y: number } {
  const v = tx(segIn.endPoint)
  const a = tx(segIn.startPoint)
  const b = tx(segOut.endPoint)

  const inBack = { x: a.x - v.x, y: a.y - v.y }
  const outFwd = { x: b.x - v.x, y: b.y - v.y }

  const lenIn = Math.hypot(inBack.x, inBack.y)
  const lenOut = Math.hypot(outFwd.x, outFwd.y)
  if (lenIn < 1e-6 || lenOut < 1e-6) return { x: 0, y: -1 }

  const inBackU = unitVec(inBack.x, inBack.y, lenIn)
  const outFwdU = unitVec(outFwd.x, outFwd.y, lenOut)

  const bx = inBackU.x + outFwdU.x
  const by = inBackU.y + outFwdU.y
  const blen = Math.hypot(bx, by)
  if (blen < 1e-6) {
    return { x: -inBackU.y, y: inBackU.x }
  }
  return { x: bx / blen, y: by / blen }
}

function interiorAngleLabelPosition(
  segIn: Segment,
  segOut: Segment,
  tx: (p: Point2D) => Point2D,
  labelText: string,
  style: LabelStyle,
): { x: number; y: number } {
  const v = tx(segIn.endPoint)
  const bis = interiorAngleBisector(segIn, segOut, tx)
  const dist =
    style.bendLabelOffset + labelText.length * style.bendLabelCharWidth * 0.25
  return {
    x: v.x + bis.x * dist,
    y: v.y + bis.y * dist,
  }
}

export function computeLabelCentroid(
  segments: Segment[],
  tx: (p: Point2D) => Point2D,
  fallback: Point2D,
): Point2D {
  if (segments.length === 0) return fallback
  let sx = 0
  let sy = 0
  let n = 0
  segments.forEach((seg) => {
    const s = tx(seg.startPoint)
    const e = tx(seg.endPoint)
    sx += s.x + e.x
    sy += s.y + e.y
    n += 2
  })
  return { x: sx / n, y: sy / n }
}

export function computeProfileDrawingLabels(
  profile: FoldedProfile,
  tx: (p: Point2D) => Point2D,
  labelCentroid: Point2D,
  style: LabelStyle,
): { segmentLabels: SegmentLabelLayout[]; bendLabels: BendLabelLayout[] } {
  const { segments, bends } = profile

  const segmentLabels: SegmentLabelLayout[] = segments.map((seg) => {
    const start = tx(seg.startPoint)
    const end = tx(seg.endPoint)
    const screenDx = end.x - start.x
    const screenDy = end.y - start.y
    const segLen = Math.hypot(screenDx, screenDy) || 1
    const txu = screenDx / segLen
    const tyu = screenDy / segLen
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2

    const { nx, ny } = outwardSegmentNormal(txu, tyu, midX, midY, labelCentroid)

    const label = formatSegmentDim(seg.length)

    let angleDeg = (Math.atan2(screenDy, screenDx) * 180) / Math.PI
    if (angleDeg > 90 || angleDeg < -90) angleDeg += 180

    // Always center on segment midpoint; offset only perpendicular (outside).
    return {
      text: label,
      x: midX + nx * style.segmentLabelOffset,
      y: midY + ny * style.segmentLabelOffset,
      rotationDeg: angleDeg,
    }
  })

  const bendLabels: BendLabelLayout[] = []

  if (profile.plateConstraint === 'square' && segments.length === 4) {
    getSquareCornerPairs().forEach(({ segInIndex, segOutIndex }, cornerIdx) => {
      const segIn = segments[segInIndex]
      const segOut = segments[segOutIndex]
      if (!segIn || !segOut) return
      const pos = interiorAngleLabelPosition(segIn, segOut, tx, '90°', style)
      bendLabels.push({
        text: '90°',
        x: pos.x,
        y: pos.y,
        squareCornerIndex: cornerIdx,
      })
    })
  } else {
    bends.forEach((bend, i) => {
      if (!getBendVertexPoint(segments, i)) return
      const segIn = segments[i]
      const segOut = segments[i + 1]
      if (!segIn || !segOut) return
      const label = formatInteriorBendDeg(bend)
      const pos = interiorAngleLabelPosition(segIn, segOut, tx, label, style)
      bendLabels.push({ text: label, x: pos.x, y: pos.y, bendId: bend.id })
    })
  }

  return { segmentLabels, bendLabels }
}

/**
 * PDF label offsets as a fraction of drawn profile span (matches canvas ~26px / ~150px).
 * Clamped so labels stay close to the shape and inside the preview box.
 */
export function labelStyleForPdfDrawing(spanMm: number): LabelStyle {
  const t = Math.min(Math.max(spanMm * 0.135, 3.5), 6.5)
  return {
    segmentLabelOffset: t,
    bendLabelOffset: t * (28 / 26),
    bendLabelCharWidth: t * (4.4 / 26),
    labelHalfHeight: t * (8 / 26),
    labelClearMargin: t * (4 / 26),
  }
}
