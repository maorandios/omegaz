import { useMemo, useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line, Circle, Text, Rect, Group } from 'react-konva'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import { getBendVertexPoint } from '@/geometry/calculateProfilePoints'
import { getSquareCornerPairs, isSquareSegmentActive } from '@/geometry/squareProfile'
import type { FoldedProfile, Segment } from '@/geometry/types'
import { formatInteriorBendDeg } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProfileCanvasProps {
  profile: FoldedProfile
  activeItemId?: string | null
  showLabels?: boolean
  interactive?: boolean
  onSelectItem?: (type: 'segment' | 'bend', id: string) => void
  className?: string
}

const LABEL_FONT_SIZE = 15 // 12 × 1.25
const SEGMENT_LABEL_OFFSET = 26 // perpendicular gap from segment line (dim labels)
const BEND_LABEL_OFFSET = 22 // gap from bend vertex along interior bisector (deg labels)
const BEND_LABEL_CHAR_WIDTH = 4.4
const LABEL_HALF_HEIGHT = 8 // approx half line height for collision checks
const LABEL_CLEAR_MARGIN = 4 // extra spacing between label boxes

function formatSegmentDim(n: number): string {
  const v = Math.round(n * 10) / 10
  return v.toLocaleString('en-US', {
    maximumFractionDigits: Number.isInteger(v) ? 0 : 1,
    minimumFractionDigits: 0,
  })
}

function unitVec(x: number, y: number, len: number): { x: number; y: number } {
  if (len < 1e-6) return { x: 0, y: 0 }
  return { x: x / len, y: y / len }
}

/**
 * Unit vector into the angular wedge between two segments meeting at a vertex.
 * Built from the sum of unit vectors pointing FROM the vertex along each leg, so
 * it always lies inside the smaller wedge (the bend's interior for convex corners).
 */
