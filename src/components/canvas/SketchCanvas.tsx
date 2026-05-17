import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'
import type { Point2D } from '@/geometry/types'

interface SketchCanvasProps {
  points: Point2D[]
  onPointsChange: (points: Point2D[]) => void
}

export function SketchCanvas({ points, onPointsChange }: SketchCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 320, height: 280 })
  const [isDrawing, setIsDrawing] = useState(false)
  const strokeRef = useRef<Point2D[]>([])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: Math.max(entry.contentRect.height, 280),
        })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const flatPoints = points.flatMap((p) => [p.x, p.y])

  const getPos = (stage: { getPointerPosition: () => Point2D | null }) => {
    const pos = stage.getPointerPosition()
    return pos ?? null
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-zinc-700 bg-white touch-none"
      style={{ minHeight: 280 }}
    >
      <Stage
        width={size.width}
        height={size.height}
        onPointerDown={(e) => {
          const pos = getPos(e.target.getStage()!)
          if (!pos) return
          setIsDrawing(true)
          strokeRef.current = [pos]
          onPointsChange([pos])
        }}
        onPointerMove={(e) => {
          if (!isDrawing) return
          const pos = getPos(e.target.getStage()!)
          if (!pos) return
          const last = strokeRef.current[strokeRef.current.length - 1]
          if (last && Math.hypot(pos.x - last.x, pos.y - last.y) < 3) return
          strokeRef.current = [...strokeRef.current, pos]
          onPointsChange(strokeRef.current)
        }}
        onPointerUp={() => setIsDrawing(false)}
        onPointerLeave={() => setIsDrawing(false)}
      >
        <Layer>
          <Rect width={size.width} height={size.height} fill="#ffffff" />
          {flatPoints.length >= 4 && (
            <Line
              points={flatPoints}
              stroke="#18181b"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={0.2}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
