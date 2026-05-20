import { ProjectDetailView } from '@/components/projects/ProjectDetailView'
import { ProjectListRow } from '@/components/projects/ProjectListRow'
import { ScreenStack } from '@/components/shell/ScreenStack'
import { projectsStackDirection } from '@/lib/stackNavigation'
import { useAppStore } from '@/store/appStore'

function ProjectsListView() {
  const user = useAppStore((s) => s.user)
  const projects = useAppStore((s) => s.projects)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[1.2rem] font-semibold leading-tight text-foreground">
          Hello, {user.fullName.trim() || 'there'}
        </h2>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No projects yet. Go to Create, name a project, and add your first plate.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectListRow
                project={project}
                showDate
                onClick={() => setSelectedProject(project.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ProjectsScreen() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)

  return (
    <ScreenStack
      activeKey={selectedProjectId ? 'detail' : 'list'}
      getDirection={projectsStackDirection}
      className="w-full"
      screens={{
        list: <ProjectsListView />,
        detail: <ProjectDetailView />,
      }}
    />
  )
}
