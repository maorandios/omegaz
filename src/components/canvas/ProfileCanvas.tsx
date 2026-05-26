import { useMemo, useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line, Circle, Text, Rect, Group } from 'react-konva'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import { getBendVertexPoint } from '@/geometry/calculateProfilePoints'
import { SegmentDimLabel } from '@/components/canvas/SegmentDimLabel'
import {
  CANVAS_LABEL_STYLE,
  computeLabelCentroid,
  computeProfileDrawingLabels,
  estimateLabelTextBox,
} from '@/geometry/profileDrawingLabels'
import { getSquareCornerPairs, isSquareSegmentActive } from '@/geometry/squareProfile'
import type { FoldedProfile } from '@/geometry/types'
import { cn } from '@/lib/utils'

interface ProfileCanvasProps {
  profile: FoldedProfile
  activeItemId?: string | null
  showLabels?: boolean
  /** Summary/fabrication: thin accent strokes and labels, no gray idle styling or bend dots. */
  accentPreview?: boolean
  interactive?: boolean
  onSelectItem?: (type: 'segment' | 'bend', id: string) => void
  className?: string
}

const LABEL_FONT_SIZE = 15 // 12 × 1.25
const BEND_DOT_RADIUS = 4 // 5 ÷ 1.25
const BEND_DOT_RADIUS_ACTIVE = 6 // 8 ÷ 1.25 (rounded)
const KONVA_LABEL_OFFSET_X_FACTOR = CANVAS_LABEL_STYLE.bendLabelCharWidth
const KONVA_LABEL_OFFSET_Y = 7.5

/** Extra space reserved on each side when labels are shown so dim/deg text
 *  pushed outward by collision avoidance still lands inside the stage. */
const CANVAS_LABEL_RESERVE = 22
const CANVAS_CLAMP_MARGIN = 4

const ACCENT_STROKE = '#00ffd4'
const ACCENT_PREVIEW_STROKE_WIDTH = 2

