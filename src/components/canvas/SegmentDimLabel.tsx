import { useLayoutEffect, useRef, useState } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { estimateLabelTextBox, type SegmentLabelLayout } from '@/geometry/profileDrawingLabels'

interface SegmentDimLabelProps {
  layout: SegmentLabelLayout
  fontSize: number
  fill: string
  fontStyle: 'normal' | 'bold'
  /** When provided, label becomes an interactive hit target. */
  onSelect?: () => void
}

/** Padding around the text used to enlarge the hit area for touch targets. */
const HIT_PAD_X = 8
const HIT_PAD_Y = 6

/**
 * Center dim text on (layout.x, layout.y), then rotate the group.
 * Rotating Konva Text in place skews the anchor for ~90° labels onto the segment.
 */
export function SegmentDimLabel({ layout, fontSize, fill, fontStyle, onSelect }: SegmentDimLabelProps) {
  const textRef = useRef<Konva.Text>(null)
  const estimated = estimateLabelTextBox(layout.text, fontSize)
  const [size, setSize] = useState(estimated)

  useLayoutEffect(() => {
    const node = textRef.current
    if (!node) return
    // getTextWidth() returns the natural text width regardless of any width
    // prop on the node, so it grows correctly when digits are appended
    // (e.g. typing 10 → 100 in the wizard).
    const w = node.getTextWidth()
    const h = node.height()
    if (w > 0 && h > 0) setSize({ width: w, height: h })
  }, [layout.text, layout.rotationDeg, fontSize, fontStyle])

  const halfW = size.width / 2
  const halfH = size.height / 2
  const interactive = Boolean(onSelect)

  return (
    <Group
      x={layout.x}
      y={layout.y}
      rotation={layout.rotationDeg}
      listening={interactive}
    >
      {interactive && (
        <Rect
          x={-halfW - HIT_PAD_X}
          y={-halfH - HIT_PAD_Y}
          width={size.width + HIT_PAD_X * 2}
          height={size.height + HIT_PAD_Y * 2}
          fill="transparent"
          onClick={onSelect}
          onTap={onSelect}
        />
      )}
      <Text
        ref={textRef}
        x={-halfW}
        y={-halfH}
        text={layout.text}
        fontSize={fontSize}
        fontStyle={fontStyle}
        fill={fill}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  )
}
