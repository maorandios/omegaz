export interface TemplateDefinition {
  id: string
  name: string
  description: string
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  { id: 'omega', name: 'Omega', description: 'Ω-shaped ceiling batten profile' },
  { id: 'channel', name: 'Channel', description: 'C-channel section' },
  { id: 'gutter', name: 'Gutter', description: 'Rain gutter profile' },
  { id: 'z-profile', name: 'Z Profile', description: 'Z purlin with return lips' },
  { id: 'l-angle', name: 'L Angle', description: '90° angle bracket' },
  { id: 'square', name: 'Square', description: 'Square tube outline' },
  { id: 'c-profile', name: 'C Profile', description: 'C-channel with return lips' },
  { id: 'custom', name: 'Custom Folded', description: 'L-shape start, add up to 10 legs' },
]

export function getTemplatePreviewPath(id: string): string {
  return `/templates/${id}.svg`
}

/** Uppercase labels shown in the plate-process top bar. */
const PLATE_SHAPE_LABELS: Record<string, string> = {
  'l-angle': 'ANGLE',
  'z-profile': 'Z PROFILE',
  channel: 'CHANNEL',
  square: 'SQUARE',
  omega: 'OMEGA',
  gutter: 'GUTTER',
  'c-profile': 'C PROFILE',
  custom: 'CUSTOM SHAPE',
}

export function getPlateShapeLabel(templateId: string | null): string {
  if (!templateId) return 'CUSTOM SHAPE'
  return PLATE_SHAPE_LABELS[templateId] ?? 'CUSTOM SHAPE'
}
