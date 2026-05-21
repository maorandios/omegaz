import { downloadBlob } from '@/lib/downloadBlob'
import { openEmailShare, openWhatsAppShare } from '@/lib/projectShare'

export type ShareChannel = 'whatsapp' | 'email'

export interface SharePayload {
  title: string
  text: string
  mailtoSubject: string
  mailtoBody: string
}

const MAX_NATIVE_FILE_SHARE_BYTES = 25 * 1024 * 1024

function isMobileShareEnvironment(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isZipPackage(filename: string, mimeType: string): boolean {
  return mimeType === 'application/zip' || filename.endsWith('.zip')
}

/**
 * Desktop Chrome/Edge often return true from canShare(files) but fail with
 * "Permission denied" for ZIPs (WhatsApp desktop has no file share target).
 */
function canShareFileReliably(file: File, filename: string): boolean {
  if (!navigator.canShare?.({ files: [file] })) return false
  if (file.size > MAX_NATIVE_FILE_SHARE_BYTES) return false
  if (isZipPackage(filename, file.type) && !isMobileShareEnvironment()) return false
  return true
}

function isShareCancelled(err: unknown): boolean {
  if (!(err instanceof DOMException) && !(err instanceof Error)) return false
  return err.name === 'AbortError'
}

function shareFallback(
  blob: Blob,
  filename: string,
  payload: SharePayload,
  channel: ShareChannel,
): void {
  downloadBlob(blob, filename)

  if (channel === 'whatsapp') {
    openWhatsAppShare(
      `${payload.text}\n\n(File saved to your device — attach "${filename}" in WhatsApp.)`,
    )
  } else {
    openEmailShare(
      payload.mailtoSubject,
      `${payload.mailtoBody}\n\n(File saved to your device — attach "${filename}" to this email.)`,
    )
  }
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

  if (!canShareFileReliably(file, filename)) {
    shareFallback(blob, filename, payload, channel)
    return
  }

  try {
    await navigator.share({
      files: [file],
      title: payload.title,
      text: payload.text,
    })
  } catch (err) {
    if (isShareCancelled(err)) return
    shareFallback(blob, filename, payload, channel)
  }
}
