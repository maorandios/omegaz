export interface TemplateDefinition {
  id: string
  name: string
  description: string
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  { id: 'omega', name: 'Omega', description: 'Ω-shaped ceiling batten profile' },
  { id: 'channel', name: 'Channel', description: 'C-channel section' },
  { id: 'gutter', name: 'Gutter', description: 'Rain gutter profile' },
  { id: 'z-profile', name: 'Z Profile', description: 'Z-shaped purlin' },
  { id: 'l-angle', name: 'L Angle', description: '90° angle bracket' },
  { id: 'u-profile', name: 'U Profile', description: 'U-channel section' },
  { id: 'square', name: 'Square', description: 'Square tube outline' },
  { id: 'custom', name: 'Custom Folded', description: 'Start with two legs' },
]

export function getTemplatePreviewPath(id: string): string {
  return `/templates/${id}.svg`
}

/** Uppercase labels shown in the plate-process top bar. */
const PLATE_SHAPE_LABELS: Record<string, string> = {
  'l-angle': 'ANGLE',
  'z-profile': 'Z SHAPE',
  channel: 'CHANNEL',
  square: 'SQUARE',
  omega: 'OMEGA',
  gutter: 'GUTTER',
  custom: 'CUSTOM SHAPE',
  'u-profile': 'U PROFILE',
}

export function getPlateShapeLabel(templateId: string | null): string {
  if (!templateId) return 'CUSTOM SHAPE'
  return PLATE_SHAPE_LABELS[templateId] ?? 'CUSTOM SHAPE'
}
