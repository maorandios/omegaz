import { Box, List, MoveLeft, Zap } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AddPlatePanel } from '@/components/create/AddPlatePanel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ProjectListRow } from '@/components/projects/ProjectListRow'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

function SheetModeButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors',
        'hover:bg-surface/55',
      )}
    >
      {children}
    </button>
  )
}

function SheetTitleRow({
  title,
  showBack,
  onBack,
}: {
  title: string
  showBack?: boolean
  onBack?: () => void
}) {
  return (
    <SheetHeader className="text-left">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface/55"
            aria-label="Back"
          >
            <MoveLeft className="h-5 w-5 stroke-[1.75px]" aria-hidden />
          </button>
        ) : (
          <Zap className="h-5 w-5 shrink-0 stroke-[1.75px] text-primary" aria-hidden />
        )}
        <SheetTitle className="mb-0">{title}</SheetTitle>
      </div>
    </SheetHeader>
  )
}

export function CreatePlateSheet() {
  const open = useAppStore((s) => s.createPlateSheetOpen)
  const step = useAppStore((s) => s.createPlateSheetStep)
  const closeCreatePlateSheet = useAppStore((s) => s.closeCreatePlateSheet)
  const setCreatePlateSheetStep = useAppStore((s) => s.setCreatePlateSheetStep)
  const projects = useAppStore((s) => s.projects)
  const createProject = useAppStore((s) => s.createProject)
  const setActiveProject = useAppStore((s) => s.setActiveProject)
  const activeProject = useAppStore((s) => s.getActiveProject())

  const [projectName, setProjectName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && step === 'new') {
      setProjectName('')
      const t = window.setTimeout(() => nameInputRef.current?.focus(), 150)
      return () => window.clearTimeout(t)
    }
  }, [open, step])

  const handleOpenChange = (next: boolean) => {
    if (!next) closeCreatePlateSheet()
  }

  const goToTemplates = () => setCreatePlateSheetStep('templates')

  const handleCreateProject = () => {
    const id = createProject(projectName)
    if (id) {
      setProjectName('')
      goToTemplates()
    }
  }

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId)
    goToTemplates()
  }

  const handlePlateFlowStart = () => closeCreatePlateSheet()

  const showBack = step === 'new' || step === 'existing'
  const scrollTitleWithContent = step === 'templates'

  const title =
    step === 'choose'
      ? 'New plate'
      : step === 'new'
        ? 'New project'
        : step === 'existing'
          ? 'Add to existing'
          : 'Add plate'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="bg-black/40 backdrop-blur-md"
        className="mx-auto max-h-[min(92dvh,720px)] max-w-lg gap-0 overflow-hidden border-border bg-background p-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex max-h-[min(92dvh,720px)] flex-col">
          {!scrollTitleWithContent ? (
            <div className="shrink-0 px-6 pt-4">
              <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
              <SheetTitleRow
                title={title}
                showBack={showBack}
                onBack={() => setCreatePlateSheetStep('choose')}
              />
            </div>
          ) : null}

          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto pb-4',
              scrollTitleWithContent ? 'px-6 pt-4' : 'px-4 pt-4',
            )}
          >
            {scrollTitleWithContent ? (
              <>
                <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
                <div className="mb-4">
                  <SheetTitleRow title={title} />
                </div>
              </>
            ) : null}

            {step === 'choose' && (
              <div className="space-y-2">
                <SheetModeButton onClick={() => setCreatePlateSheetStep('new')}>
                  <Box className="h-5 w-5 shrink-0 stroke-[1.75px] text-primary" aria-hidden />
                  Create new project
                </SheetModeButton>
                <SheetModeButton onClick={() => setCreatePlateSheetStep('existing')}>
                  <List className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  Add to existing project
                </SheetModeButton>
              </div>
            )}

            {step === 'new' && (
              <div className="space-y-3">
                <div className="space-y-3">
                  <Label htmlFor="create-sheet-project-name" className="text-muted">
                    Project name
                  </Label>
                  <Input
                    ref={nameInputRef}
                    id="create-sheet-project-name"
                    placeholder="e.g. Warehouse Phase 2"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && projectName.trim()) handleCreateProject()
                    }}
                    className="h-auto rounded-2xl border-border bg-surface/40 py-3.5 text-sm font-normal text-foreground placeholder:text-muted"
                  />
                </div>

                <button
                  type="button"
                  disabled={!projectName.trim()}
                  onClick={handleCreateProject}
                  className={cn(
                    'flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-colors',
                    'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
                    'disabled:pointer-events-none disabled:border-border disabled:bg-surface/40 disabled:text-muted',
                  )}
                >
                  <Box className="h-5 w-5 shrink-0 stroke-[1.75px]" aria-hidden />
                  Create project
                </button>
              </div>
            )}

            {step === 'existing' && (
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">
                    No projects yet. Create a new project first.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {projects.map((project) => (
                      <li key={project.id}>
                        <ProjectListRow
                          project={project}
                          onClick={() => handleSelectProject(project.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 'templates' && activeProject && (
              <AddPlatePanel project={activeProject} onTemplatePicked={handlePlateFlowStart} />
            )}

            {step === 'templates' && !activeProject && (
              <p className="py-6 text-center text-sm text-muted">Select or create a project first.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
