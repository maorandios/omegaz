import { useMemo, useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line, Circle, Text, Rect, Group } from 'react-konva'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import { getBendVertexPoint } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { cn } from '@/lib/utils'

interface ProfileCanvasProps {
  profile: FoldedProfile
  activeItemId?: string | null
  showLabels?: boolean
  interactive?: boolean
  onSelectItem?: (type: 'segment' | 'bend', id: string) => void
  className?: string
}

function formatLength(n: number): string {
  const v = Math.round(n * 10) / 10
  return Number.isInteger(v) ? `${v}` : `${v}`
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
  const darkCanvas = Boolean(className?.includes('bg-zinc-950'))
  const stageFill = darkCanvas ? '#09090b' : '#f8fafc'
  const strokeIdle = darkCanvas ? '#a1a1aa' : '#18181b'
  const labelFill = darkCanvas ? '#e4e4e7' : '#52525b'
  const labelActiveFill = '#fbbf24'

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
          ? 'rounded-none border-0 bg-zinc-950'
          : 'rounded-xl border border-zinc-700 bg-slate-50',
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
                  fill={isActive ? '#f59e0b' : '#71717a'}
                  stroke={isActive ? '#b45309' : undefined}
                  strokeWidth={isActive ? 2 : 0}
                  listening={false}
                />
              </Group>
            )
          })}

          {showLabels &&
            segments.map((seg) => {
              const isActive = activeItemId === seg.id
              const mid = layout.tx({
                x: (seg.startPoint.x + seg.endPoint.x) / 2,
                y: (seg.startPoint.y + seg.endPoint.y) / 2,
              })
              const dx = seg.endPoint.x - seg.startPoint.x
              const dy = seg.endPoint.y - seg.startPoint.y
              const len = Math.hypot(dx, dy) || 1
              const nx = (-dy / len) * 14
              const ny = (dx / len) * 14
              return (
                <Text
                  key={`lbl-seg-${seg.id}`}
                  x={mid.x + nx - 20}
                  y={mid.y + ny - 8}
                  width={40}
                  align="center"
                  text={`${formatLength(seg.length)} mm`}
                  fontSize={12}
                  fontStyle={isActive ? 'bold' : 'normal'}
                  fill={isActive ? labelActiveFill : labelFill}
                  listening={false}
                />
              )
            })}

          {showLabels &&
            bends.map((bend, i) => {
              const isActive = activeItemId === bend.id
              const vertex = getBendVertexPoint(segments, i)
              if (!vertex) return null
              const p = layout.tx(vertex)
              return (
                <Text
                  key={`lbl-bend-${bend.id}`}
                  x={p.x - 22}
                  y={p.y + 12}
                  width={44}
                  align="center"
                  text={`${formatLength(bend.angle)}°`}
                  fontSize={12}
                  fontStyle={isActive ? 'bold' : 'normal'}
                  fill={isActive ? labelActiveFill : labelFill}
                  listening={false}
                />
              )
            })}
        </Layer>
      </Stage>
    </div>
  )
}
