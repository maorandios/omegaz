import { useState } from 'react'
import { LegalDialog } from '@/components/auth/LegalDialog'
import { PRIVACY_DOC, TERMS_DOC } from '@/lib/legalContent'

type DocId = 'terms' | 'privacy' | null

export function LegalLinks() {
  const [openDoc, setOpenDoc] = useState<DocId>(null)

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
      <button
        type="button"
        className="font-medium underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:text-foreground focus-visible:underline"
        onClick={() => setOpenDoc('terms')}
      >
        Terms &amp; Conditions
      </button>
      <span aria-hidden className="text-border">
        •
      </span>
      <button
        type="button"
        className="font-medium underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:text-foreground focus-visible:underline"
        onClick={() => setOpenDoc('privacy')}
      >
        Privacy Policy
      </button>

      <LegalDialog
        doc={TERMS_DOC}
        open={openDoc === 'terms'}
        onOpenChange={(open) => setOpenDoc(open ? 'terms' : null)}
      />
      <LegalDialog
        doc={PRIVACY_DOC}
        open={openDoc === 'privacy'}
        onOpenChange={(open) => setOpenDoc(open ? 'privacy' : null)}
      />
    </div>
  )
}
