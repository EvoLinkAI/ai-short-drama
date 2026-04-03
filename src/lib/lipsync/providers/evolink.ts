/**
 * EvoLink Lip Sync Provider
 *
 * Wraps VideoRetalk via EvoLink unified API.
 * Unlike Bailian (which requires OSS upload), EvoLink accepts direct URLs.
 *
 * Endpoint: POST /v1/videos/lipsync
 * Auth:     Bearer <evolink-api-key>
 */

import { getProviderConfig } from '@/lib/api-config'
import type { LipSyncParams, LipSyncResult, LipSyncSubmitContext } from '@/lib/lipsync/types'
import { EVOLINK_API_BASE } from '@/lib/providers/evolink/constants'
import { resolveToExternalUrl } from '@/lib/providers/evolink/url-resolver'

function str(v: unknown): string { return typeof v === 'string' ? v.trim() : '' }

interface EvolinkLipSyncResponse {
  id?: string
  code?: string
  message?: string
}

export async function submitEvolinkLipSync(
  params: LipSyncParams,
  context: LipSyncSubmitContext,
): Promise<LipSyncResult> {
  const modelId = str(context.modelId)
  if (!modelId) {
    throw new Error(`LIPSYNC_ENDPOINT_MISSING: ${context.modelKey}`)
  }

  const { apiKey } = await getProviderConfig(context.userId, context.providerId)

  const [videoUrl, audioUrl] = await Promise.all([
    resolveToExternalUrl(params.videoUrl),
    resolveToExternalUrl(params.audioUrl),
  ])
  if (!videoUrl) throw new Error('EVOLINK_LIPSYNC_VIDEO_URL_RESOLVE_FAILED')
  if (!audioUrl) throw new Error('EVOLINK_LIPSYNC_AUDIO_URL_RESOLVE_FAILED')

  const response = await fetch(`${EVOLINK_API_BASE}/videos/lipsync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      input: {
        video_url: videoUrl,
        audio_url: audioUrl,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`EVOLINK_LIPSYNC_SUBMIT_FAILED(${response.status}): ${errorText || 'unknown error'}`)
  }

  const data = await response.json() as EvolinkLipSyncResponse
  const taskId = str(data.id)
  if (!taskId) {
    throw new Error('EVOLINK_LIPSYNC_TASK_ID_MISSING')
  }

  return {
    requestId: taskId,
    externalId: `EVOLINK:VIDEO:${taskId}`,
    async: true,
  }
}
