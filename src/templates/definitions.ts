export interface TemplateDefinition {
  id: string
  name: string
}

/** Pre-shaped real-world trims — user just fills in the millimeters. */
export const STANDARD_TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  { id: 'apron', name: 'Apron Flashing' },
  { id: 'wall-abutment', name: 'Wall Abutment' },
  { id: 'valley-flashing', name: 'Valley Flashing' },
  { id: 'ridge-cap', name: 'Ridge Cap' },
  { id: 'barge-verge', name: 'Barge / Verge Board' },
  { id: 'drip-edge-tray', name: 'Drip Edge / Tray' },
  { id: 'eaves-flashing', name: 'Eaves flashing' },
  { id: 'external-corner', name: 'External Corner Trim' },
]

/** Generic shape primitives the user customizes from scratch. */
export const CORE_TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  { id: 'l-angle', name: 'L - Angel' },
  { id: 'channel', name: 'C - Channel' },
  { id: 'zigzag', name: 'Z - Zed' },
  { id: 'omega', name: 'Hat' },
  { id: 'square', name: 'Square' },
  { id: 'c-profile', name: 'C - Profile' },
  { id: 'z-profile', name: 'Z - Profile' },
  { id: 'gutter', name: 'Gutter' },
]

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  ...STANDARD_TEMPLATE_DEFINITIONS,
  ...CORE_TEMPLATE_DEFINITIONS,
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
  apron: '/apron-shape.svg',
  'wall-abutment': '/wall-abutment-shape.svg',
  'valley-flashing': '/valley-flashing-shape.svg',
  'ridge-cap': '/ridge-cap-shape.svg',
  'barge-verge': '/barge-verge-shape.svg',
  'drip-edge-tray': '/drip-edge-tray-shape.svg',
  'eaves-flashing': '/eaves-flashing-shape.svg',
  'external-corner': '/external-corner-shape.svg',
  custom: '/custom-shape.svg',
}

export function getTemplatePreviewPath(id: string): string {
  return TEMPLATE_PREVIEW_PATHS[id] ?? `/templates/${id}.svg`
}

/** Uppercase labels shown in the plate-process top bar. */
const PLATE_SHAPE_LABELS: Record<string, string> = {
  'l-angle': 'L - ANGEL',
  channel: 'C - CHANNEL',
  zigzag: 'Z - ZED',
  omega: 'HAT',
  square: 'SQUARE',
  'c-profile': 'C - PROFILE',
  'z-profile': 'Z - PROFILE',
  gutter: 'GUTTER',
  apron: 'APRON FLASHING',
  'wall-abutment': 'WALL ABUTMENT',
  'valley-flashing': 'VALLEY FLASHING',
  'ridge-cap': 'RIDGE CAP',
  'barge-verge': 'BARGE / VERGE BOARD',
  'drip-edge-tray': 'DRIP EDGE / TRAY',
  'eaves-flashing': 'EAVES FLASHING',
  'external-corner': 'EXTERNAL CORNER TRIM',
  custom: 'CUSTOM FOLDED',
}

export function getPlateShapeLabel(templateId: string | null): string {
  if (!templateId) return 'CUSTOM FOLDED'
  return PLATE_SHAPE_LABELS[templateId] ?? 'CUSTOM FOLDED'
}

/** Friendly mixed-case name (e.g. "Hat", "C - Profile") for share text / PDFs. */
export function getTemplateDisplayName(templateId: string | null): string {
  if (!templateId) return 'Custom Folded'
  return TEMPLATE_DEFINITIONS.find((t) => t.id === templateId)?.name ?? 'Custom Folded'
}
