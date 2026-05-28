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
  /**
   * Actual rendered font size in the renderer's coordinate units (px for
   * canvas, mm for PDF). Used by collision avoidance, which needs the real
   * visual extents — not the geometry-scaled offsets that the other fields
   * encode.
   */
  actualFontSize: number
}

/** Matches ProfileCanvas defaults (12px base × 1.25). */
export const CANVAS_LABEL_STYLE: LabelStyle = {
  segmentLabelOffset: 26,
  bendLabelOffset: 28,
  bendLabelCharWidth: 4.4,
  labelHalfHeight: 8,
  labelClearMargin: 7,
  actualFontSize: 15,
}

/** PDF export: same layout rules with 1.25× offsets for mm drawing space. */
export const PDF_LABEL_STYLE: LabelStyle = {
  segmentLabelOffset: 26 * 1.25,
  bendLabelOffset: 28 * 1.25,
  bendLabelCharWidth: 4.4 * 1.25,
  labelHalfHeight: 8 * 1.25,
  labelClearMargin: 7 * 1.25,
  actualFontSize: 12.5 * 0.3528, // PDF_DIM_FONT (12.5pt) in mm
}

export interface SegmentLabelLayout {
  text: string
  x: number
  y: number
  rotationDeg: number
  /** Exterior normal (unit) used for placement — PDF anchor correction. */
  normalX: number
  normalY: number
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

  // When both adjacent segments are short the corner is in a tight space and
  // the bend label crowds the dim labels — push it slightly further out.
  const inStart = tx(segIn.startPoint)
  const outEnd = tx(segOut.endPoint)
  const lenIn = Math.hypot(v.x - inStart.x, v.y - inStart.y) || 1
  const lenOut = Math.hypot(outEnd.x - v.x, outEnd.y - v.y) || 1
  const minAdj = Math.min(lenIn, lenOut)
  const shortThreshold = Math.max(style.bendLabelOffset * 1.4, style.actualFontSize * 3.5)
  const shortRatio =
    minAdj < shortThreshold ? (shortThreshold - minAdj) / shortThreshold : 0
  const boost = 1 + Math.min(shortRatio, 0.75) * 0.45

  const dist =
    (style.bendLabelOffset + labelText.length * style.bendLabelCharWidth * 0.25) * boost
  return {
    x: v.x + bis.x * dist,
    y: v.y + bis.y * dist,
  }
}

interface LabelBox {
  cx: number
  cy: number
  halfW: number
  halfH: number
  /** Rotation in degrees. 0 = axis-aligned (bend labels). */
  rotationDeg: number
}

function makeLabelBox(
  text: string,
  cx: number,
  cy: number,
  rotationDeg: number,
  style: LabelStyle,
): LabelBox {
  const fontSize = style.actualFontSize
  return {
    cx,
    cy,
    halfW: (text.length * fontSize * 0.58) / 2,
    halfH: (fontSize * 1.2) / 2,
    rotationDeg,
  }
}

/**
 * Conservative rotated-AABB collision check. Transforms `b`'s center into
 * `a`'s local frame, then tests whether it lies inside an AABB expanded by
 * `b`'s extents (treating `b` as axis-aligned inside `a`'s frame — slightly
 * over-counts for two rotated boxes, which is harmless for layout avoidance).
 */
