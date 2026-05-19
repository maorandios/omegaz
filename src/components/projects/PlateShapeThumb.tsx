import { getPlateShapeLabel, getTemplatePreviewPath } from '@/templates/definitions'

interface PlateShapeThumbProps {
  templateId: string | null
}

export function PlateShapeThumb({ templateId }: PlateShapeThumbProps) {
  const id = templateId ?? 'custom'
  const src = getTemplatePreviewPath(id)

  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface/50 p-2.5"
      role="img"
      aria-label={getPlateShapeLabel(templateId)}
    >
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain"
        draggable={false}
      />
    </span>
  )
}
