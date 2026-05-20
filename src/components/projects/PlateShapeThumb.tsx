import { getPlateShapeLabel, getTemplatePreviewPath } from '@/templates/definitions'
import { cn } from '@/lib/utils'

interface PlateShapeThumbProps {
  templateId: string | null
  /** default 2.75rem; sm is ÷1.25 for compact headers */
  size?: 'default' | 'sm'
}

export function PlateShapeThumb({ templateId, size = 'default' }: PlateShapeThumbProps) {
  const id = templateId ?? 'custom'
  const src = getTemplatePreviewPath(id)

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-border bg-surface/50',
        size === 'sm' ? 'h-[2.2rem] w-[2.2rem] p-2' : 'h-11 w-11 p-2.5',
      )}
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
