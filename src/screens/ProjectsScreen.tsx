import { MoveRight } from 'lucide-react'
import { formatKg } from '@/lib/format'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'

function formatProjectDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ProjectsScreen() {
  const firstName = useAppStore((s) => s.user.firstName)
  const projects = useAppStore((s) => s.projects)
  const openProjectRecord = useAppStore((s) => s.openProject)

  const openProject = (projectId: string) => {
    const record = openProjectRecord(projectId)
    if (!record) return

    const steps = buildWizardSteps(record.profile)
    useProfileStore.setState({
      profile: record.profile,
      selectedTemplate: record.selectedTemplate,
      currentStep: 'summary',
      wizardIndex: Math.max(0, steps.length - 1),
      activeItemId: steps[steps.length - 1]?.id ?? null,
      sketchPoints: [],
      clearWizardInput: false,
      history: [],
    })
    useProfileStore.getState().persistToSession()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-100">
          Hello, {firstName}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Your fabrication projects</p>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
          No projects yet. Tap Create to start a new profile.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => openProject(project.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-100">{project.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-300">{project.serial}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    {formatKg(project.weightKg)}
                    <span className="mx-1.5 text-zinc-600">·</span>
                    {formatProjectDate(project.updatedAt)}
                  </p>
                </div>
                <MoveRight
                  className="h-5 w-5 shrink-0 text-amber-400"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
