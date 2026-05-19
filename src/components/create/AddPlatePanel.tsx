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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Adding to <span className="font-medium text-foreground">{project.name}</span>
        <span className="font-mono text-muted"> ({project.serial})</span>
      </p>

      <div className="flex flex-col gap-2">
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