function labelBoxesOverlap(a: LabelBox, b: LabelBox, margin: number): boolean {
  const rad = (a.rotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = b.cx - a.cx
  const dy = b.cy - a.cy
  const lx = dx * cos + dy * sin
  const ly = -dx * sin + dy * cos
  return (
    Math.abs(lx) < a.halfW + b.halfW + margin &&
    Math.abs(ly) < a.halfH + b.halfH + margin
  )
}

function findOverlap(self: LabelBox, obstacles: LabelBox[], margin: number): LabelBox | null {
  for (const o of obstacles) {
    if (labelBoxesOverlap(self, o, margin)) return o
    if (labelBoxesOverlap(o, self, margin)) return o
  }
  return null
}

interface LineObstacle {
  ax: number
  ay: number
  bx: number
  by: number
}

/**
 * Distance from a point to a line segment, plus the closest point on the
 * segment. Used to push labels away from the geometry strokes themselves.
 */
function distanceToLineSegment(
  px: number,
  py: number,
  line: LineObstacle,
): { distance: number; cx: number; cy: number } {
  const dx = line.bx - line.ax
  const dy = line.by - line.ay
  const lenSq = dx * dx + dy * dy
  if (lenSq < 1e-6) {
    return { distance: Math.hypot(px - line.ax, py - line.ay), cx: line.ax, cy: line.ay }
  }
  let t = ((px - line.ax) * dx + (py - line.ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = line.ax + t * dx
  const cy = line.ay + t * dy
  return { distance: Math.hypot(px - cx, py - cy), cx, cy }
}

/** Half-width of the label measured perpendicular to a segment (rotation ≈ tangent). */
function labelHalfExtentPerpendicularToSegment(
  text: string,
  rotationDeg: number,
  style: LabelStyle,
): number {
  const { width, height } = estimateLabelTextBox(text, style.actualFontSize)
  const halfW = width / 2
  const halfH = height / 2
  const segRad = (rotationDeg * Math.PI) / 180
  const sin = Math.sin(segRad)
  const cos = Math.cos(segRad)
  return Math.abs(halfW * sin) + Math.abs(halfH * cos)
}

/**
 * Treat each geometry segment line as an obstacle. Clearance uses the label
 * extent perpendicular to the segment (for vertical dims that is ~half the
 * string width, not the font height).
 */
function findLineCollision(
  pos: { x: number; y: number },
  labelHalfExtent: number,
  lines: LineObstacle[],
  margin: number,
): { line: LineObstacle; cx: number; cy: number } | null {
  for (const line of lines) {
    const { distance, cx, cy } = distanceToLineSegment(pos.x, pos.y, line)
    if (distance < labelHalfExtent + margin) {
      return { line, cx, cy }
    }
  }
  return null
}

/**
 * Slide a bend label until it no longer overlaps any obstacle. Pushes away
 * from the colliding obstacle when possible, but biases motion to keep a
 * positive component along the interior bisector so the label stays
 * associated with its vertex.
 */
function pushBendLabelClear(
  initial: { x: number; y: number },
  bisector: { x: number; y: number },
  selfText: string,
  obstacles: LabelBox[],
  lines: LineObstacle[],
  style: LabelStyle,
): { x: number; y: number } {
  const step = Math.max(style.bendLabelOffset * 0.2, style.actualFontSize * 0.25)
  const maxDistance = Math.max(style.bendLabelOffset * 6, style.actualFontSize * 8)
  if (step <= 0) return initial

  const maxIter = Math.max(1, Math.ceil(maxDistance / step))
  let pos = { ...initial }
  const halfExtent = (style.actualFontSize * 1.2) / 2

  for (let iter = 0; iter < maxIter; iter++) {
    const selfBox = makeLabelBox(selfText, pos.x, pos.y, 0, style)
    const collider = findOverlap(selfBox, obstacles, style.labelClearMargin)
    const lineHit = collider
      ? null
      : findLineCollision(pos, halfExtent, lines, style.labelClearMargin)

    if (!collider && !lineHit) return pos

    let dirX: number
    let dirY: number
    if (collider) {
      dirX = pos.x - collider.cx
      dirY = pos.y - collider.cy
    } else if (lineHit) {
      dirX = pos.x - lineHit.cx
      dirY = pos.y - lineHit.cy
    } else {
      return pos
    }

    const dirLen = Math.hypot(dirX, dirY)
    if (dirLen < 1e-3) {
      dirX = bisector.x
      dirY = bisector.y
    } else {
      dirX /= dirLen
      dirY /= dirLen
      const dotBis = dirX * bisector.x + dirY * bisector.y
      if (dotBis < 0.15) {
        // Almost perpendicular to or behind the bisector — blend so we keep
        // moving generally outward into the angle.
        dirX = dirX + bisector.x * 0.75
        dirY = dirY + bisector.y * 0.75
        const blendLen = Math.hypot(dirX, dirY) || 1
        dirX /= blendLen
        dirY /= blendLen
      }
    }

    pos = { x: pos.x + dirX * step, y: pos.y + dirY * step }
  }
  return pos
}

/**
 * Slide a segment dim label outward along its perpendicular normal if it
 * still overlaps any obstacle after bend labels are placed. Pushing only
 * along the segment normal keeps the label visually anchored to its segment.
 */
function pushSegmentLabelOutward(
  initial: { x: number; y: number },
  normal: { x: number; y: number },
  text: string,
  rotationDeg: number,
  obstacles: LabelBox[],
  /** Lines that are NOT the segment this label belongs to. */
  foreignLines: LineObstacle[],
  style: LabelStyle,
): { x: number; y: number } {
  const step = Math.max(style.segmentLabelOffset * 0.25, style.actualFontSize * 0.25)
  const maxDistance = Math.max(style.segmentLabelOffset * 4, style.actualFontSize * 6)
  if (step <= 0) return initial

  const maxIter = Math.max(1, Math.ceil(maxDistance / step))
  let pos = { ...initial }
  const halfExtent = labelHalfExtentPerpendicularToSegment(text, rotationDeg, style)

  for (let iter = 0; iter < maxIter; iter++) {
    const selfBox = makeLabelBox(text, pos.x, pos.y, rotationDeg, style)
    const collider = findOverlap(selfBox, obstacles, style.labelClearMargin)
    const lineHit = collider
      ? null
      : findLineCollision(pos, halfExtent, foreignLines, style.labelClearMargin)
    if (!collider && !lineHit) return pos
    pos = { x: pos.x + normal.x * step, y: pos.y + normal.y * step }
  }
  return pos
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

  interface SegmentLayoutCache {
    label: SegmentLabelLayout
    normal: { x: number; y: number }
    line: LineObstacle
  }

  interface SegmentGeo {
    seg: Segment
    start: Point2D
    end: Point2D
    midX: number
    midY: number
    segLen: number
    nx: number
    ny: number
    text: string
    angleDeg: number
    line: LineObstacle
    effectiveOffset: number
  }

  const segmentGeo: SegmentGeo[] = segments.map((seg) => {
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

    const text = formatSegmentDim(seg.length)

    let angleDeg = (Math.atan2(screenDy, screenDx) * 180) / Math.PI
    if (angleDeg > 90 || angleDeg < -90) angleDeg += 180

    // Short segments crowd against their bend labels — give the dim label
    // a larger perpendicular offset so it lands clear of the corner zone.
    const shortThreshold = Math.max(style.segmentLabelOffset * 1.6, style.actualFontSize * 4)
    const shortRatio = segLen < shortThreshold ? (shortThreshold - segLen) / shortThreshold : 0
    const boost = 1 + Math.min(shortRatio, 0.75) * 0.85
    const effectiveOffset = style.segmentLabelOffset * boost

    return {
      seg,
      start,
      end,
      midX,
      midY,
      segLen,
      nx,
      ny,
      text,
      angleDeg,
      line: { ax: start.x, ay: start.y, bx: end.x, by: end.y },
      effectiveOffset,
    }
  })

  // For each segment, prefer the side of the normal that has more open space.
  // The centroid-based default is correct for typical convex profiles, but
  // for concave / spike features it can place the label in a cramped pocket
  // (e.g. inside a small notch). When the opposite side has clearly more
  // clearance to other geometry strokes, flip the normal so the label sits
  // in the open area.
  const allLines: LineObstacle[] = segmentGeo.map((g) => g.line)
  segmentGeo.forEach((g, i) => {
    const otherLines = allLines.filter((_, j) => j !== i)
    if (otherLines.length === 0) return

    const probeDist = g.effectiveOffset
    const aX = g.midX + g.nx * probeDist
    const aY = g.midY + g.ny * probeDist
    const bX = g.midX - g.nx * probeDist
    const bY = g.midY - g.ny * probeDist

    let minA = Infinity
    let minB = Infinity
    for (const ln of otherLines) {
      const dA = distanceToLineSegment(aX, aY, ln).distance
      const dB = distanceToLineSegment(bX, bY, ln).distance
      if (dA < minA) minA = dA
      if (dB < minB) minB = dB
    }

    // Only flip when the exterior (centroid) side is cramped — not merely when
    // the interior is more open (wide profiles would flip right-hand vertical
    // dims inward onto the stroke).
    const flipMargin = style.actualFontSize * 1.2
    const exteriorCramped = Math.max(
      g.effectiveOffset * 1.25,
      style.actualFontSize * 2.25,
    )
    if (minA < exteriorCramped && minB > minA + flipMargin) {
      g.nx = -g.nx
      g.ny = -g.ny
    }
  })

  const segmentCache: SegmentLayoutCache[] = segmentGeo.map((g) => ({
    label: {
      text: g.text,
      x: g.midX + g.nx * g.effectiveOffset,
      y: g.midY + g.ny * g.effectiveOffset,
      rotationDeg: g.angleDeg,
      normalX: g.nx,
      normalY: g.ny,
    },
    normal: { x: g.nx, y: g.ny },
    line: g.line,
  }))

  const obstacles: LabelBox[] = segmentCache.map(({ label }) =>
    makeLabelBox(label.text, label.x, label.y, label.rotationDeg, style),
  )

  const bendLabels: BendLabelLayout[] = []

  const placeBendLabel = (
    segIn: Segment,
    segOut: Segment,
    text: string,
  ): { x: number; y: number } => {
    const initial = interiorAngleLabelPosition(segIn, segOut, tx, text, style)
    const bis = interiorAngleBisector(segIn, segOut, tx)
    const adjusted = pushBendLabelClear(initial, bis, text, obstacles, allLines, style)
    obstacles.push(makeLabelBox(text, adjusted.x, adjusted.y, 0, style))
    return adjusted
  }

  if (profile.plateConstraint === 'square' && segments.length === 4) {
    getSquareCornerPairs().forEach(({ segInIndex, segOutIndex }, cornerIdx) => {
      const segIn = segments[segInIndex]
      const segOut = segments[segOutIndex]
      if (!segIn || !segOut) return
      const pos = placeBendLabel(segIn, segOut, '90°')
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
      const text = formatInteriorBendDeg(bend)
      const pos = placeBendLabel(segIn, segOut, text)
      bendLabels.push({ text, x: pos.x, y: pos.y, bendId: bend.id })
    })
  }

  // Second pass: nudge any segment label still overlapping a bend label,
  // another segment label, or a non-owning geometry line further outward
  // along its own normal.
  const segmentLabels: SegmentLabelLayout[] = segmentCache.map(
    ({ label, normal }, idx) => {
      const obstaclesExcludingSelf = obstacles.filter((_, i) => i !== idx)
      const foreignLines = allLines.filter((_, i) => i !== idx)
      const adjusted = pushSegmentLabelOutward(
        { x: label.x, y: label.y },
        normal,
        label.text,
        label.rotationDeg,
        obstaclesExcludingSelf,
        foreignLines,
        style,
      )
      obstacles[idx] = makeLabelBox(
        label.text,
        adjusted.x,
        adjusted.y,
        label.rotationDeg,
        style,
      )
      return { ...label, x: adjusted.x, y: adjusted.y }
    },
  )

  return { segmentLabels, bendLabels }
}

/**
 * PDF label offsets as a fraction of drawn profile span (matches canvas ~26px / ~150px).
 * Clamped so labels stay close to the shape and inside the preview box.
 */
export function labelStyleForPdfDrawing(spanMm: number): LabelStyle {
  const t = Math.min(Math.max(spanMm * 0.135, 3.5), 6.5)
  const fontMm = 12.5 * 0.3528
  return {
    segmentLabelOffset: t,
    bendLabelOffset: t * (28 / 26),
    bendLabelCharWidth: t * (4.4 / 26),
    labelHalfHeight: t * (8 / 26),
    labelClearMargin: Math.max(t * (7 / 26), fontMm * 0.45),
    actualFontSize: fontMm,
  }
}
