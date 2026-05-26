import { MoveLeft, MoveRight, Shapes, Sparkles, Spline } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { TemplateCard } from '@/components/start/TemplateCard'
import {
  CORE_TEMPLATE_DEFINITIONS,
  STANDARD_TEMPLATE_DEFINITIONS,
  getTemplatePreviewPath,
} from '@/templates/definitions'
import { useProfileStore } from '@/store/profileStore'
import type { ProjectRecord } from '@/store/projectTypes'

type CategoryId = 'standard' | 'core' | 'bespoke'
type View = 'categories' | 'standard' | 'core'

interface CategoryCardProps {
  icon: ComponentType<{ className?: string }>
  title: string
  subtitle: string
  onClick: () => void
}

function CategoryCard({ icon: Icon, title, subtitle, onClick }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-3.5 text-left transition-colors hover:border-border hover:bg-surface/55 active:scale-[0.99]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface/50"
        aria-hidden
      >
        <Icon className="h-5 w-5 stroke-[1.75px] text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted">{subtitle}</span>
      </span>
      <MoveRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
    </button>
  )
}

interface AddPlatePanelProps {
  project: ProjectRecord
  onTemplatePicked?: () => void
}

export function AddPlatePanel({ project, onTemplatePicked }: AddPlatePanelProps) {
  const loadTemplate = useProfileStore((s) => s.loadTemplate)
  const startDrawShape = useProfileStore((s) => s.startDrawShape)
  const [view, setView] = useState<View>('categories')

  const handleCategoryClick = (id: CategoryId) => {
    if (id === 'bespoke') {
      onTemplatePicked?.()
      startDrawShape()
      return
    }
    setView(id)
  }

  const backToCategories = () => setView('categories')

  const projectHeader = (
    <p className="text-sm text-muted">
      Adding to <span className="font-medium text-foreground">{project.name}</span>
      <span className="font-mono text-muted"> ({project.serial})</span>
    </p>
  )

  if (view === 'categories') {
    return (
      <div className="space-y-4">
        {projectHeader}
        <div className="flex flex-col gap-2">
          <CategoryCard
            icon={Sparkles}
            title="Standard Profiles"
            subtitle="Quick-launch standard trims. Just input your millimeters"
            onClick={() => handleCategoryClick('standard')}
          />
          <CategoryCard
            icon={Shapes}
            title="Core Shapes"
            subtitle="Start from a raw L, U, or Z profile and add custom dimensions"
            onClick={() => handleCategoryClick('core')}
          />
          <CategoryCard
            icon={Spline}
            title="Bespoke Sketchpad"
            subtitle="Tap the grid to sketch a unique, complex profile from scratch"
            onClick={() => handleCategoryClick('bespoke')}
          />
        </div>
      </div>
    )
  }

  if (view === 'core') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={backToCategories}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface/55"
            aria-label="Back to categories"
          >
            <MoveLeft className="h-5 w-5 stroke-[1.75px]" aria-hidden />
          </button>
          <h3 className="text-base font-semibold text-foreground">Core Shapes</h3>
        </div>
        {projectHeader}
        <div className="flex flex-col gap-2">
          {CORE_TEMPLATE_DEFINITIONS.map((t) => (
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

  // view === 'standard'
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={backToCategories}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface/55"
          aria-label="Back to categories"
        >
          <MoveLeft className="h-5 w-5 stroke-[1.75px]" aria-hidden />
        </button>
        <h3 className="text-base font-semibold text-foreground">Standard Profiles</h3>
      </div>
      {projectHeader}
      <div className="flex flex-col gap-2">
        {STANDARD_TEMPLATE_DEFINITIONS.map((t) => (
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
