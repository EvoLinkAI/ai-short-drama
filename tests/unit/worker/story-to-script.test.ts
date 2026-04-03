import type { Job } from 'bullmq'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

const prismaMock = vi.hoisted(() => ({
  project: { findUnique: vi.fn() },
  studioProject: { findUnique: vi.fn() },
  studioEpisode: { findUnique: vi.fn() },
  studioClip: { update: vi.fn(async () => ({})) },
}))

const workerMock = vi.hoisted(() => ({
  reportTaskProgress: vi.fn(async () => undefined),
  assertTaskActive: vi.fn(async () => undefined),
}))

const configMock = vi.hoisted(() => ({
  resolveProjectModelCapabilityGenerationOptions: vi.fn(async () => ({ reasoningEffort: 'high' })),
  getUserWorkflowConcurrencyConfig: vi.fn(async () => ({
    analysis: 2,
    image: 5,
    video: 5,
  })),
}))

const orchestratorMock = vi.hoisted(() => ({
  runStoryToScriptOrchestrator: vi.fn(),
}))
const helperMock = vi.hoisted(() => ({
  persistAnalyzedCharacters: vi.fn(async () => [{ id: 'character-new-1' }]),
  persistAnalyzedLocations: vi.fn(async () => [{ id: 'location-new-1' }]),
  persistAnalyzedProps: vi.fn(async () => [{ id: 'prop-new-1' }]),
  persistClips: vi.fn(async () => [{ clipKey: 'clip-1', id: 'clip-row-1' }]),
}))
const workflowLeaseMock = vi.hoisted(() => ({
  assertWorkflowRunActive: vi.fn(async () => undefined),
  withWorkflowRunLease: vi.fn(async (params: { run: () => Promise<unknown> }) => ({
    claimed: true,
    result: await params.run(),
  })),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/llm-client', () => ({
  chatCompletion: vi.fn(),
  getCompletionParts: vi.fn(() => ({ text: '', reasoning: '' })),
  getCompletionContent: vi.fn(() => ''),
}))
vi.mock('@/lib/config-service', () => configMock)
vi.mock('@/lib/llm-observe/internal-stream-context', () => ({
  withInternalLLMStreamCallbacks: vi.fn(async (_callbacks: unknown, fn: () => Promise<unknown>) => await fn()),
}))
vi.mock('@/lib/logging/semantic', () => ({ logAIAnalysis: vi.fn() }))
vi.mock('@/lib/logging/file-writer', () => ({ onProjectNameAvailable: vi.fn() }))
vi.mock('@/lib/workers/shared', () => ({ reportTaskProgress: workerMock.reportTaskProgress }))
vi.mock('@/lib/workers/utils', () => ({ assertTaskActive: workerMock.assertTaskActive }))
vi.mock('@/lib/studio/story-to-script/orchestrator', () => orchestratorMock)
vi.mock('@/lib/workers/handlers/llm-stream', () => ({
  createWorkerLLMStreamContext: vi.fn(() => ({ streamRunId: 'run-1', nextSeqByStepLane: {} })),
  createWorkerLLMStreamCallbacks: vi.fn(() => ({
    onStage: vi.fn(),
    onChunk: vi.fn(),
    onComplete: vi.fn(),
    onError: vi.fn(),
    flush: vi.fn(async () => undefined),
  })),
}))
vi.mock('@/lib/prompt-i18n', () => ({
  PROMPT_IDS: {
    NP_AGENT_CHARACTER_PROFILE: 'a',
    NP_SELECT_LOCATION: 'b',
    NP_SELECT_PROP: 'c',
    NP_AGENT_CLIP: 'd',
    NP_SCREENPLAY_CONVERSION: 'e',
  },
  getPromptTemplate: vi.fn(() => 'prompt-template'),
}))
vi.mock('@/lib/workers/handlers/story-to-script-helpers', () => ({
  asString: (value: unknown) => (typeof value === 'string' ? value : ''),
  parseEffort: vi.fn(() => null),
  parseTemperature: vi.fn(() => 0.7),
  persistAnalyzedCharacters: helperMock.persistAnalyzedCharacters,
  persistAnalyzedLocations: helperMock.persistAnalyzedLocations,
  persistAnalyzedProps: helperMock.persistAnalyzedProps,
  persistClips: helperMock.persistClips,
  resolveClipRecordId: (clipIdMap: Map<string, string>, clipId: string) => clipIdMap.get(clipId) ?? null,
}))
vi.mock('@/lib/run-runtime/workflow-lease', () => workflowLeaseMock)

