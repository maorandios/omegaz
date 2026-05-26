import { MoveRight, Spline } from 'lucide-react'
import { TemplateCard } from '@/components/start/TemplateCard'
import { getTemplatePreviewPath, TEMPLATE_DEFINITIONS } from '@/templates/definitions'
import { useProfileStore } from '@/store/profileStore'
import type { ProjectRecord } from '@/store/projectTypes'

interface AddPlatePanelProps {
  project: ProjectRecord
  onTemplatePicked?: () => void
}

export function AddPlatePanel({ project, onTemplatePicked }: AddPlatePanelProps) {
  const loadTemplate = useProfileStore((s) => s.loadTemplate)
  const startDrawShape = useProfileStore((s) => s.startDrawShape)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Adding to <span className="font-medium text-foreground">{project.name}</span>
        <span className="font-mono text-muted"> ({project.serial})</span>
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            onTemplatePicked?.()
            startDrawShape()
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 px-4 py-3.5 text-left transition-colors hover:bg-primary/15 active:scale-[0.99]"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background"
            aria-hidden
          >
            <Spline className="h-5 w-5 stroke-[1.75px] text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-foreground">Draw shape</span>
            <span className="block text-xs text-muted">
              Tap on a grid to sketch a custom profile
            </span>
          </span>
          <MoveRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        </button>

        {TEMPLATE_DEFINITIONS.map((t) => (
          <TemplateCard
            key={t.id}
            name={t.name}
            previewSrc={getTemplatePreviewPath(t.id)}
            onClick={() => {
              onTemplatePicked?.()
              loadTemplate(t.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}
