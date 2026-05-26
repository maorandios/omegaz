import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Layer, Line, Rect, Stage } from 'react-konva'
import type { Point2D } from '@/geometry/types'

interface GridDrawCanvasProps {
  points: Point2D[]
  onPointsChange: (points: Point2D[], pixelsPerCell: number) => void
}

/** 3 major boxes wide × 5 minor cells each = 15-cell square grid. */
const MAJOR_DIVISIONS = 3
const MINOR_PER_MAJOR = 5
const TOTAL_CELLS = MAJOR_DIVISIONS * MINOR_PER_MAJOR
/** Tap radius — anywhere within this distance from an existing vertex is ignored. */
const SNAP_RADIUS_PX = 18
/** Internal padding so the grid sits clearly inside the canvas frame instead
 *  of butting up against the container border. */
const GRID_PADDING_PX = 14

interface Size {
  width: number
  height: number
}

function computeGrid(size: Size): {
  pixelsPerCell: number
  cols: number
  rows: number
  offsetX: number
  offsetY: number
} {
  // Square grid that fits inside the available area, centered with equal
  // padding on each side. cols === rows === TOTAL_CELLS so the 9 major boxes
  // are visually identical squares with equal minor cells inside each.
  const available = Math.min(size.width, size.height) - 2 * GRID_PADDING_PX
  const pixelsPerCell = Math.max(1, Math.floor(available / TOTAL_CELLS))
  const cols = TOTAL_CELLS
  const rows = TOTAL_CELLS
  const gridSize = cols * pixelsPerCell
  const offsetX = Math.round((size.width - gridSize) / 2)
  const offsetY = Math.round((size.height - gridSize) / 2)
  return { pixelsPerCell, cols, rows, offsetX, offsetY }
}

export function GridDrawCanvas({ points, onPointsChange }: GridDrawCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>({ width: 360, height: 360 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSize({
        width: Math.max(280, entry.contentRect.width),
        height: Math.max(280, entry.contentRect.height),
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const grid = useMemo(() => computeGrid(size), [size])

  // Notify parent of the current pixelsPerCell so the conversion to mm stays
  // in sync — the parent stores this alongside the points.
  useEffect(() => {
    if (points.length === 0) {
      onPointsChange([], grid.pixelsPerCell)
    } else {
      onPointsChange(points, grid.pixelsPerCell)
    }
    // We intentionally only re-fire when the grid pitch changes, not when
    // points change (the tap handler emits those directly).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.pixelsPerCell])

  const snapToGrid = (x: number, y: number): Point2D => {
    const i = Math.round((x - grid.offsetX) / grid.pixelsPerCell)
    const j = Math.round((y - grid.offsetY) / grid.pixelsPerCell)
    const clampedI = Math.max(0, Math.min(grid.cols, i))
    const clampedJ = Math.max(0, Math.min(grid.rows, j))
    return {
      x: grid.offsetX + clampedI * grid.pixelsPerCell,
      y: grid.offsetY + clampedJ * grid.pixelsPerCell,
    }
  }

  const handleTap = (raw: Point2D) => {
    const snapped = snapToGrid(raw.x, raw.y)
    const last = points[points.length - 1]

    // Tap-on-last-vertex is a no-op (it would create a zero-length segment).
    if (last && Math.hypot(snapped.x - last.x, snapped.y - last.y) < 1) {
      return
    }

    // Tap close to any earlier vertex: also ignore (prevents duplicate dots
    // when the user double-taps trying to land on the grid).
    for (const p of points) {
      if (Math.hypot(snapped.x - p.x, snapped.y - p.y) < SNAP_RADIUS_PX / 2) {
        if (p === last) return
        // Allow closing the shape only by tapping exactly the first point —
        // but we keep the polyline open, so just ignore intermediate dupes.
        return
      }
    }

    onPointsChange([...points, snapped], grid.pixelsPerCell)
  }

  const linePoints = useMemo(() => points.flatMap((p) => [p.x, p.y]), [points])

  const verticalLines: number[][] = []
  for (let c = 0; c <= grid.cols; c++) {
    const x = grid.offsetX + c * grid.pixelsPerCell
    verticalLines.push([x, grid.offsetY, x, grid.offsetY + grid.rows * grid.pixelsPerCell])
  }
  const horizontalLines: number[][] = []
  for (let r = 0; r <= grid.rows; r++) {
    const y = grid.offsetY + r * grid.pixelsPerCell
    horizontalLines.push([grid.offsetX, y, grid.offsetX + grid.cols * grid.pixelsPerCell, y])
  }

  return (
    <div
      ref={containerRef}
      className="w-full select-none bg-background touch-none"
      style={{ minHeight: 320 }}
    >
      <Stage
        width={size.width}
        height={size.height}
        onPointerDown={(e) => {
          const stage = e.target.getStage()
          if (!stage) return
          const pos = stage.getPointerPosition()
          if (!pos) return
          handleTap(pos)
        }}
      >
        <Layer listening={false}>
          <Rect width={size.width} height={size.height} fill="#0d0d0d" />
          {verticalLines.map((coords, i) => {
            const isFrame = i === 0 || i === grid.cols
            const isMajor = i % MINOR_PER_MAJOR === 0
            return (
              <Line
                key={`v-${i}`}
                points={coords}
                stroke={isFrame ? '#52525b' : isMajor ? '#3f3f46' : '#27272a'}
                strokeWidth={isFrame ? 1.5 : isMajor ? 1 : 0.5}
              />
            )
          })}
          {horizontalLines.map((coords, i) => {
            const isFrame = i === 0 || i === grid.rows
            const isMajor = i % MINOR_PER_MAJOR === 0
            return (
              <Line
                key={`h-${i}`}
                points={coords}
                stroke={isFrame ? '#52525b' : isMajor ? '#3f3f46' : '#27272a'}
                strokeWidth={isFrame ? 1.5 : isMajor ? 1 : 0.5}
              />
            )
          })}
        </Layer>
        <Layer listening={false}>
          {linePoints.length >= 4 && (
            <Line
              points={linePoints}
              stroke="#00ffd4"
              strokeWidth={2.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {points.map((p, i) => {
            const isLast = i === points.length - 1
            return (
              <Circle
                key={`pt-${i}`}
                x={p.x}
                y={p.y}
                radius={isLast ? 6 : 4}
                fill={isLast ? '#00ffd4' : '#0d0d0d'}
                stroke="#00ffd4"
                strokeWidth={isLast ? 0 : 2}
              />
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}
