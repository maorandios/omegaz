import { ChevronRight } from 'lucide-react'

interface TemplateCardProps {
  name: string
  description?: string
  previewSrc: string
  onClick: () => void
}

export function TemplateCard({ name, description, previewSrc, onClick }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-transparent px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-surface/30 active:scale-[0.99]"
    >
      <span className="flex h-[calc(3rem/1.25)] w-[calc(3rem/1.25)] shrink-0 items-center justify-center">
        <img
          src={previewSrc}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{name}</p>
        {description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{description}</p>
        ) : null}
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
    </button>
  )
}
