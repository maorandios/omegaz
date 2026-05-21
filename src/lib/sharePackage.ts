import { downloadBlob } from '@/lib/downloadBlob'
import { openEmailShare, openWhatsAppShare } from '@/lib/projectShare'

export type ShareChannel = 'whatsapp' | 'email'

export interface SharePayload {
  title: string
  text: string
  mailtoSubject: string
  mailtoBody: string
}

export async function sharePackageFile(
  blob: Blob,
  filename: string,
  payload: SharePayload,
  channel: ShareChannel,
): Promise<void> {
  const mimeType =
    filename.endsWith('.pdf') ? 'application/pdf' : 'application/zip'
  const file = new File([blob], filename, { type: mimeType })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: payload.title,
      text: payload.text,
    })
    return
  }

  downloadBlob(blob, filename)

  if (channel === 'whatsapp') {
    openWhatsAppShare(
      `${payload.text}\n\n(File saved to your device — attach it in WhatsApp if needed.)`,
    )
  } else {
    openEmailShare(
      payload.mailtoSubject,
      `${payload.mailtoBody}\n\n(File saved to your device — attach it to this email.)`,
    )
  }
}
