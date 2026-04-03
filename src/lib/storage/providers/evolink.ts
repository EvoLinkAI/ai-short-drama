/**
 * EvoLink Storage Provider
 *
 * Hybrid provider:
 * - Images (jpeg/png/gif/webp) → EvoLink Files API (public URLs, 72h TTL)
 * - Non-images (audio/video)   → Local filesystem fallback
 *
 * API key resolution (lazy, cached):
 * 1. EVOLINK_FILES_API_KEY env var (optional override)
 * 2. First user's EvoLink provider key from database (auto-discovery)
 *
 * Stored keys:
 * - Images: full EvoLink URL (e.g. https://files.evolink.ai/...)
 * - Non-images: local path (e.g. images/voice-xxx.wav)
 */

import { createScopedLogger } from '@/lib/logging/core'
import { LocalStorageProvider } from '@/lib/storage/providers/local'
import type {
  DeleteObjectsResult,
  SignedUrlParams,
  StorageProvider,
  UploadObjectParams,
  UploadObjectResult,
} from '@/lib/storage/types'
import {
  guessMimeTypeFromKey,
  isEvolinkFileUrl,
  isEvolinkUploadSupported,
  uploadBufferToEvolinkFiles,
} from '@/lib/providers/evolink/file-upload'

const logger = createScopedLogger({ module: 'storage.evolink' })

/** Cache TTL: 5 minutes (keys may rotate; avoid stale-key 401s for too long) */
const API_KEY_CACHE_TTL_MS = 5 * 60 * 1000

export class EvolinkStorageProvider implements StorageProvider {
  readonly kind = 'evolink' as const

  private cachedApiKey: string | null = null
  private cachedApiKeyAt = 0
  private readonly local: LocalStorageProvider

  constructor() {
    this.local = new LocalStorageProvider()
    // API key resolved lazily on first upload — no env var required
  }

  /**
   * Resolve EvoLink API key:
   * 1. Env var EVOLINK_FILES_API_KEY (optional, always fresh)
   * 2. First user's configured EvoLink provider key from DB (cached 5 min)
   */
  private async getApiKey(): Promise<string> {
    const now = Date.now()
    if (this.cachedApiKey && now - this.cachedApiKeyAt < API_KEY_CACHE_TTL_MS) {
      return this.cachedApiKey
    }

    // Check env var first (no TTL — treated as always-fresh override)
    const envKey = process.env.EVOLINK_FILES_API_KEY
    if (envKey?.trim()) {
      this.cachedApiKey = envKey.trim()
      this.cachedApiKeyAt = now
      return this.cachedApiKey
    }

    // Lazy load from database — dynamic imports to avoid circular deps
    try {
      const { prisma } = await import('@/lib/prisma')
      const { decryptApiKey } = await import('@/lib/crypto-utils')

      const prefs = await prisma.userPreference.findMany({
        where: { customProviders: { not: null } },
        select: { customProviders: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      })

      for (const pref of prefs) {
        if (!pref.customProviders) continue
        try {
          const providers = JSON.parse(pref.customProviders) as Array<{
            id: string
            apiKey?: string
          }>
          const evolinkProvider = providers.find((p) => {
            const idx = p.id.indexOf(':')
            const key = idx === -1 ? p.id : p.id.slice(0, idx)
            return key === 'evolink'
          })
          if (evolinkProvider?.apiKey) {
            this.cachedApiKey = decryptApiKey(evolinkProvider.apiKey)
            this.cachedApiKeyAt = now
            return this.cachedApiKey
          }
        } catch { /* skip malformed config */ }
      }
    } catch (error) {
      logger.error('[EvolinkStorage] Failed to load API key from DB', error)
    }

    throw new Error(
      'EVOLINK_FILES_API_KEY_NOT_FOUND: Configure EvoLink API key in Settings, or set EVOLINK_FILES_API_KEY env var',
    )
  }

  async uploadObject(params: UploadObjectParams): Promise<UploadObjectResult> {
    const mimeType = params.contentType || guessMimeTypeFromKey(params.key)

    if (mimeType && isEvolinkUploadSupported(mimeType)) {
      try {
        const apiKey = await this.getApiKey()
        const result = await uploadBufferToEvolinkFiles(
          params.body,
          mimeType,
          apiKey,
        )
        return { key: result.fileUrl }
      } catch (error) {
        // Auth / key errors must propagate — silently falling back would mask
        // mis-configured keys and produce orphaned local files.
        const msg = error instanceof Error ? error.message : String(error)
        if (
          msg.includes('401') ||
          msg.includes('403') ||
          msg.includes('EVOLINK_FILES_API_KEY') ||
          msg.includes('Unauthorized') ||
          msg.includes('Forbidden')
        ) {
          // Evict cached key so the next call re-fetches from DB
          this.cachedApiKey = null
          this.cachedApiKeyAt = 0
          throw error
        }
        logger.error('[EvolinkStorage] Upload failed, falling back to local', error)
        return this.local.uploadObject(params)
      }
    }

    // Non-image or unsupported type → local storage
    return this.local.uploadObject(params)
  }

  async deleteObject(key: string): Promise<void> {
    if (isEvolinkFileUrl(key)) {
      // EvoLink files auto-expire, no delete API
      return
    }
    return this.local.deleteObject(key)
  }

  async deleteObjects(keys: string[]): Promise<DeleteObjectsResult> {
    const localKeys = keys.filter((k) => !isEvolinkFileUrl(k))
    const evolinkCount = keys.length - localKeys.length
    const localResult = await this.local.deleteObjects(localKeys)
    return {
      success: localResult.success + evolinkCount,
      failed: localResult.failed,
    }
  }

  async getSignedObjectUrl(params: SignedUrlParams): Promise<string> {
    if (isEvolinkFileUrl(params.key)) {
      return params.key // Already a public URL
    }
    return this.local.getSignedObjectUrl(params)
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    if (isEvolinkFileUrl(key)) {
      const response = await fetch(key)
      if (!response.ok) {
        throw new Error(`EVOLINK_FILE_DOWNLOAD_FAILED(${response.status}): ${key}`)
      }
      return Buffer.from(await response.arrayBuffer())
    }
    return this.local.getObjectBuffer(key)
  }

  extractStorageKey(input: string | null | undefined): string | null {
    if (!input) return null
    if (isEvolinkFileUrl(input)) return input
    return this.local.extractStorageKey(input)
  }

  toFetchableUrl(inputUrl: string): string {
    if (isEvolinkFileUrl(inputUrl)) return inputUrl
    return this.local.toFetchableUrl(inputUrl)
  }

  generateUniqueKey(params: { prefix: string; ext: string }): string {
    return this.local.generateUniqueKey(params)
  }
}
