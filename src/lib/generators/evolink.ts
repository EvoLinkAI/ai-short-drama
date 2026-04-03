import { createScopedLogger } from '@/lib/logging/core'
import {
  BaseImageGenerator,
  BaseVideoGenerator,
  BaseAudioGenerator,
  type ImageGenerateParams,
  type VideoGenerateParams,
  type AudioGenerateParams,
  type GenerateResult,
} from './base'
import { generateEvolinkAudio } from '@/lib/providers/evolink'
import { getProviderConfig } from '@/lib/api-config'
import { EVOLINK_API_BASE } from '@/lib/providers/evolink/constants'
import { resolveToExternalUrl } from '@/lib/providers/evolink/url-resolver'

const EVOLINK_IMAGE_ALLOWED_OPTIONS = new Set([
  'provider',
  'modelId',
  'modelKey',
  'aspectRatio',
  'resolution',
])

export class EvolinkImageGenerator extends BaseImageGenerator {
  protected async doGenerate(params: ImageGenerateParams): Promise<GenerateResult> {
    const { userId, prompt, referenceImages = [], options = {} } = params

    const { apiKey } = await getProviderConfig(userId, 'evolink')
    if (!apiKey) {
      throw new Error('EVOLINK_API_KEY_REQUIRED')
    }

    const {
      aspectRatio,
      resolution,
      modelId: optModelId = 'z-image-turbo',
    } = options as {
      aspectRatio?: string
      resolution?: string
      modelId?: string
      provider?: string
      modelKey?: string
    }

    for (const [key, value] of Object.entries(options)) {
      if (value === undefined) continue
      if (!EVOLINK_IMAGE_ALLOWED_OPTIONS.has(key)) {
        throw new Error(`EVOLINK_IMAGE_OPTION_UNSUPPORTED: ${key}`)
      }
    }

    const logger = createScopedLogger({
      module: 'worker.evolink-image',
      action: 'evolink_image_generate',
    })

    const body: Record<string, unknown> = {
      model: optModelId,
      prompt,
    }
    if (aspectRatio) {
      body.size = aspectRatio
    }
    if (resolution) {
      body.quality = resolution
    }

    // 将参考图转为 S3 presigned URL（R2 公网可访问）
    if (referenceImages.length > 0) {
      const resolved = await Promise.all(referenceImages.map(resolveToExternalUrl))
      const validUrls = resolved.filter((u): u is string => !!u)
      if (validUrls.length > 0) {
        body.image_urls = validUrls
      }
    }

    logger.info({
      message: 'EvoLink image generation request',
      details: {
        modelId: optModelId,
        aspectRatio: aspectRatio ?? null,
        resolution: resolution ?? null,
        referenceImagesCount: referenceImages.length,
        promptLength: prompt.length,
      },
    })

    const response = await fetch(`${EVOLINK_API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`EVOLINK_IMAGE_SUBMIT_FAILED(${response.status}): ${errorText}`)
    }

    const data = await response.json() as { id?: string }
    const taskId = data.id

    if (!taskId) {
      throw new Error('EVOLINK_IMAGE_TASK_ID_MISSING')
    }

    logger.info({
      message: 'EvoLink image task submitted',
      details: { taskId },
    })

    return {
      success: true,
      async: true,
      requestId: taskId,
      externalId: `EVOLINK:IMAGE:${taskId}`,
    }
  }
}

// ============================================================
// EvoLink 视频生成器（图生视频）
// ============================================================

const EVOLINK_VIDEO_ALLOWED_OPTIONS = new Set([
  'provider',
  'modelId',
  'modelKey',
  'duration',
  'aspectRatio',
  'resolution',
  'generateAudio',
  'generationMode',
  'lastFrameImageUrl',
  // Seedance 2.0 reference-to-video
  'videoUrls',
  'audioUrls',
  // Seedance 2.0 text-to-video web_search
  'webSearch',
  'quality',
])

export class EvolinkVideoGenerator extends BaseVideoGenerator {
  protected async doGenerate(params: VideoGenerateParams): Promise<GenerateResult> {
    const { userId, imageUrl, prompt = '', options = {} } = params

    const { apiKey } = await getProviderConfig(userId, 'evolink')
    if (!apiKey) {
      throw new Error('EVOLINK_API_KEY_REQUIRED')
    }

    const {
      duration,
      aspectRatio,
      resolution,
      generateAudio,
      lastFrameImageUrl,
      videoUrls,
      audioUrls,
      webSearch,
      quality,
      modelId: optModelId = 'kling-o3-image-to-video',
    } = options as {
      duration?: number
      aspectRatio?: string
      resolution?: string
      generateAudio?: boolean
      lastFrameImageUrl?: string
      videoUrls?: string[]
      audioUrls?: string[]
      webSearch?: boolean
      quality?: string
      modelId?: string
      provider?: string
      modelKey?: string
      generationMode?: string
    }

    for (const [key, value] of Object.entries(options)) {
      if (value === undefined) continue
      if (!EVOLINK_VIDEO_ALLOWED_OPTIONS.has(key)) {
        throw new Error(`EVOLINK_VIDEO_OPTION_UNSUPPORTED: ${key}`)
      }
    }

    const logger = createScopedLogger({
      module: 'worker.evolink-video',
      action: 'evolink_video_generate',
    })

    // Seedance 2.0 smart routing: auto-select variant based on input
    let resolvedModelId = optModelId
    if (optModelId === 'seedance-2.0') {
      const isFast = quality === 'fast'
      const fastPart = isFast ? '-fast' : ''
      const hasImage = !!imageUrl
      const hasLastFrame = !!lastFrameImageUrl

      if (!hasImage) {
        // No image → pure text-to-video
        resolvedModelId = `seedance-2.0${fastPart}-text-to-video`
      } else if (videoUrls?.length || audioUrls?.length) {
        // Has video or audio reference media → multi-modal reference-to-video
        // i2v handles single/dual image natively; ref2v is only needed for video/audio references
        resolvedModelId = `seedance-2.0${fastPart}-reference-to-video`
      } else {
        // image(s) only → i2v (1 image = first frame, 2 images = first+last frame natively)
        resolvedModelId = `seedance-2.0${fastPart}-image-to-video`
      }
    }

    // 按模型系列路由参数格式
    const isKling = optModelId.startsWith('kling-')
    const isWan = optModelId.startsWith('wan')
    const isSeedance = optModelId.startsWith('seedance-')
    const isSeedanceT2V = isSeedance && resolvedModelId.includes('-text-to-video')
    const isSeedanceRef2V = isSeedance && resolvedModelId.includes('-reference-to-video')

    // Clamp duration to API-enforced 4–15s range for Seedance 2.0 variants
    let effectiveDuration = duration
    if (isSeedance && resolvedModelId.includes('seedance-2.0') && typeof effectiveDuration === 'number') {
      effectiveDuration = Math.max(4, Math.min(15, effectiveDuration))
    }

    // Guard: ref2v audio-only is rejected by the API (needs at least 1 image or video)
    if (isSeedanceRef2V && audioUrls?.length && !imageUrl && !(videoUrls?.length)) {
      throw new Error('EVOLINK_REF2V_AUDIO_ONLY: audio_urls requires at least one image_urls or video_urls')
    }

    const body: Record<string, unknown> = {
      model: resolvedModelId,
      prompt,
    }

    // 将图片转为 S3 presigned URL（R2 公网可访问）
    const safeImageUrl = imageUrl ? await resolveToExternalUrl(imageUrl) : undefined
    const safeLastFrameUrl = lastFrameImageUrl ? await resolveToExternalUrl(lastFrameImageUrl) : undefined

    if (isKling) {
      if (safeImageUrl) {
        body.image_start = safeImageUrl
      }
      if (safeLastFrameUrl) {
        body.image_end = safeLastFrameUrl
      }
    } else if (!isSeedanceT2V) {
      // Wan 2.6 / Seedance i2v / ref2v：image_urls 数组
      // t2v 模型不需要图片输入
      const imageUrlArr: string[] = []
      if (safeImageUrl) imageUrlArr.push(safeImageUrl)
      if (isSeedance && safeLastFrameUrl) imageUrlArr.push(safeLastFrameUrl)
      if (imageUrlArr.length > 0) {
        body.image_urls = imageUrlArr
      }
    }

    // Seedance 2.0 reference-to-video：视频 & 音频参考素材
    if (isSeedanceRef2V) {
      if (videoUrls && videoUrls.length > 0) {
        const safeVideoUrls = await Promise.all(videoUrls.map(resolveToExternalUrl))
        const validVideoUrls = safeVideoUrls.filter((u): u is string => !!u)
        if (validVideoUrls.length > 0) {
          body.video_urls = validVideoUrls
        }
      }
      if (audioUrls && audioUrls.length > 0) {
        const safeAudioUrls = await Promise.all(audioUrls.map(resolveToExternalUrl))
        const validAudioUrls = safeAudioUrls.filter((u): u is string => !!u)
        if (validAudioUrls.length > 0) {
          body.audio_urls = validAudioUrls
        }
      }
    }

    // Seedance 2.0 text-to-video：联网搜索
    if (isSeedanceT2V && webSearch) {
      body.model_params = { web_search: true }
    }

    if (typeof effectiveDuration === 'number') {
      body.duration = effectiveDuration
    }
    // Wan 2.6 不支持 aspect_ratio
    if (aspectRatio && !isWan) {
      body.aspect_ratio = aspectRatio
    }
    if (resolution) {
      body.quality = resolution
    }

    // 音频参数：Kling 用 sound(on/off)，Seedance/Wan Flash 用 generate_audio(bool)
    if (typeof generateAudio === 'boolean') {
      if (isKling) {
        body.sound = generateAudio ? 'on' : 'off'
      } else if (isSeedance || optModelId === 'wan2.6-image-to-video-flash') {
        body.generate_audio = generateAudio
      }
    }

    logger.info({
      message: 'EvoLink video generation request',
      details: {
        modelId: optModelId,
        aspectRatio: aspectRatio ?? null,
        duration: duration ?? null,
        hasStartImage: !!imageUrl,
        hasEndImage: !!lastFrameImageUrl,
        promptLength: prompt.length,
      },
    })

    const response = await fetch(`${EVOLINK_API_BASE}/videos/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`EVOLINK_VIDEO_SUBMIT_FAILED(${response.status}): ${errorText}`)
    }

    const data = await response.json() as { id?: string }
    const taskId = data.id

    if (!taskId) {
      throw new Error('EVOLINK_VIDEO_TASK_ID_MISSING')
    }

    logger.info({
      message: 'EvoLink video task submitted',
      details: { taskId },
    })

    return {
      success: true,
      async: true,
      requestId: taskId,
      externalId: `EVOLINK:VIDEO:${taskId}`,
    }
  }
}

// ============================================================
// EvoLink 音频生成器（TTS / Voice Design）
// ============================================================

export class EvolinkAudioGenerator extends BaseAudioGenerator {
  protected async doGenerate(params: AudioGenerateParams): Promise<GenerateResult> {
    const modelId = typeof params.options?.modelId === 'string' ? params.options.modelId : ''
    const modelKey = typeof params.options?.modelKey === 'string' ? params.options.modelKey : ''
    const provider = typeof params.options?.provider === 'string' ? params.options.provider : 'evolink'
    return await generateEvolinkAudio({
      userId: params.userId,
      text: params.text,
      voice: params.voice,
      rate: params.rate,
      options: {
        ...params.options,
        provider,
        modelId,
        modelKey,
      },
    })
  }
}
