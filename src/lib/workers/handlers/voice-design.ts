import type { Job } from 'bullmq'
import {
  createVoiceDesign,
  validatePreviewText as validateBailianPreview,
  validateVoicePrompt as validateBailianPrompt,
  type VoiceDesignInput,
} from '@/lib/providers/bailian/voice-design'
import {
  createEvolinkVoiceDesign,
  validatePreviewText as validateEvolinkPreview,
  validateVoicePrompt as validateEvolinkPrompt,
} from '@/lib/providers/evolink/voice-design'
import { getProviderConfig } from '@/lib/api-config'
import { reportTaskProgress } from '@/lib/workers/shared'
import { assertTaskActive } from '@/lib/workers/utils'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

const SUPPORTED_LANGUAGES = new Set(['zh', 'en', 'ja', 'ko', 'de', 'fr', 'it', 'ru', 'pt', 'es'])

function readLanguage(value: unknown): 'zh' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'it' | 'ru' | 'pt' | 'es' {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return (SUPPORTED_LANGUAGES.has(v) ? v : 'zh') as 'zh' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'it' | 'ru' | 'pt' | 'es'
}

function resolveVoiceDesignProvider(payload: Record<string, unknown>): 'bailian' | 'evolink' {
  const explicit = typeof payload.provider === 'string' ? payload.provider.trim().toLowerCase() : ''
  if (explicit === 'evolink') return 'evolink'
  if (explicit === 'bailian') return 'bailian'
  // Default: evolink (preferred for new voice design)
  return 'evolink'
}

export async function handleVoiceDesignTask(job: Job<TaskJobData>) {
  const payload = (job.data.payload || {}) as Record<string, unknown>
  const voicePrompt = readRequiredString(payload.voicePrompt, 'voicePrompt')
  const previewText = readRequiredString(payload.previewText, 'previewText')
  const preferredName = typeof payload.preferredName === 'string' && payload.preferredName.trim()
    ? payload.preferredName.trim()
    : 'custom_voice'
  const language = readLanguage(payload.language)
  const provider = resolveVoiceDesignProvider(payload)

  // Validate with provider-specific limits
  const promptValidation = provider === 'evolink'
    ? validateEvolinkPrompt(voicePrompt)
    : validateBailianPrompt(voicePrompt)
  if (!promptValidation.valid) {
    throw new Error(promptValidation.error || 'invalid voicePrompt')
  }
  const textValidation = provider === 'evolink'
    ? validateEvolinkPreview(previewText)
    : validateBailianPreview(previewText)
  if (!textValidation.valid) {
    throw new Error(textValidation.error || 'invalid previewText')
  }

  await reportTaskProgress(job, 25, {
    stage: 'voice_design_submit',
    stageLabel: '提交声音设计任务',
    displayMode: 'detail',
  })
  await assertTaskActive(job, 'voice_design_submit')

  const { apiKey } = await getProviderConfig(job.data.userId, provider)

  let designed: {
    success: boolean
    voiceId?: string
    targetModel?: string
    audioBase64?: string
    audioUrl?: string
    sampleRate?: number
    responseFormat?: string
    usageCount?: number
    requestId?: string
    error?: string
  }

  if (provider === 'evolink') {
    designed = await createEvolinkVoiceDesign({
      voicePrompt,
      previewText,
      preferredName,
      language,
    }, apiKey)
  } else {
    const bailianLang: 'zh' | 'en' = language === 'en' ? 'en' : 'zh'
    const input: VoiceDesignInput = {
      voicePrompt,
      previewText,
      preferredName,
      language: bailianLang,
    }
    designed = await createVoiceDesign(input, apiKey)
  }

  if (!designed.success) {
    throw new Error(designed.error || '声音设计失败')
  }

  // EvoLink returns audioUrl (download link) instead of inline audioBase64.
  // The frontend contract expects audioBase64 for playback and persistence,
  // so download the preview audio here (server-side, no CORS issues) and
  // convert to base64 to keep the mutation return type unchanged.
  let audioBase64 = designed.audioBase64
  if (!audioBase64 && designed.audioUrl) {
    const audioRes = await fetch(designed.audioUrl)
    if (audioRes.ok) {
      const buf = Buffer.from(await audioRes.arrayBuffer())
      audioBase64 = buf.toString('base64')
    }
  }

  await reportTaskProgress(job, 96, {
    stage: 'voice_design_done',
    stageLabel: '声音设计完成',
    displayMode: 'detail',
  })

  return {
    success: true,
    voiceId: designed.voiceId,
    targetModel: designed.targetModel,
    audioBase64,
    audioUrl: designed.audioUrl,
    sampleRate: designed.sampleRate,
    responseFormat: designed.responseFormat,
    usageCount: designed.usageCount,
    requestId: designed.requestId,
    taskType: job.data.type === TASK_TYPE.ASSET_HUB_VOICE_DESIGN ? TASK_TYPE.ASSET_HUB_VOICE_DESIGN : TASK_TYPE.VOICE_DESIGN,
  }
}
