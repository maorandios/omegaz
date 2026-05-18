import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { formatInteriorBendDeg, formatMm } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/store/profileStore'

interface SegmentBendTableProps {
  profile: FoldedProfile
}

export function SegmentBendTable({ profile }: SegmentBendTableProps) {
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const setActiveFromTableRow = useProfileStore((s) => s.setActiveFromTableRow)

  const steps = buildWizardSteps(profile)
  let segNum = 0
  let bendNum = 0

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80 text-left text-zinc-400">
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => {
            if (step.type === 'segment') {
              segNum++
              const seg = profile.segments.find((s) => s.id === step.id)!
              const label = `Segment ${segNum}`
              const value = formatMm(seg.length)
              return (
                <tr
                  key={step.id}
                  className={cn(
                    'cursor-pointer border-b border-zinc-800/80 transition-colors',
                    activeItemId === step.id ? 'bg-amber-500/15' : 'hover:bg-zinc-800/50',
                  )}
                  onClick={() => setActiveFromTableRow('segment', step.id)}
                >
                  <td className="px-3 py-3 font-medium">{label}</td>
                  <td className="px-3 py-3 text-zinc-300">{value}</td>
                </tr>
              )
            }
            bendNum++
            const bend = profile.bends.find((b) => b.id === step.id)!
            return (
              <tr
                key={step.id}
                className={cn(
                  'cursor-pointer border-b border-zinc-800/80 transition-colors',
                  activeItemId === step.id ? 'bg-amber-500/15' : 'hover:bg-zinc-800/50',
                )}
                onClick={() => setActiveFromTableRow('bend', step.id)}
              >
                <td className="px-3 py-3 font-medium">Bend {bendNum}</td>
                <td className="px-3 py-3 text-zinc-300">{formatInteriorBendDeg(bend)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
