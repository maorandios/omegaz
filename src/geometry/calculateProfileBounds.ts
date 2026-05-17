import type { Point2D, Segment } from './types'

export interface ProfileBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function calculateProfileBounds(segments: Segment[]): ProfileBounds {
  if (segments.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const points: Point2D[] = []
  segments.forEach((s) => {
    points.push(s.startPoint, s.endPoint)
  })

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
