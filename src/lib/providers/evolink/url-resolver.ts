import { extractStorageKey, getSignedObjectUrl, uploadObject, generateUniqueKey } from '@/lib/storage'
import { normalizeToOriginalMediaUrl } from '@/lib/media/outbound-image'
import { toFetchableUrl } from '@/lib/storage/utils'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'video/mp4': 'mp4',
}

/**
 * Detect private/internal network URLs that must not be forwarded to external APIs.
 * Covers: loopback, Docker Compose service hostnames, RFC-1918 ranges.
 */
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    // Loopback
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return true
    // Docker Compose internal service names
    if (host === 'minio' || host === 'redis' || host === 'mysql' || host === 'app') return true
    // RFC-1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    const parts = host.split('.')
    if (parts[0] === '10') return true
    if (parts[0] === '172' && Number(parts[1]) >= 16 && Number(parts[1]) <= 31) return true
    if (parts[0] === '192' && parts[1] === '168') return true
    return false
  } catch {
    return false
  }
}

/**
 * Convert internal storage paths / data URLs to externally-accessible URLs
 * for EvoLink API consumption.
 *
 * - Images uploaded via EvoLink storage → public EvoLink Files URL
 * - Audio/video stored locally → absolute internal URL (requires INTERNAL_APP_URL reachable from EvoLink)
 * - Already public HTTPS → returned as-is
 *
 * Returns null if the input cannot be resolved.
 */
export async function resolveToExternalUrl(input: string): Promise<string | null> {
  // Already a public URL — guard against forwarding internal/private network URLs to EvoLink
  if (input.startsWith('https://') && !isPrivateUrl(input)) {
    return input
  }

  // data URL → upload to storage → return URL
  if (input.startsWith('data:')) {
    try {
      const match = input.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) return null
      const mimeType = match[1]
      const ext = MIME_TO_EXT[mimeType] || mimeType.split('/').pop() || 'bin'
      const buffer = Buffer.from(match[2], 'base64')
      const tmpKey = generateUniqueKey('tmp/evolink', ext)
      // TODO: These temp objects are never explicitly deleted.
      // - EvoLink storage: auto-expires in 72h (acceptable, Files API TTL).
      // - Local/MinIO fallback: accumulates indefinitely — add a periodic cleanup job
      //   (e.g., delete tmp/evolink/* older than 24h) if local fallback is in use.
      const storedKey = await uploadObject(buffer, tmpKey)
      return toPublicUrl(storedKey)
    } catch {
      return null
    }
  }

  // Try to extract storage key → resolve to URL
  const key = extractStorageKey(input)
  if (key) {
    return toPublicUrl(key)
  }

  // Try to normalize via media service
  try {
    const resolved = await normalizeToOriginalMediaUrl(input)
    if (resolved.startsWith('https://') || resolved.startsWith('http://')) {
      const resolvedKey = extractStorageKey(resolved)
      if (resolvedKey) return toPublicUrl(resolvedKey)
      return resolved
    }
  } catch { /* ignore */ }

  return null
}

/**
 * Convert a storage key to a publicly-accessible URL.
 * - EvoLink file URLs (https://files.evolink.ai/...) → return as-is
 * - Other HTTPS URLs → return as-is
 * - Local storage keys → generate signed URL, make absolute via toFetchableUrl
 */
async function toPublicUrl(key: string): Promise<string> {
  if (key.startsWith('https://')) return key
  const signedUrl = await getSignedObjectUrl(key, 3600)
  if (signedUrl.startsWith('https://') || signedUrl.startsWith('http://')) return signedUrl
  return toFetchableUrl(signedUrl)
}
