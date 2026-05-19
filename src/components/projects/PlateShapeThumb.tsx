import { getPlateShapeLabel, getTemplatePreviewPath } from '@/templates/definitions'

interface PlateShapeThumbProps {
  templateId: string | null
}

export function PlateShapeThumb({ templateId }: PlateShapeThumbProps) {
  const id = templateId ?? 'custom'
  const src = getTemplatePreviewPath(id)

  return (
    <div className="flex w-[calc(3.75rem/1.25)] shrink-0 flex-col items-center gap-1">
      <div
        className="h-[calc(3rem/1.25)] w-[calc(3rem/1.25)] shrink-0 bg-primary"
        style={{
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
        aria-hidden
      />
      <span className="max-w-full truncate text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-muted">
        {getPlateShapeLabel(templateId)}
      </span>
    </div>
  )
}

