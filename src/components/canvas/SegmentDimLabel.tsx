import { useLayoutEffect, useRef } from 'react'
import { Text } from 'react-konva'
import type Konva from 'konva'
import type { SegmentLabelLayout } from '@/geometry/profileDrawingLabels'

interface SegmentDimLabelProps {
  layout: SegmentLabelLayout
  fontSize: number
  fill: string
  fontStyle: 'normal' | 'bold'
}

/** Centers rotated dim text on (x,y) using measured Konva text bounds. */
export function SegmentDimLabel({ layout, fontSize, fill, fontStyle }: SegmentDimLabelProps) {
  const textRef = useRef<Konva.Text>(null)

  useLayoutEffect(() => {
    const node = textRef.current
    if (!node) return
    node.offsetX(node.width() / 2)
    node.offsetY(node.height() / 2)
  }, [layout.text, layout.rotationDeg, fontSize, fontStyle])

  return (
    <Text
      ref={textRef}
      x={layout.x}
      y={layout.y}
      text={layout.text}
      fontSize={fontSize}
      fontStyle={fontStyle}
      fill={fill}
      rotation={layout.rotationDeg}
      listening={false}
    />
  )
}
