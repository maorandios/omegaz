import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface RenameProjectSheetProps {
  open: boolean
  currentName: string
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => void
}

export function RenameProjectSheet({
  open,
  currentName,
  onOpenChange,
  onConfirm,
}: RenameProjectSheetProps) {
  const [value, setValue] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset the field to the latest stored name every time the sheet opens so
  // the user always sees the current value, not a stale local edit.
  useEffect(() => {
    if (open) {
      setValue(currentName)
      const id = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(id)
    }
  }, [open, currentName])

  const trimmed = value.trim()
  const canSave = trimmed.length > 0 && trimmed !== currentName

  const handleSave = () => {
    if (!canSave) return
    onConfirm(trimmed)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg border-border bg-background">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Rename project</SheetTitle>
        </SheetHeader>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
        >
          <Input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Project name"
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            aria-label="Project name"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-2xl text-base font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1 rounded-2xl text-base font-semibold"
              disabled={!canSave}
            >
              Save
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
