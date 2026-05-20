import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface ActionsSheetLayoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleIcon: LucideIcon
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function ActionsSheetLayout({
  open,
  onOpenChange,
  titleIcon: TitleIcon,
  title,
  children,
  footer,
}: ActionsSheetLayoutProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="bg-black/40 backdrop-blur-md"
        className="mx-auto max-w-lg gap-0 border-border bg-background p-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="px-6 pt-4">
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2">
              <TitleIcon className="h-5 w-5 shrink-0 stroke-[1.75px] text-primary" aria-hidden />
              <SheetTitle className="mb-0">{title}</SheetTitle>
            </div>
          </SheetHeader>
        </div>

        {children}

        {footer}
      </SheetContent>
    </Sheet>
  )
}
