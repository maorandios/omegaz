import { MoveRight } from 'lucide-react'

interface TemplateCardProps {
  name: string
  previewSrc: string
  onClick: () => void
}

export function TemplateCard({ name, previewSrc, onClick }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-3.5 text-left transition-colors hover:border-border hover:bg-surface/55 active:scale-[0.99]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface/50 p-2.5"
        aria-hidden
      >
        <img
          src={previewSrc}
          alt=""
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
      </span>

      <p className="min-w-0 flex-1 font-medium text-foreground">{name}</p>

      <MoveRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
    </button>
  )
}
