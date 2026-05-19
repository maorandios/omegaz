export interface TemplateDefinition {
  id: string
  name: string
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  { id: 'l-angle', name: 'L - Angel' },
  { id: 'channel', name: 'C - Channel' },
  { id: 'zigzag', name: 'Z - ZigZag' },
  { id: 'omega', name: 'Hat' },
  { id: 'square', name: 'Square' },
  { id: 'c-profile', name: 'C - Profile' },
  { id: 'z-profile', name: 'Z - Profile' },
  { id: 'gutter', name: 'Gutter' },
  { id: 'custom', name: 'Custom Folded' },
]

const TEMPLATE_PREVIEW_PATHS: Record<string, string> = {
  omega: '/hat-shape.svg',
  channel: '/channel-shape.svg',
  gutter: '/gutter-shape.svg',
  'z-profile': '/z-shape.svg',
  zigzag: '/zigzag-shape.svg',
  'l-angle': '/angle-shape.svg',
  square: '/square-shape.svg',
  'c-profile': '/c-shape.svg',
  custom: '/custom-shape.svg',
}

export function getTemplatePreviewPath(id: string): string {
  return TEMPLATE_PREVIEW_PATHS[id] ?? `/templates/${id}.svg`
}

/** Uppercase labels shown in the plate-process top bar. */
const PLATE_SHAPE_LABELS: Record<string, string> = {
  'l-angle': 'L - ANGEL',
  channel: 'C - CHANNEL',
  zigzag: 'Z - ZIGZAG',
  omega: 'HAT',
  square: 'SQUARE',
  'c-profile': 'C - PROFILE',
  'z-profile': 'Z - PROFILE',
  gutter: 'GUTTER',
  custom: 'CUSTOM FOLDED',
}

export function getPlateShapeLabel(templateId: string | null): string {
  if (!templateId) return 'CUSTOM FOLDED'
  return PLATE_SHAPE_LABELS[templateId] ?? 'CUSTOM FOLDED'
}
