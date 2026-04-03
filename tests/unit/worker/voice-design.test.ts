import type { Job } from 'bullmq'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

const bailianMock = vi.hoisted(() => ({
  createVoiceDesign: vi.fn(),
  validateVoicePrompt: vi.fn(),
  validatePreviewText: vi.fn(),
}))

const evolinkMock = vi.hoisted(() => ({
  createEvolinkVoiceDesign: vi.fn(),
  validateVoicePrompt: vi.fn(),
  validatePreviewText: vi.fn(),
}))

const apiConfigMock = vi.hoisted(() => ({
  getProviderConfig: vi.fn(),
}))

const workerMock = vi.hoisted(() => ({
  reportTaskProgress: vi.fn(async () => undefined),
  assertTaskActive: vi.fn(async () => undefined),
}))

vi.mock('@/lib/providers/bailian/voice-design', () => bailianMock)
vi.mock('@/lib/providers/evolink/voice-design', () => evolinkMock)
vi.mock('@/lib/api-config', () => apiConfigMock)
vi.mock('@/lib/workers/shared', () => ({
  reportTaskProgress: workerMock.reportTaskProgress,
}))
vi.mock('@/lib/workers/utils', () => ({
  assertTaskActive: workerMock.assertTaskActive,
}))

import { handleVoiceDesignTask } from '@/lib/workers/handlers/voice-design'

function buildJob(type: TaskJobData['type'], payload: Record<string, unknown>): Job<TaskJobData> {
  return {
    data: {
      taskId: 'task-voice-1',
      type,
      locale: 'zh',
      projectId: 'project-1',
      episodeId: null,
      targetType: 'VoiceDesign',
      targetId: 'voice-design-1',
      payload,
      userId: 'user-1',
    },
  } as unknown as Job<TaskJobData>
}

describe('worker voice-design behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: evolink provider (handler defaults to evolink)
    evolinkMock.validateVoicePrompt.mockReturnValue({ valid: true })
    evolinkMock.validatePreviewText.mockReturnValue({ valid: true })
    evolinkMock.createEvolinkVoiceDesign.mockResolvedValue({
      success: true,
      voiceId: 'evolink-voice-1',
      targetModel: 'qwen3-tts-vd-2026-01-26',
      audioUrl: 'https://x/preview.wav',
      requestId: 'req-ev-1',
    })
    bailianMock.validateVoicePrompt.mockReturnValue({ valid: true })
    bailianMock.validatePreviewText.mockReturnValue({ valid: true })
    bailianMock.createVoiceDesign.mockResolvedValue({
      success: true,
      voiceId: 'bailian-voice-1',
      targetModel: 'bailian-tts',
      audioBase64: 'base64-audio',
      sampleRate: 24000,
      responseFormat: 'mp3',
      usageCount: 11,
      requestId: 'req-bl-1',
    })
    apiConfigMock.getProviderConfig.mockResolvedValue({ apiKey: 'test-key' })
  })

  it('missing required fields -> explicit error', async () => {
    const job = buildJob(TASK_TYPE.VOICE_DESIGN, { previewText: 'hello' })
    await expect(handleVoiceDesignTask(job)).rejects.toThrow('voicePrompt is required')
  })

  it('invalid prompt validation -> explicit error message from validator', async () => {
    evolinkMock.validateVoicePrompt.mockReturnValue({ valid: false, error: 'bad prompt' })

    const job = buildJob(TASK_TYPE.VOICE_DESIGN, {
      voicePrompt: 'x',
      previewText: 'hello',
    })
    await expect(handleVoiceDesignTask(job)).rejects.toThrow('bad prompt')
  })

  it('defaults to evolink provider', async () => {
    const job = buildJob(TASK_TYPE.VOICE_DESIGN, {
      voicePrompt: 'calm voice',
      previewText: 'hello world',
    })

    const result = await handleVoiceDesignTask(job)

    expect(apiConfigMock.getProviderConfig).toHaveBeenCalledWith('user-1', 'evolink')
    expect(evolinkMock.createEvolinkVoiceDesign).toHaveBeenCalled()
    expect(bailianMock.createVoiceDesign).not.toHaveBeenCalled()
    expect(result).toEqual(expect.objectContaining({ success: true, voiceId: 'evolink-voice-1' }))
  })

  it('explicit bailian provider routes to bailian', async () => {
    const job = buildJob(TASK_TYPE.ASSET_HUB_VOICE_DESIGN, {
      voicePrompt: '  calm female narrator  ',
      previewText: '  hello world  ',
      preferredName: '  custom_name  ',
      language: 'en',
      provider: 'bailian',
    })

    const result = await handleVoiceDesignTask(job)

    expect(apiConfigMock.getProviderConfig).toHaveBeenCalledWith('user-1', 'bailian')
    expect(bailianMock.createVoiceDesign).toHaveBeenCalledWith({
      voicePrompt: 'calm female narrator',
      previewText: 'hello world',
      preferredName: 'custom_name',
      language: 'en',
    }, 'test-key')

    expect(result).toEqual(expect.objectContaining({
      success: true,
      voiceId: 'bailian-voice-1',
      taskType: TASK_TYPE.ASSET_HUB_VOICE_DESIGN,
    }))
  })

  it('evolink provider passes expanded language options', async () => {
    const job = buildJob(TASK_TYPE.VOICE_DESIGN, {
      voicePrompt: '日本語の声',
      previewText: 'こんにちは',
      language: 'ja',
      provider: 'evolink',
    })

    await handleVoiceDesignTask(job)

    expect(evolinkMock.createEvolinkVoiceDesign).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'ja' }),
      'test-key',
    )
  })

  it('bailian provider narrows non-zh/en language to zh', async () => {
    const job = buildJob(TASK_TYPE.VOICE_DESIGN, {
      voicePrompt: '日本語の声',
      previewText: 'テスト',
      language: 'ja',
      provider: 'bailian',
    })

    await handleVoiceDesignTask(job)

    expect(bailianMock.createVoiceDesign).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'zh' }),
      'test-key',
    )
  })
})