function clampLabelToStage(
  x: number,
  y: number,
  text: string,
  rotationDeg: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const box = estimateLabelTextBox(text, LABEL_FONT_SIZE)
  const rad = (rotationDeg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const halfW = (cos * box.width + sin * box.height) / 2
  const halfH = (sin * box.width + cos * box.height) / 2
  const m = CANVAS_CLAMP_MARGIN
  return {
    x: Math.min(Math.max(x, halfW + m), Math.max(halfW + m, width - halfW - m)),
    y: Math.min(Math.max(y, halfH + m), Math.max(halfH + m, height - halfH - m)),
  }
}

export function ProfileCanvas({
  profile,
  activeItemId = null,
  showLabels = false,
  accentPreview = false,
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
    const reserve = showLabels ? CANVAS_LABEL_RESERVE : 0
    const bw = Math.max(bounds.width, 1)
    const bh = Math.max(bounds.height, 1)
    const innerW = Math.max(size.width - pad * 2 - reserve * 2, 1)
    const innerH = Math.max(size.height - pad * 2 - reserve * 2, 1)
    const scale = Math.min(innerW / bw, innerH / bh)
    const offsetX = (size.width - bw * scale) / 2 - bounds.minX * scale
    const offsetY = (size.height - bh * scale) / 2 - bounds.minY * scale

    const tx = (p: { x: number; y: number }) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    })

    return { scale, tx, bounds }
  }, [segments, size, showLabels])

  const drawingLabels = useMemo(() => {
    if (!showLabels) {
      return { segmentLabels: [], bendLabels: [] }
    }
    const centroid = computeLabelCentroid(segments, layout.tx, {
      x: size.width / 2,
      y: size.height / 2,
    })
    const raw = computeProfileDrawingLabels(profile, layout.tx, centroid, CANVAS_LABEL_STYLE)
    return {
      segmentLabels: raw.segmentLabels.map((lbl) => ({
        ...lbl,
        ...clampLabelToStage(lbl.x, lbl.y, lbl.text, lbl.rotationDeg, size.width, size.height),
      })),
      bendLabels: raw.bendLabels.map((lbl) => ({
        ...lbl,
        ...clampLabelToStage(lbl.x, lbl.y, lbl.text, 0, size.width, size.height),
      })),
    }
  }, [showLabels, profile, segments, layout, size.width, size.height])

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
            stroke={accentPreview ? ACCENT_STROKE : strokeIdle}
            strokeWidth={accentPreview ? ACCENT_PREVIEW_STROKE_WIDTH : 2}
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

          {!accentPreview &&
            segments.map((seg) => {
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

          {!accentPreview &&
            bends.map((bend, i) => {
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
                    radius={isActive ? BEND_DOT_RADIUS_ACTIVE : BEND_DOT_RADIUS}
                    fill={isActive ? ACCENT_STROKE : '#b7b7b7'}
                    listening={false}
                  />
                </Group>
              )
            })}

          {showLabels &&
            drawingLabels.segmentLabels.map((lbl, i) => {
              const seg = segments[i]
              if (!seg) return null
              const isActive = isSquareSegmentActive(profile, activeItemId, seg.id)
              return (
                <SegmentDimLabel
                  key={`lbl-seg-${seg.id}`}
                  layout={lbl}
                  fontSize={LABEL_FONT_SIZE}
                  fontStyle={accentPreview ? 'normal' : isActive ? 'bold' : 'normal'}
                  fill={accentPreview ? labelActiveFill : isActive ? labelActiveFill : labelFill}
                  onSelect={interactive ? () => handleSelect('segment', seg.id) : undefined}
                />
              )
            })}

          {showLabels &&
            (profile.plateConstraint === 'square' && segments.length === 4
              ? getSquareCornerPairs().map(({ bendIndex }, cornerIdx) => {
                  const lbl = drawingLabels.bendLabels.find(
                    (b) => b.squareCornerIndex === cornerIdx,
                  )
                  if (!lbl) return null
                  const bendId = bendIndex !== null ? bends[bendIndex]?.id : null
                  const isActive = bendId !== null && bendId !== undefined && activeItemId === bendId
                  const onSelectBend =
                    interactive && bendId ? () => handleSelect('bend', bendId) : undefined
                  return (
                    <BendDegLabel
                      key={`lbl-square-corner-${cornerIdx}`}
                      x={lbl.x}
                      y={lbl.y}
                      text={lbl.text}
                      isActive={isActive}
                      accentPreview={accentPreview}
                      labelFill={labelFill}
                      labelActiveFill={labelActiveFill}
                      onSelect={onSelectBend}
                    />
                  )
                })
              : bends.map((bend) => {
                  const lbl = drawingLabels.bendLabels.find((b) => b.bendId === bend.id)
                  if (!lbl) return null
                  const isActive = activeItemId === bend.id
                  const onSelectBend = interactive
                    ? () => handleSelect('bend', bend.id)
                    : undefined
                  return (
                    <BendDegLabel
                      key={`lbl-bend-${bend.id}`}
                      x={lbl.x}
                      y={lbl.y}
                      text={lbl.text}
                      isActive={isActive}
                      accentPreview={accentPreview}
                      labelFill={labelFill}
                      labelActiveFill={labelActiveFill}
                      onSelect={onSelectBend}
                    />
                  )
                }))}
        </Layer>
      </Stage>
    </div>
  )
}

interface BendDegLabelProps {
  x: number
  y: number
  text: string
  isActive: boolean
  accentPreview: boolean
  labelFill: string
  labelActiveFill: string
  onSelect?: () => void
}

const BEND_HIT_PAD_X = 8
const BEND_HIT_PAD_Y = 6

function BendDegLabel({
  x,
  y,
  text,
  isActive,
  accentPreview,
  labelFill,
  labelActiveFill,
  onSelect,
}: BendDegLabelProps) {
  const box = estimateLabelTextBox(text, LABEL_FONT_SIZE)
  const halfW = box.width / 2
  const halfH = box.height / 2
  const interactive = Boolean(onSelect)
  return (
    <Group x={x} y={y} listening={interactive}>
      {interactive && (
        <Rect
          x={-halfW - BEND_HIT_PAD_X}
          y={-halfH - BEND_HIT_PAD_Y}
          width={box.width + BEND_HIT_PAD_X * 2}
          height={box.height + BEND_HIT_PAD_Y * 2}
          fill="transparent"
          onClick={onSelect}
          onTap={onSelect}
        />
      )}
      <Text
        text={text}
        fontSize={LABEL_FONT_SIZE}
        fontStyle={accentPreview ? 'normal' : isActive ? 'bold' : 'normal'}
        fill={accentPreview ? labelActiveFill : isActive ? labelActiveFill : labelFill}
        align="center"
        offsetX={text.length * KONVA_LABEL_OFFSET_X_FACTOR * 0.5}
        offsetY={KONVA_LABEL_OFFSET_Y}
        listening={false}
      />
    </Group>
  )
}
