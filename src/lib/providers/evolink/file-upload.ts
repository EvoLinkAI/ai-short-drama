/**
 * EvoLink Files API — upload files via Base64.
 *
 * Endpoint: POST https://files-api.evolink.ai/api/v1/files/upload/base64
 * Auth:     Bearer <evolink-api-key>
 *
 * Limitations:
 * - Only supports image/jpeg, image/png, image/gif, image/webp
 * - Files expire after 72 hours
 * - Returns public file_url (no signing needed)
 */

import { createScopedLogger } from '@/lib/logging/core'

const logger = createScopedLogger({ module: 'evolink.file-upload' })

export const EVOLINK_FILES_API_BASE = 'https://files-api.evolink.ai'

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/webm',
])

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
}

export interface EvolinkFileUploadResult {
  fileId: string
  fileName: string
  fileUrl: string
  downloadUrl: string
  mimeType: string
  fileSize: number
  expiresAt: string
}

/**
 * Guess MIME type from file extension.
 */
export function guessMimeTypeFromKey(key: string): string | null {
  const ext = key.split('.').pop()?.toLowerCase()
  if (!ext) return null
  return EXT_TO_MIME[ext] ?? null
}

/**
 * Check if a MIME type is supported by EvoLink Files API.
 */
export function isEvolinkUploadSupported(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType)
}

/**
 * Check if a storage key represents an EvoLink-hosted file.
 */
export function isEvolinkFileUrl(url: string): boolean {
  return url.startsWith('https://files.evolink.ai/') || url.startsWith('https://files-api.evolink.ai/')
}

/**
 * Upload a buffer to EvoLink Files API as Base64.
 * Returns the public file URL and metadata.
 */
export async function uploadBufferToEvolinkFiles(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
  options?: { uploadPath?: string; fileName?: string },
): Promise<EvolinkFileUploadResult> {
  if (!isEvolinkUploadSupported(mimeType)) {
    throw new Error(`EVOLINK_FILES_UNSUPPORTED_TYPE: ${mimeType}`)
  }

  const base64 = buffer.toString('base64')
  const dataUrl = `data:${mimeType};base64,${base64}`

  return uploadBase64ToEvolinkFiles(dataUrl, apiKey, options)
}

/**
 * Upload a Base64 data URL to EvoLink Files API.
 */
export async function uploadBase64ToEvolinkFiles(
  base64Data: string,
  apiKey: string,
  options?: { uploadPath?: string; fileName?: string },
): Promise<EvolinkFileUploadResult> {
  if (!apiKey) {
    throw new Error('EVOLINK_FILES_API_KEY_REQUIRED')
  }

  const body: Record<string, string> = { base64_data: base64Data }
  if (options?.uploadPath) body.upload_path = options.uploadPath
  if (options?.fileName) body.file_name = options.fileName

  logger.info('[EvolinkFiles] Uploading...', {
    uploadPath: options?.uploadPath,
    fileName: options?.fileName,
  })

  const response = await fetch(`${EVOLINK_FILES_API_BASE}/api/v1/files/upload/base64`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`EVOLINK_FILES_UPLOAD_FAILED(${response.status}): ${errorText}`)
  }

  const result = await response.json() as {
    success?: boolean
    code?: number
    msg?: string
    data?: {
      file_id?: string
      file_name?: string
      file_url?: string
      download_url?: string
      mime_type?: string
      file_size?: number
      expires_at?: string
    }
  }

  if (!result.success || !result.data?.file_url) {
    throw new Error(`EVOLINK_FILES_UPLOAD_FAILED: ${result.msg || 'No file_url in response'}`)
  }

  const data = result.data

  logger.info('[EvolinkFiles] Upload OK', {
    fileId: data.file_id,
    fileUrl: data.file_url,
    mimeType: data.mime_type,
    fileSize: data.file_size,
  })

  return {
    fileId: data.file_id || '',
    fileName: data.file_name || '',
    fileUrl: data.file_url!,
    downloadUrl: data.download_url || data.file_url!,
    mimeType: data.mime_type || '',
    fileSize: data.file_size || 0,
    expiresAt: data.expires_at || '',
  }
}
