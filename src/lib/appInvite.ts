import { openWhatsAppShare } from '@/lib/projectShare'

export function getAppUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://folds.app'
}

export function buildAppInviteMessage(): string {
  const url = getAppUrl()
  return [
    'Try FOLDS — guided fabrication requests for folded metal profiles.',
    '',
    url,
  ].join('\n')
}

/** Opens WhatsApp with a pre-filled invite so the user can pick a contact. */
export function openAppInviteWhatsApp(): void {
  openWhatsAppShare(buildAppInviteMessage())
}
