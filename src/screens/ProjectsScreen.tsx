import { useMemo, useState } from 'react'
import { ProjectDetailView } from '@/components/projects/ProjectDetailView'
import { ProjectListRow } from '@/components/projects/ProjectListRow'
import { ProjectsFilterBar } from '@/components/projects/ProjectsFilterBar'
import { ScreenStack } from '@/components/shell/ScreenStack'
import { filterProjects } from '@/lib/filterProjects'
import { projectsStackDirection } from '@/lib/stackNavigation'
import { useAppStore } from '@/store/appStore'

function ProjectsListView() {
  const user = useAppStore((s) => s.user)
  const projects = useAppStore((s) => s.projects)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)

  const [query, setQuery] = useState('')
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([])

  const filteredProjects = useMemo(
    () => filterProjects(projects, { query, shapeIds: selectedShapeIds }),
    [projects, query, selectedShapeIds],
  )

  const filtersActive = query.trim().length > 0 || selectedShapeIds.length > 0

  const toggleShape = (shapeId: string) => {
    setSelectedShapeIds((prev) =>
      prev.includes(shapeId) ? prev.filter((id) => id !== shapeId) : [...prev, shapeId],
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-[1.2rem] font-semibold leading-tight text-foreground">
          Hello, {user.fullName.trim() || 'there'}
        </h2>
        {projects.length > 0 ? (
          <ProjectsFilterBar
            query={query}
            onQueryChange={setQuery}
            selectedShapeIds={selectedShapeIds}
            onToggleShape={toggleShape}
            onClearShapes={() => setSelectedShapeIds([])}
          />
        ) : null}
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No projects yet. Go to Create, name a project, and add your first plate.
        </p>
      ) : filteredProjects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          {filtersActive
            ? 'No projects match your search or shape filter.'
            : 'No projects yet. Go to Create, name a project, and add your first plate.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredProjects.map((project) => (
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
