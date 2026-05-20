import type { AppStep } from '@/geometry/types'
import type { StackDirection } from '@/components/shell/ScreenStack'

export function rootStackDirection(_fromKey: string, toKey: string): StackDirection {
  return toKey === 'workflow' ? 'forward' : 'back'
}

export function projectsStackDirection(_fromKey: string, toKey: string): StackDirection {
  return toKey === 'detail' ? 'forward' : 'back'
}

const WORKFLOW_STEP_ORDER: AppStep[] = [
  'sketch',
  'segment-wizard',
  'fabrication',
  'summary',
  'export',
]

export function workflowStackDirection(fromKey: string, toKey: string): StackDirection {
  const fromIndex = WORKFLOW_STEP_ORDER.indexOf(fromKey as AppStep)
  const toIndex = WORKFLOW_STEP_ORDER.indexOf(toKey as AppStep)
  if (fromIndex === -1 || toIndex === -1) return 'forward'
  return toIndex > fromIndex ? 'forward' : 'back'
}
