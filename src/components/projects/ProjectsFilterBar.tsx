import { CircleX, Search } from 'lucide-react'
import { useState } from 'react'
import { ShapeFilterSheet } from '@/components/projects/ShapeFilterSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ProjectsFilterBarProps {
  query: string
  onQueryChange: (query: string) => void
  selectedShapeIds: string[]
  onToggleShape: (shapeId: string) => void
  onClearShapes: () => void
}

export function ProjectsFilterBar({
  query,
  onQueryChange,
  selectedShapeIds,
  onToggleShape,
  onClearShapes,
}: ProjectsFilterBarProps) {
  const [shapeSheetOpen, setShapeSheetOpen] = useState(false)
  const shapeFilterActive = selectedShapeIds.length > 0

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search projects"
            className="h-12 pl-11 pr-11"
            aria-label="Search projects"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface/55 hover:text-foreground"
              aria-label="Clear search"
            >
              <CircleX className="h-5 w-5 stroke-[1.75px]" aria-hidden />
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-12 shrink-0 rounded-2xl border-border bg-surface/40 px-4',
            shapeFilterActive && 'border-primary text-primary',
          )}
          onClick={() => setShapeSheetOpen(true)}
          aria-label={
            shapeFilterActive
              ? `Filter by shape, ${selectedShapeIds.length} selected`
              : 'Filter by shape'
          }
        >
          By shape
          {shapeFilterActive ? (
            <span className="ml-1 font-mono text-xs tabular-nums">{selectedShapeIds.length}</span>
          ) : null}
        </Button>
      </div>

      <ShapeFilterSheet
        open={shapeSheetOpen}
        onOpenChange={setShapeSheetOpen}
        selectedShapeIds={selectedShapeIds}
        onToggleShape={onToggleShape}
        onClear={onClearShapes}
      />
    </>
  )
}
