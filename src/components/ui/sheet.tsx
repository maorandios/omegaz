import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/60',
      'data-[state=open]:animate-[sheet-overlay-in_0.25s_ease-out]',
      'data-[state=closed]:animate-[sheet-overlay-out_0.2s_ease-in_forwards]',
      className,
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'top' | 'bottom' | 'right'
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'bottom', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 bg-zinc-900 p-6 shadow-2xl',
        side === 'top' &&
          'inset-x-0 top-0 rounded-b-2xl border-b border-zinc-800 pt-[max(1rem,env(safe-area-inset-top))]',
        side === 'bottom' && [
          'inset-x-0 bottom-0 rounded-t-2xl border-t border-zinc-800',
          'pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          'data-[state=open]:animate-[sheet-slide-in_0.35s_cubic-bezier(0.32,0.72,0,1)]',
          'data-[state=closed]:animate-[sheet-slide-out_0.3s_cubic-bezier(0.4,0,0.2,1)_forwards]',
        ],
        side === 'right' && 'inset-y-0 right-0 h-full w-3/4 border-l border-zinc-800 sm:max-w-sm',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-zinc-100', className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetPortal }
