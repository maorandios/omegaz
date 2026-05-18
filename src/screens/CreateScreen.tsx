import { LayoutTemplate, Pencil } from 'lucide-react'
import { FlowCard } from '@/components/start/FlowCard'
import { TemplateCard } from '@/components/start/TemplateCard'
import { Separator } from '@/components/ui/separator'
import { getTemplatePreviewPath, TEMPLATE_DEFINITIONS } from '@/templates/definitions'
import { useProfileStore } from '@/store/profileStore'

export function CreateScreen() {
  const setStep = useProfileStore((s) => s.setStep)
  const loadTemplate = useProfileStore((s) => s.loadTemplate)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Create a profile</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Choose a template or sketch freehand — then enter dimensions step by step.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FlowCard
          title="Start from Template"
          description="Pre-built folded profiles with guided dimensions"
          icon={<LayoutTemplate className="h-6 w-6" />}
          onClick={() => {
            document.getElementById('templates-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />
        <FlowCard
          title="Freehand Sketch"
          description="Draw a rough outline, then clean into segments"
          icon={<Pencil className="h-6 w-6" />}
          onClick={() => setStep('sketch')}
        />
      </div>

      <Separator />

      <section id="templates-section" className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Templates</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TEMPLATE_DEFINITIONS.map((t) => (
            <TemplateCard
              key={t.id}
              name={t.name}
              previewSrc={getTemplatePreviewPath(t.id)}
              onClick={() => loadTemplate(t.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
