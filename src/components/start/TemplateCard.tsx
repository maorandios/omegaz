import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TemplateCardProps {
  name: string
  previewSrc: string
  onClick: () => void
}

export function TemplateCard({ name, previewSrc, onClick }: TemplateCardProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="cursor-pointer transition-colors hover:border-primary/50 active:scale-[0.98]">
        <CardHeader className="items-center pb-2 pt-4">
          <div className="flex h-16 w-full items-center justify-center rounded-lg bg-slate-50 p-2">
            <img src={previewSrc} alt="" className="h-12 w-auto max-w-full object-contain" />
          </div>
          <CardTitle className="text-center text-sm">{name}</CardTitle>
        </CardHeader>
        <CardContent className="sr-only">Use {name} template</CardContent>
      </Card>
    </button>
  )
}
