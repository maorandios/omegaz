import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { LegalDocument } from '@/lib/legalContent'

interface LegalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: LegalDocument
}

export function LegalDialog({ open, onOpenChange, doc }: LegalDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-[sheet-overlay-in_0.2s_ease-out] data-[state=closed]:animate-[sheet-overlay-out_0.18s_ease-in_forwards]"
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="legal-dialog fixed left-1/2 top-1/2 z-50 flex w-[min(100vw-1.5rem,32rem)] max-h-[min(100dvh-2rem,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-2xl focus:outline-none data-[state=open]:animate-[legal-dialog-in_0.22s_cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:animate-[legal-dialog-out_0.18s_cubic-bezier(0.4,0,0.2,1)_forwards]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border bg-surface-raised/50 px-5 py-4">
            <div className="flex flex-col">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {doc.shortTitle}
              </DialogPrimitive.Title>
              <p className="mt-0.5 text-xs text-muted">Last updated: {doc.lastUpdated}</p>
            </div>
            <DialogPrimitive.Close
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </header>

          <div className="legal-dialog__body flex-1 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-foreground/90">
            <h2 className="text-base font-semibold text-foreground">{doc.title}</h2>

            {doc.intro.map((p, i) => (
              <p key={`intro-${i}`} className="mt-3 text-muted">
                {p}
              </p>
            ))}

            <div className="mt-5 space-y-6">
              {doc.sections.map((section) => (
                <section key={section.heading} className="space-y-2">
                  <h3 className="text-sm font-semibold text-primary">{section.heading}</h3>

                  {section.body.map((paragraph, i) => (
                    <p key={`p-${i}`} className="text-muted">
                      {paragraph}
                    </p>
                  ))}

                  {section.items && section.items.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {section.items.map((item, i) => (
                        <li
                          key={`item-${i}`}
                          className="flex gap-2 text-muted"
                        >
                          <span aria-hidden className="mt-2 block h-1 w-1 shrink-0 rounded-full bg-primary" />
                          <span>
                            {item.label ? (
                              <span className="font-medium text-foreground">{item.label}: </span>
                            ) : null}
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            {doc.footer?.map((p, i) => (
              <p key={`footer-${i}`} className="mt-5 text-xs text-muted">
                {p}
              </p>
            ))}
          </div>

          <footer className="border-t border-border bg-surface-raised/40 px-5 py-3">
            <DialogPrimitive.Close className="flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Close
            </DialogPrimitive.Close>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