import { handleStoryToScriptTask } from '@/lib/workers/handlers/story-to-script'

function buildJob(payload: Record<string, unknown>, episodeId: string | null = 'episode-1'): Job<TaskJobData> {
  const runId = typeof payload.runId === 'string' && payload.runId.trim() ? payload.runId.trim() : 'run-test-story'
  const payloadMeta = payload.meta && typeof payload.meta === 'object' && !Array.isArray(payload.meta)
    ? (payload.meta as Record<string, unknown>)
    : {}
  const normalizedPayload: Record<string, unknown> = {
    ...payload,
    runId,
    meta: {
      ...payloadMeta,
      runId,
    },
  }
  return {
    data: {
      taskId: 'task-story-to-script-1',
      type: TASK_TYPE.STORY_TO_SCRIPT_RUN,
      locale: 'zh',
      projectId: 'project-1',
      episodeId,
      targetType: 'StudioEpisode',
      targetId: 'episode-1',
      payload: normalizedPayload,
      userId: 'user-1',
    },
  } as unknown as Job<TaskJobData>
}

describe('worker story-to-script behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Project One',
      mode: 'studio',
    })

    prismaMock.studioProject.findUnique.mockResolvedValue({
      id: 'np-project-1',
      analysisModel: 'llm::analysis-1',
      characters: [{ id: 'char-1', name: 'Hero', introduction: 'hero intro' }],
      locations: [{ id: 'loc-1', name: 'Old Town', summary: 'town', assetKind: 'location' }],
    })

    prismaMock.studioEpisode.findUnique.mockResolvedValue({
      id: 'episode-1',
      studioProjectId: 'np-project-1',
      novelText: 'episode text',
    })

    orchestratorMock.runStoryToScriptOrchestrator.mockResolvedValue({
      analyzedCharacters: [{ name: 'New Hero' }],
      analyzedLocations: [{ name: 'Market' }],
      analyzedProps: [{ name: 'Knife', summary: 'bronze dagger' }],
      propsObject: { props: [{ name: 'Knife', summary: 'bronze dagger' }] },
      clipList: [{ clipId: 'clip-1', content: 'clip content', props: ['Knife'] }],
      screenplayResults: [
        {
          clipId: 'clip-1',
          success: true,
          screenplay: { scenes: [{ shot: 'close-up' }] },
        },
      ],
      summary: {
        clipCount: 1,
        screenplaySuccessCount: 1,
        screenplayFailedCount: 0,
        propCount: 1,
      },
    })
  })

  it('missing episodeId -> explicit error', async () => {
    const job = buildJob({}, null)
    await expect(handleStoryToScriptTask(job)).rejects.toThrow('episodeId is required')
  })

  it('success path -> persists clips and screenplay with concrete fields', async () => {
    const job = buildJob({ episodeId: 'episode-1', content: 'input content' })
    const result = await handleStoryToScriptTask(job)

    expect(result).toEqual({
      episodeId: 'episode-1',
      clipCount: 1,
      screenplaySuccessCount: 1,
      screenplayFailedCount: 0,
      persistedCharacters: 1,
      persistedLocations: 1,
      persistedProps: 1,
      persistedClips: 1,
    })

    expect(helperMock.persistClips).toHaveBeenCalledWith({
      episodeId: 'episode-1',
      clipList: [{ clipId: 'clip-1', content: 'clip content', props: ['Knife'] }],
    })

    expect(prismaMock.studioClip.update).toHaveBeenCalledWith({
      where: { id: 'clip-row-1' },
      data: {
        screenplay: JSON.stringify({ scenes: [{ shot: 'close-up' }] }),
      },
    })
  })

  it('orchestrator partial failure summary -> throws explicit error', async () => {
    orchestratorMock.runStoryToScriptOrchestrator.mockResolvedValueOnce({
      analyzedCharacters: [],
      analyzedLocations: [],
      analyzedProps: [],
      propsObject: { props: [] },
      clipList: [],
      screenplayResults: [
        {
          clipId: 'clip-3',
          success: false,
          error: 'bad screenplay json',
        },
      ],
      summary: {
        clipCount: 1,
        screenplaySuccessCount: 0,
        screenplayFailedCount: 1,
      },
    })

    const job = buildJob({ episodeId: 'episode-1', content: 'input content' })
    await expect(handleStoryToScriptTask(job)).rejects.toThrow('STORY_TO_SCRIPT_PARTIAL_FAILED')
  })
})
