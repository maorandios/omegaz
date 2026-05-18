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
const SEGMENT_LABEL_OFFSET = 28 // 14 × 2 — gap from segment line
const BEND_LABEL_OFFSET = 28 // gap from bend vertex along interior bisector
const BEND_LABEL_CHAR_WIDTH = 4.4

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

function bisectorFromLegs(
  legA: { x: number; y: number },
  legB: { x: number; y: number },
): { x: number; y: number } {
  const bx = legA.x + legB.x
  const by = legA.y + legB.y
  const blen = Math.hypot(bx, by)
  if (blen < 1e-6) return { x: 0, y: 0 }
  return { x: bx / blen, y: by / blen }
}

/** Label offset inside a corner between two segments (vertex = segIn.end). */
function vertexLabelPosition(
  segIn: Segment,
  segOut: Segment,
  tx: (p: { x: number; y: number }) => { x: number; y: number },
  labelCentroid: { x: number; y: number },
  labelText: string,
): { x: number; y: number } {
  const v = tx(segIn.endPoint)
  const inBack = {
    x: tx(segIn.startPoint).x - v.x,
    y: tx(segIn.startPoint).y - v.y,
  }
  const outFwd = {
    x: tx(segOut.endPoint).x - v.x,
    y: tx(segOut.endPoint).y - v.y,
  }
  const lenIn = Math.hypot(inBack.x, inBack.y)
  const lenOut = Math.hypot(outFwd.x, outFwd.y)
  if (lenIn < 1e-6 || lenOut < 1e-6) {
    return { x: v.x, y: v.y - BEND_LABEL_OFFSET }
  }

  const inBackU = unitVec(inBack.x, inBack.y, lenIn)
  const outFwdU = unitVec(outFwd.x, outFwd.y, lenOut)
  const outBackU = unitVec(-outFwd.x, -outFwd.y, lenOut)

  // Cross sign picks the interior wedge (works for convex corners including top-right).
  const cross = inBack.x * outFwd.y - inBack.y * outFwd.x
  const outLeg = cross > 0 ? outBackU : outFwdU
  let bis = bisectorFromLegs(inBackU, outLeg)

  if (bis.x === 0 && bis.y === 0) {
    const toCentroid = { x: labelCentroid.x - v.x, y: labelCentroid.y - v.y }
    const len = Math.hypot(toCentroid.x, toCentroid.y) || 1
    bis = { x: toCentroid.x / len, y: toCentroid.y / len }
  }

  const dist = BEND_LABEL_OFFSET + labelText.length * BEND_LABEL_CHAR_WIDTH * 0.35
  return { x: v.x + bis.x * dist, y: v.y + bis.y * dist }
}

/** Square corners: always place the angle label inside, toward the profile center. */
function squareInteriorLabelPosition(
  vertex: { x: number; y: number },
  labelCentroid: { x: number; y: number },
  labelText: string,
): { x: number; y: number } {
  let dx = labelCentroid.x - vertex.x
  let dy = labelCentroid.y - vertex.y
  const len = Math.hypot(dx, dy) || 1
  dx /= len
  dy /= len
  const dist = BEND_LABEL_OFFSET + labelText.length * BEND_LABEL_CHAR_WIDTH * 0.35
  return { x: vertex.x + dx * dist, y: vertex.y + dy * dist }
}

function bendLabelPosition(
  segments: FoldedProfile['segments'],
  bendIndex: number,
  tx: (p: { x: number; y: number }) => { x: number; y: number },
  labelCentroid: { x: number; y: number },
  labelText: string,
): { x: number; y: number } {
  const segIn = segments[bendIndex]
  const segOut = segments[bendIndex + 1]
  if (!segIn || !segOut) {
    return { x: labelCentroid.x, y: labelCentroid.y }
  }
  return vertexLabelPosition(segIn, segOut, tx, labelCentroid, labelText)
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
  const stageFill = darkCanvas ? '#161616' : '#f8fafc'
  const strokeIdle = darkCanvas ? '#b7b7b7' : '#18181b'
  const labelFill = darkCanvas ? '#e4e4e7' : '#52525b'
  const labelActiveFill = '#00ffd4'

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const minHeight = fillParent ? 1 : 200
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: Math.max(entry.contentRect.height, minHeight),
        })
      }
    })
    observer.observe(el)
    return () => {
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
              const midX = (start.x + end.x) / 2
              const midY = (start.y + end.y) / 2
              let nx = (-screenDy / segLen) * SEGMENT_LABEL_OFFSET
              let ny = (screenDx / segLen) * SEGMENT_LABEL_OFFSET
              const toCentroidX = labelCentroid.x - midX
              const toCentroidY = labelCentroid.y - midY
              if (nx * toCentroidX + ny * toCentroidY > 0) {
                nx = -nx
                ny = -ny
              }
              let angleDeg = (Math.atan2(screenDy, screenDx) * 180) / Math.PI
              if (angleDeg > 90 || angleDeg < -90) angleDeg += 180
              const label = formatSegmentDim(seg.length)
              return (
                <Text
                  key={`lbl-seg-${seg.id}`}
                  x={midX + nx}
                  y={midY + ny}
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
                  const vertex = layout.tx(segIn.endPoint)
                  const pos = squareInteriorLabelPosition(vertex, labelCentroid, label)
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
                  const pos = bendLabelPosition(
                    segments,
                    i,
                    layout.tx,
                    labelCentroid,
                    label,
                  )
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
