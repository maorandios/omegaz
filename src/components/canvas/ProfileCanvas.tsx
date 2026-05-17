import { useMemo, useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line, Circle, Text, Rect } from 'react-konva'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import { getBendVertexPoint } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { cn } from '@/lib/utils'

interface ProfileCanvasProps {
  profile: FoldedProfile
  activeItemId?: string | null
  showLabels?: boolean
  className?: string
}

export function ProfileCanvas({
  profile,
  activeItemId = null,
  showLabels = false,
  className,
}: ProfileCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 320, height: 240 })
  const fillParent = Boolean(className?.includes('h-full'))
  const darkCanvas = Boolean(className?.includes('bg-zinc-950'))
  const stageFill = darkCanvas ? '#09090b' : '#f8fafc'

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
    return () => observer.disconnect()
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

  const flatPoints: number[] = []
  segments.forEach((seg) => {
    const s = layout.tx(seg.startPoint)
    flatPoints.push(s.x, s.y)
  })
  if (segments.length > 0) {
    const last = layout.tx(segments[segments.length - 1].endPoint)
    flatPoints.push(last.x, last.y)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-hidden',
        darkCanvas
          ? 'rounded-none border-0 bg-zinc-950'
          : 'rounded-xl border border-zinc-700 bg-slate-50',
        fillParent && 'h-full min-h-0',
        className,
      )}
      style={fillParent ? undefined : { minHeight: 200 }}
    >
      <Stage width={size.width} height={size.height}>
        <Layer>
          <Rect width={size.width} height={size.height} fill={stageFill} />
          <Line
            points={flatPoints}
            stroke="#18181b"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
          />
          {segments.map((seg) => {
            const isActive = activeItemId === seg.id
            if (!isActive) return null
            const s = layout.tx(seg.startPoint)
            const e = layout.tx(seg.endPoint)
            return (
              <Line
                key={`hl-${seg.id}`}
                points={[s.x, s.y, e.x, e.y]}
                stroke="#f59e0b"
                strokeWidth={5}
                lineCap="round"
              />
            )
          })}
          {bends.map((bend, i) => {
            const isActive = activeItemId === bend.id
            const vertex = getBendVertexPoint(segments, i)
            if (!vertex) return null
            const p = layout.tx(vertex)
            return (
              <Circle
                key={bend.id}
                x={p.x}
                y={p.y}
                radius={isActive ? 8 : 4}
                fill={isActive ? '#f59e0b' : '#71717a'}
                stroke={isActive ? '#b45309' : undefined}
                strokeWidth={isActive ? 2 : 0}
              />
            )
          })}
          {showLabels &&
            segments.map((seg) => {
              const mid = layout.tx({
                x: (seg.startPoint.x + seg.endPoint.x) / 2,
                y: (seg.startPoint.y + seg.endPoint.y) / 2,
              })
              return (
                <Text
                  key={`lbl-${seg.id}`}
                  x={mid.x + 4}
                  y={mid.y - 14}
                  text={`${seg.length}`}
                  fontSize={11}
                  fill="#52525b"
                />
              )
            })}
        </Layer>
      </Stage>
    </div>
  )
}