function interiorAngleBisector(
  segIn: Segment,
  segOut: Segment,
  tx: (p: { x: number; y: number }) => { x: number; y: number },
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

/** Angle (deg) labels: inside the corner pocket, offset along the interior bisector. */
function interiorAngleLabelPosition(
  segIn: Segment,
  segOut: Segment,
  tx: (p: { x: number; y: number }) => { x: number; y: number },
  labelText: string,
): { x: number; y: number; bisX: number; bisY: number } {
  const v = tx(segIn.endPoint)
  const bis = interiorAngleBisector(segIn, segOut, tx)
  const dist = BEND_LABEL_OFFSET + labelText.length * BEND_LABEL_CHAR_WIDTH * 0.25
  return {
    x: v.x + bis.x * dist,
    y: v.y + bis.y * dist,
    bisX: bis.x,
    bisY: bis.y,
  }
}

function bendLabelPosition(
  segments: FoldedProfile['segments'],
  bendIndex: number,
  tx: (p: { x: number; y: number }) => { x: number; y: number },
  labelText: string,
): { x: number; y: number; bisX: number; bisY: number } {
  const segIn = segments[bendIndex]
  const segOut = segments[bendIndex + 1]
  if (!segIn || !segOut) {
    return { x: 0, y: 0, bisX: 0, bisY: -1 }
  }
  return interiorAngleLabelPosition(segIn, segOut, tx, labelText)
}

function screenCentroid(
  segments: FoldedProfile['segments'],
  tx: (p: { x: number; y: number }) => { x: number; y: number },
  fallback: { x: number; y: number },
): { x: number; y: number } {
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

export function ProfileCanvas({
  profile,
  activeItemId = null,
  showLabels = false,
  interactive = false,
  onSelectItem,
  className,
}: ProfileCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 320, height: 240 })
  const fillParent = Boolean(className?.includes('h-full'))
  const darkCanvas = Boolean(className?.includes('bg-background'))
  const stageFill = darkCanvas ? '#0d0d0d' : '#f8fafc'
  const strokeIdle = darkCanvas ? '#b7b7b7' : '#18181b'
  const labelFill = darkCanvas ? '#e4e4e7' : '#52525b'
  const labelActiveFill = '#00ffd4'

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const minHeight = fillParent ? 1 : 200

    const applySize = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return
      setSize({
        width,
        height: Math.max(height, minHeight),
      })
    }

    const measure = () => {
      applySize(el.clientWidth, el.clientHeight)
    }

    measure()
    const raf = requestAnimationFrame(measure)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        applySize(entry.contentRect.width, entry.contentRect.height)
      } else {
        measure()
      }
    })
    observer.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [fillParent])

  const { segments, bends } = profile

  const layout = useMemo(() => {
    const bounds = calculateProfileBounds(segments)
    const pad = 40
    const bw = Math.max(bounds.width, 1)
    const bh = Math.max(bounds.height, 1)
    const scale = Math.min((size.width - pad * 2) / bw, (size.height - pad * 2) / bh)
    const offsetX = (size.width - bw * scale) / 2 - bounds.minX * scale
    const offsetY = (size.height - bh * scale) / 2 - bounds.minY * scale

    const tx = (p: { x: number; y: number }) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    })

    return { scale, tx, bounds }
  }, [segments, size])

  const labelCentroid = useMemo(
    () =>
      screenCentroid(segments, layout.tx, {
        x: size.width / 2,
        y: size.height / 2,
      }),
    [segments, layout, size.width, size.height],
  )

  // Pre-compute angle (deg) label boxes so dim labels can avoid clashing with them.
  const angleLabelBoxes = useMemo(() => {
    const boxes: { vertex: { x: number; y: number }; box: { cx: number; cy: number; halfW: number; halfH: number } }[] = []
    if (!showLabels) return boxes

    const pushBox = (
      segIn: Segment,
      segOut: Segment,
      labelText: string,
    ) => {
      const vertex = layout.tx(segIn.endPoint)
      const pos = interiorAngleLabelPosition(segIn, segOut, layout.tx, labelText)
      boxes.push({
        vertex,
        box: {
          cx: pos.x,
          cy: pos.y,
          halfW: labelText.length * BEND_LABEL_CHAR_WIDTH * 0.5 + LABEL_CLEAR_MARGIN,
          halfH: LABEL_HALF_HEIGHT + LABEL_CLEAR_MARGIN,
        },
      })
    }

    if (profile.plateConstraint === 'square' && segments.length === 4) {
      getSquareCornerPairs().forEach(({ segInIndex, segOutIndex }) => {
        const segIn = segments[segInIndex]
        const segOut = segments[segOutIndex]
        if (!segIn || !segOut) return
        pushBox(segIn, segOut, '90°')
      })
    } else {
      bends.forEach((bend, i) => {
        const segIn = segments[i]
        const segOut = segments[i + 1]
        if (!segIn || !segOut) return
        if (!getBendVertexPoint(segments, i)) return
        pushBox(segIn, segOut, formatInteriorBendDeg(bend))
      })
    }

    return boxes
  }, [showLabels, profile.plateConstraint, segments, bends, layout])

  const flatPoints: number[] = []
  segments.forEach((seg) => {
    const s = layout.tx(seg.startPoint)
    flatPoints.push(s.x, s.y)
  })
  if (segments.length > 0) {
    const last = layout.tx(segments[segments.length - 1].endPoint)
    flatPoints.push(last.x, last.y)
  }

  const handleSelect = (type: 'segment' | 'bend', id: string) => {
    if (!interactive || !onSelectItem) return
    onSelectItem(type, id)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-hidden',
        darkCanvas
          ? 'rounded-none border-0 bg-background'
          : 'rounded-xl border border-border bg-slate-50',
        fillParent && 'h-full min-h-0',
        interactive && 'touch-none',
        className,
      )}
      style={fillParent ? undefined : { minHeight: 200 }}
    >
      <Stage width={size.width} height={size.height}>
        <Layer>
          <Rect width={size.width} height={size.height} fill={stageFill} />

          <Line
            points={flatPoints}
            stroke={strokeIdle}
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />

          {interactive &&
            segments.map((seg) => {
              const s = layout.tx(seg.startPoint)
              const e = layout.tx(seg.endPoint)
              return (
                <Line
                  key={`hit-${seg.id}`}
                  points={[s.x, s.y, e.x, e.y]}
                  stroke="transparent"
                  strokeWidth={28}
                  lineCap="round"
                  onClick={() => handleSelect('segment', seg.id)}
                  onTap={() => handleSelect('segment', seg.id)}
                />
              )
            })}

          {segments.map((seg) => {
            const isActive = isSquareSegmentActive(profile, activeItemId, seg.id)
            if (!isActive) return null
            const s = layout.tx(seg.startPoint)
            const e = layout.tx(seg.endPoint)
            return (
              <Line
                key={`hl-${seg.id}`}
                points={[s.x, s.y, e.x, e.y]}
                stroke="#00ffd4"
                strokeWidth={5}
                lineCap="round"
                listening={false}
              />
            )
          })}

          {bends.map((bend, i) => {
            const vertex = getBendVertexPoint(segments, i)
            if (!vertex) return null
            const p = layout.tx(vertex)
            const isActive = activeItemId === bend.id
            return (
              <Group key={bend.id}>
                {interactive && (
                  <Circle
                    x={p.x}
                    y={p.y}
                    radius={22}
                    fill="transparent"
                    onClick={() => handleSelect('bend', bend.id)}
                    onTap={() => handleSelect('bend', bend.id)}
                  />
                )}
                <Circle
                  x={p.x}
                  y={p.y}
                  radius={isActive ? 8 : 5}
                  fill={isActive ? '#00ffd4' : '#b7b7b7'}
                  stroke={isActive ? '#b45309' : undefined}
                  strokeWidth={isActive ? 2 : 0}
                  listening={false}
                />
              </Group>
            )
          })}

          {showLabels &&
            segments.map((seg) => {
              const isActive = isSquareSegmentActive(profile, activeItemId, seg.id)
              const start = layout.tx(seg.startPoint)
              const end = layout.tx(seg.endPoint)
              const screenDx = end.x - start.x
              const screenDy = end.y - start.y
              const segLen = Math.hypot(screenDx, screenDy) || 1
              const tx = screenDx / segLen
              const ty = screenDy / segLen
              const midX = (start.x + end.x) / 2
              const midY = (start.y + end.y) / 2
              // Perpendicular pointing AWAY from centroid (dim labels go outside).
              let nx = -ty
              let ny = tx
              const toCentroidX = labelCentroid.x - midX
              const toCentroidY = labelCentroid.y - midY
              if (nx * toCentroidX + ny * toCentroidY > 0) {
                nx = -nx
                ny = -ny
              }

              const label = formatSegmentDim(seg.length)
              const halfTextW = label.length * BEND_LABEL_CHAR_WIDTH * 0.5
              const labelBoxW = halfTextW + LABEL_CLEAR_MARGIN

              // Project label center along segment, shift away from any angle-label box.
              let along = 0 // 0 = midpoint; positive = toward end, negative = toward start
              const tryCx = (offset: number) => midX + nx * SEGMENT_LABEL_OFFSET + tx * offset
              const tryCy = (offset: number) => midY + ny * SEGMENT_LABEL_OFFSET + ty * offset

              const hits = (offset: number) => {
                const cx = tryCx(offset)
                const cy = tryCy(offset)
                return angleLabelBoxes.some(({ box }) => {
                  return (
                    Math.abs(cx - box.cx) < box.halfW + labelBoxW &&
                    Math.abs(cy - box.cy) < box.halfH + (LABEL_HALF_HEIGHT + LABEL_CLEAR_MARGIN)
                  )
                })
              }

              if (hits(0)) {
                // Try shifting along the segment up to ±half its length.
                const maxAlong = Math.max(0, segLen / 2 - halfTextW)
                const step = Math.max(4, maxAlong / 6)
                for (let s = step; s <= maxAlong; s += step) {
                  if (!hits(s)) {
                    along = s
                    break
                  }
                  if (!hits(-s)) {
                    along = -s
                    break
                  }
                }
              }

              const cx = tryCx(along)
              const cy = tryCy(along)

              let angleDeg = (Math.atan2(screenDy, screenDx) * 180) / Math.PI
              if (angleDeg > 90 || angleDeg < -90) angleDeg += 180
              return (
                <Text
                  key={`lbl-seg-${seg.id}`}
                  x={cx}
                  y={cy}
                  text={label}
                  fontSize={LABEL_FONT_SIZE}
                  fontStyle={isActive ? 'bold' : 'normal'}
                  fill={isActive ? labelActiveFill : labelFill}
                  rotation={angleDeg}
                  offsetX={label.length * 4.4}
                  offsetY={7.5}
                  listening={false}
                />
              )
            })}

          {showLabels &&
            (profile.plateConstraint === 'square' && segments.length === 4
              ? getSquareCornerPairs().map(({ segInIndex, segOutIndex, bendIndex }, cornerIdx) => {
                  const segIn = segments[segInIndex]
                  const segOut = segments[segOutIndex]
                  if (!segIn || !segOut) return null
                  const label = '90°'
                  const pos = interiorAngleLabelPosition(segIn, segOut, layout.tx, label)
                  const bendId = bendIndex !== null ? bends[bendIndex]?.id : null
                  const isActive = bendId !== null && bendId !== undefined && activeItemId === bendId
                  return (
                    <Text
                      key={`lbl-square-corner-${cornerIdx}`}
                      x={pos.x}
                      y={pos.y}
                      text={label}
                      fontSize={LABEL_FONT_SIZE}
                      fontStyle={isActive ? 'bold' : 'normal'}
                      fill={isActive ? labelActiveFill : labelFill}
                      align="center"
                      offsetX={label.length * BEND_LABEL_CHAR_WIDTH * 0.5}
                      offsetY={7.5}
                      listening={false}
                    />
                  )
                })
              : bends.map((bend, i) => {
                  const isActive = activeItemId === bend.id
                  if (!getBendVertexPoint(segments, i)) return null
                  const label = formatInteriorBendDeg(bend)
                  const pos = bendLabelPosition(segments, i, layout.tx, label)
                  return (
                    <Text
                      key={`lbl-bend-${bend.id}`}
                      x={pos.x}
                      y={pos.y}
                      text={label}
                      fontSize={LABEL_FONT_SIZE}
                      fontStyle={isActive ? 'bold' : 'normal'}
                      fill={isActive ? labelActiveFill : labelFill}
                      align="center"
                      offsetX={label.length * BEND_LABEL_CHAR_WIDTH * 0.5}
                      offsetY={7.5}
                      listening={false}
                    />
                  )
                }))}
        </Layer>
      </Stage>
    </div>
  )
}
