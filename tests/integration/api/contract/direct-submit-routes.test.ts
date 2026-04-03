import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskType } from '@/lib/task/types'
import { buildMockRequest } from '../../../helpers/request'

type AuthState = {
  authenticated: boolean
  projectMode: 'studio' | 'other'
}

type SubmitResult = {
  taskId: string
  async: true
}

type RouteContext = {
  params: Promise<Record<string, string>>
}

type DirectRouteCase = {
  routeFile: string
  body: Record<string, unknown>
  params?: Record<string, string>
  expectedTaskType: TaskType
  expectedTargetType: string
  expectedProjectId: string
  expectedPayloadSubset?: Record<string, unknown>
}

const authState = vi.hoisted<AuthState>(() => ({
  authenticated: true,
  projectMode: 'studio',
}))

const submitTaskMock = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<SubmitResult>>())

const configServiceMock = vi.hoisted(() => ({
  getUserModelConfig: vi.fn(async () => ({
    characterModel: 'img::character',
    locationModel: 'img::location',
    editModel: 'img::edit',
  })),
  buildImageBillingPayloadFromUserConfig: vi.fn((input: { basePayload: Record<string, unknown> }) => ({
    ...input.basePayload,
    generationOptions: { resolution: '1024x1024' },
  })),
  getProjectModelConfig: vi.fn(async () => ({
    characterModel: 'img::character',
    locationModel: 'img::location',
    editModel: 'img::edit',
    storyboardModel: 'img::storyboard',
    analysisModel: 'llm::analysis',
  })),
  buildImageBillingPayload: vi.fn(async (input: { basePayload: Record<string, unknown> }) => ({
    ...input.basePayload,
    generationOptions: { resolution: '1024x1024' },
  })),
  resolveProjectModelCapabilityGenerationOptions: vi.fn(async () => ({
    resolution: '1024x1024',
  })),
}))

const hasOutputMock = vi.hoisted(() => ({
  hasGlobalCharacterOutput: vi.fn(async () => false),
  hasGlobalLocationOutput: vi.fn(async () => false),
  hasGlobalCharacterAppearanceOutput: vi.fn(async () => false),
  hasGlobalLocationImageOutput: vi.fn(async () => false),
  hasCharacterAppearanceOutput: vi.fn(async () => false),
  hasLocationImageOutput: vi.fn(async () => false),
  hasPanelLipSyncOutput: vi.fn(async () => false),
  hasPanelImageOutput: vi.fn(async () => false),
  hasPanelVideoOutput: vi.fn(async () => false),
  hasVoiceLineAudioOutput: vi.fn(async () => false),
}))

const prismaMock = vi.hoisted(() => ({
  userPreference: {
    findUnique: vi.fn(async () => ({ lipSyncModel: 'fal::lipsync-model' })),
  },
  studioStoryboard: {
    findUnique: vi.fn(async () => ({
      id: 'storyboard-1',
      episode: {
        studioProject: {
          projectId: 'project-1',
        },
      },
    })),
    update: vi.fn(async () => ({})),
  },
  studioPanel: {
    findFirst: vi.fn(async () => ({ id: 'panel-1' })),
    findMany: vi.fn(async () => []),
    findUnique: vi.fn(async ({ where }: { where?: { id?: string } }) => {
      const id = where?.id || 'panel-1'
      if (id === 'panel-src') {
        return {
          id,
          storyboardId: 'storyboard-1',
          panelIndex: 1,
          shotType: 'wide',
          cameraMove: 'static',
          description: 'source description',
          videoPrompt: 'source video prompt',
          location: 'source location',
          characters: '[]',
          srtSegment: '',
          duration: 3,
        }
      }
      if (id === 'panel-ins') {
        return {
          id,
          storyboardId: 'storyboard-1',
          panelIndex: 2,
          shotType: 'medium',
          cameraMove: 'push',
          description: 'insert description',
          videoPrompt: 'insert video prompt',
          location: 'insert location',
          characters: '[]',
          srtSegment: '',
          duration: 3,
        }
      }
      return {
        id,
        storyboardId: 'storyboard-1',
        panelIndex: 0,
        shotType: 'medium',
        cameraMove: 'static',
        description: 'panel description',
        videoPrompt: 'panel prompt',
        location: 'panel location',
        characters: '[]',
        srtSegment: '',
        duration: 3,
      }
    }),
    update: vi.fn(async () => ({})),
    create: vi.fn(async () => ({ id: 'panel-created', panelIndex: 3 })),
    findUniqueOrThrow: vi.fn(),
    delete: vi.fn(async () => ({})),
    count: vi.fn(async () => 3),
    updateMany: vi.fn(async () => ({ count: 0 })),
  },
  studioProject: {
    findUnique: vi.fn(async () => ({
      id: 'project-data-1',
      characters: [
        { name: 'Narrator', customVoiceUrl: 'https://voice.example/narrator.mp3' },
      ],
    })),
  },
  studioEpisode: {
    findFirst: vi.fn(async () => ({
      id: 'episode-1',
      speakerVoices: '{}',
    })),
  },
  studioVoiceLine: {
    findMany: vi.fn(async () => [
      { id: 'line-1', speaker: 'Narrator', content: 'hello world voice line' },
    ]),
    findFirst: vi.fn(async () => ({
      id: 'line-1',
      speaker: 'Narrator',
      content: 'hello world voice line',
    })),
  },
  $transaction: vi.fn(async (fn: (tx: {
    studioPanel: {
      findMany: (args: unknown) => Promise<Array<{ id: string; panelIndex: number }>>
      update: (args: unknown) => Promise<unknown>
      create: (args: { data?: { id?: string; panelIndex?: number } }) => Promise<{ id: string; panelIndex: number }>
      findFirst: (args: unknown) => Promise<{ panelIndex: number } | null>
      delete: (args: unknown) => Promise<unknown>
      count: (args: unknown) => Promise<number>
      updateMany: (args: unknown) => Promise<{ count: number }>
    }
    studioStoryboard: {
      update: (args: unknown) => Promise<unknown>
    }
  }) => Promise<unknown>) => {
    const tx = {
      studioPanel: {
        findMany: async () => [],
        update: async () => ({}),
        create: async (args: { data?: { id?: string; panelIndex?: number } }) => ({
          id: args.data?.id || 'panel-created',
          panelIndex: args.data?.panelIndex ?? 3,
        }),
        findFirst: async () => ({ panelIndex: 3 }),
        delete: async () => ({}),
        count: async () => 3,
        updateMany: async () => ({ count: 0 }),
      },
      studioStoryboard: {
        update: async () => ({}),
      },
    }
    return await fn(tx)
  }),
}))

vi.mock('@/lib/api-auth', () => {
  const unauthorized = () => new Response(
    JSON.stringify({ error: { code: 'UNAUTHORIZED' } }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )

  return {
    isErrorResponse: (value: unknown) => value instanceof Response,
    requireUserAuth: async () => {
      if (!authState.authenticated) return unauthorized()
      return { session: { user: { id: 'user-1' } } }
    },
    requireProjectAuth: async (projectId: string) => {
      if (!authState.authenticated) return unauthorized()
      return {
        session: { user: { id: 'user-1' } },
        project: { id: projectId, userId: 'user-1', mode: authState.projectMode },
      }
    },
    requireProjectAuthLight: async (projectId: string) => {
      if (!authState.authenticated) return unauthorized()
      return {
        session: { user: { id: 'user-1' } },
        project: { id: projectId, userId: 'user-1', mode: authState.projectMode },
      }
    },
  }
})

vi.mock('@/lib/task/submitter', () => ({
  submitTask: submitTaskMock,
}))
vi.mock('@/lib/task/resolve-locale', () => ({
  resolveRequiredTaskLocale: vi.fn(() => 'zh'),
}))
vi.mock('@/lib/config-service', () => configServiceMock)
vi.mock('@/lib/task/has-output', () => hasOutputMock)
vi.mock('@/lib/billing', () => ({
  buildDefaultTaskBillingInfo: vi.fn(() => ({ mode: 'default' })),
}))
vi.mock('@/lib/providers/bailian/voice-design', () => ({
  validateVoicePrompt: vi.fn(() => ({ valid: true })),
  validatePreviewText: vi.fn(() => ({ valid: true })),
}))
vi.mock('@/lib/media/outbound-image', () => ({
  sanitizeImageInputsForTaskPayload: vi.fn((inputs: unknown[]) => ({
    normalized: inputs
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
    issues: [] as Array<{ reason: string }>,
  })),
}))
vi.mock('@/lib/model-capabilities/lookup', () => ({
  resolveBuiltinCapabilitiesByModelKey: vi.fn(() => ({ video: { firstlastframe: true } })),
}))
vi.mock('@/lib/model-pricing/lookup', () => ({
  resolveBuiltinPricing: vi.fn(() => ({ status: 'ok' })),
}))
vi.mock('@/lib/api-config', () => ({
  resolveModelSelection: vi.fn(async () => ({
    model: 'img::storyboard',
  })),
  resolveModelSelectionOrSingle: vi.fn(async (_userId: string, model: string | null | undefined) => {
    const modelKey = typeof model === 'string' && model.trim().length > 0
      ? model.trim()
      : 'fal::audio-model'
    const separator = modelKey.indexOf('::')
    const provider = separator === -1 ? modelKey : modelKey.slice(0, separator)
    const modelId = separator === -1 ? modelKey : modelKey.slice(separator + 2)
    return {
      provider,
      modelId,
      modelKey,
      mediaType: 'audio',
    }
  }),
  getProviderKey: vi.fn((providerId: string) => {
    const marker = providerId.indexOf(':')
    return marker === -1 ? providerId : providerId.slice(0, marker)
  }),
}))
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function toApiPath(routeFile: string, params?: Record<string, string>): string {
  return routeFile
    .replace(/^src\/app/, '')
    .replace(/\/route\.ts$/, '')
    .replace('[projectId]', params?.projectId || 'project-1')
    .replace('[assetId]', params?.assetId || 'asset-1')
}

function toModuleImportPath(routeFile: string): string {
  return `@/${routeFile.replace(/^src\//, '').replace(/\.ts$/, '')}`
}

const DIRECT_CASES: ReadonlyArray<DirectRouteCase> = [
  {
    routeFile: 'src/app/api/asset-hub/generate-image/route.ts',
    body: { type: 'character', id: 'global-character-1', appearanceIndex: 0, artStyle: 'realistic' },
    expectedTaskType: TASK_TYPE.ASSET_HUB_IMAGE,
    expectedTargetType: 'GlobalCharacter',
    expectedProjectId: 'global-asset-hub',
  },
  {
    routeFile: 'src/app/api/asset-hub/modify-image/route.ts',
    body: {
      type: 'character',
      id: 'global-character-1',
      modifyPrompt: 'sharpen details',
      appearanceIndex: 0,
      imageIndex: 0,
      extraImageUrls: ['https://example.com/ref-a.png'],
    },
    expectedTaskType: TASK_TYPE.ASSET_HUB_MODIFY,
    expectedTargetType: 'GlobalCharacterAppearance',
    expectedProjectId: 'global-asset-hub',
  },
  {
    routeFile: 'src/app/api/assets/[assetId]/generate/route.ts',
    body: {
      scope: 'global',
      kind: 'character',
      appearanceIndex: 0,
      artStyle: 'realistic',
    },
    params: { assetId: 'global-character-1' },
    expectedTaskType: TASK_TYPE.ASSET_HUB_IMAGE,
    expectedTargetType: 'GlobalCharacter',
    expectedProjectId: 'global-asset-hub',
  },
  {
    routeFile: 'src/app/api/assets/[assetId]/generate/route.ts',
    body: {
      scope: 'project',
      kind: 'character',
      projectId: 'project-1',
      appearanceId: 'appearance-1',
    },
    params: { assetId: 'character-1' },
    expectedTaskType: TASK_TYPE.IMAGE_CHARACTER,
    expectedTargetType: 'CharacterAppearance',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/assets/[assetId]/modify-render/route.ts',
    body: {
      scope: 'global',
      kind: 'character',
      modifyPrompt: 'sharpen details',
      appearanceIndex: 0,
      imageIndex: 0,
      extraImageUrls: ['https://example.com/ref-a.png'],
    },
    params: { assetId: 'global-character-1' },
    expectedTaskType: TASK_TYPE.ASSET_HUB_MODIFY,
    expectedTargetType: 'GlobalCharacterAppearance',
    expectedProjectId: 'global-asset-hub',
  },
  {
    routeFile: 'src/app/api/assets/[assetId]/modify-render/route.ts',
    body: {
      scope: 'project',
      kind: 'character',
      projectId: 'project-1',
      appearanceId: 'appearance-1',
      modifyPrompt: 'enhance texture',
      extraImageUrls: ['https://example.com/ref-b.png'],
    },
    params: { assetId: 'character-1' },
    expectedTaskType: TASK_TYPE.MODIFY_ASSET_IMAGE,
    expectedTargetType: 'CharacterAppearance',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/asset-hub/voice-design/route.ts',
    body: { voicePrompt: 'female calm narrator', previewText: '你好世界' },
    expectedTaskType: TASK_TYPE.ASSET_HUB_VOICE_DESIGN,
    expectedTargetType: 'GlobalAssetHubVoiceDesign',
    expectedProjectId: 'global-asset-hub',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/generate-image/route.ts',
    body: { type: 'character', id: 'character-1', appearanceId: 'appearance-1' },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.IMAGE_CHARACTER,
    expectedTargetType: 'CharacterAppearance',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/generate-video/route.ts',
    body: { videoModel: 'fal::video-model', storyboardId: 'storyboard-1', panelIndex: 0 },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.VIDEO_PANEL,
    expectedTargetType: 'StudioPanel',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/insert-panel/route.ts',
    body: { storyboardId: 'storyboard-1', insertAfterPanelId: 'panel-ins' },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.INSERT_PANEL,
    expectedTargetType: 'StudioStoryboard',
    expectedProjectId: 'project-1',
    expectedPayloadSubset: {
      storyboardId: 'storyboard-1',
      insertAfterPanelId: 'panel-ins',
      userInput: '请根据前后镜头自动分析并插入一个自然衔接的新分镜。',
    },
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/lip-sync/route.ts',
    body: {
      storyboardId: 'storyboard-1',
      panelIndex: 0,
      voiceLineId: 'line-1',
      lipSyncModel: 'fal::lip-model',
    },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.LIP_SYNC,
    expectedTargetType: 'StudioPanel',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/modify-asset-image/route.ts',
    body: {
      type: 'character',
      characterId: 'character-1',
      appearanceId: 'appearance-1',
      modifyPrompt: 'enhance texture',
      extraImageUrls: ['https://example.com/ref-b.png'],
    },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.MODIFY_ASSET_IMAGE,
    expectedTargetType: 'CharacterAppearance',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/modify-storyboard-image/route.ts',
    body: {
      storyboardId: 'storyboard-1',
      panelIndex: 0,
      modifyPrompt: 'increase contrast',
      extraImageUrls: ['https://example.com/ref-c.png'],
      selectedAssets: [{ imageUrl: 'https://example.com/ref-d.png' }],
    },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.MODIFY_ASSET_IMAGE,
    expectedTargetType: 'StudioPanel',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/panel-variant/route.ts',
    body: {
      storyboardId: 'storyboard-1',
      insertAfterPanelId: 'panel-ins',
      sourcePanelId: 'panel-src',
      variant: { video_prompt: 'new prompt', description: 'variant desc' },
    },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.PANEL_VARIANT,
    expectedTargetType: 'StudioPanel',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/regenerate-group/route.ts',
    body: { type: 'character', id: 'character-1', appearanceId: 'appearance-1' },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.REGENERATE_GROUP,
    expectedTargetType: 'CharacterAppearance',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/regenerate-panel-image/route.ts',
    body: { panelId: 'panel-1', count: 1 },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.IMAGE_PANEL,
    expectedTargetType: 'StudioPanel',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/regenerate-single-image/route.ts',
    body: { type: 'character', id: 'character-1', appearanceId: 'appearance-1', imageIndex: 0 },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.IMAGE_CHARACTER,
    expectedTargetType: 'CharacterAppearance',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/regenerate-storyboard-text/route.ts',
    body: { storyboardId: 'storyboard-1' },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.REGENERATE_STORYBOARD_TEXT,
    expectedTargetType: 'StudioStoryboard',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/voice-design/route.ts',
    body: { voicePrompt: 'warm female voice', previewText: 'This is preview text' },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.VOICE_DESIGN,
    expectedTargetType: 'StudioProject',
    expectedProjectId: 'project-1',
  },
  {
    routeFile: 'src/app/api/studio/[projectId]/voice-generate/route.ts',
    body: { episodeId: 'episode-1', lineId: 'line-1', audioModel: 'fal::audio-model' },
    params: { projectId: 'project-1' },
    expectedTaskType: TASK_TYPE.VOICE_LINE,
    expectedTargetType: 'StudioVoiceLine',
    expectedProjectId: 'project-1',
  },
]

async function invokePostRoute(routeCase: DirectRouteCase): Promise<Response> {
  const modulePath = toModuleImportPath(routeCase.routeFile)
  const mod = await import(modulePath)
  const post = mod.POST as (request: Request, context?: RouteContext) => Promise<Response>
  const req = buildMockRequest({
    path: toApiPath(routeCase.routeFile, routeCase.params),
    method: 'POST',
    body: routeCase.body,
  })
  return await post(req, { params: Promise.resolve(routeCase.params || {}) })
}

describe('api contract - direct submit routes (behavior)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.authenticated = true
    authState.projectMode = 'studio'
    let seq = 0
    submitTaskMock.mockImplementation(async () => ({
      taskId: `task-${++seq}`,
      async: true,
    }))
  })

  it('keeps expected coverage size', () => {
    expect(DIRECT_CASES.length).toBe(20)
  })

  for (const routeCase of DIRECT_CASES) {
    it(`${routeCase.routeFile} -> returns 401 when unauthenticated`, async () => {
      authState.authenticated = false
      const res = await invokePostRoute(routeCase)
      expect(res.status).toBe(401)
      expect(submitTaskMock).not.toHaveBeenCalled()
    })

    it(`${routeCase.routeFile} -> submits task with expected contract when authenticated`, async () => {
      const res = await invokePostRoute(routeCase)
      expect(res.status).toBe(200)
      expect(submitTaskMock).toHaveBeenCalledWith(expect.objectContaining({
        type: routeCase.expectedTaskType,
        targetType: routeCase.expectedTargetType,
        projectId: routeCase.expectedProjectId,
        userId: 'user-1',
      }))

      const submitArg = submitTaskMock.mock.calls.at(-1)?.[0] as Record<string, unknown> | undefined
      expect(submitArg?.type).toBe(routeCase.expectedTaskType)
      expect(submitArg?.targetType).toBe(routeCase.expectedTargetType)
      expect(submitArg?.projectId).toBe(routeCase.expectedProjectId)
      expect(submitArg?.userId).toBe('user-1')
      if (routeCase.expectedPayloadSubset) {
        expect(submitArg?.payload).toEqual(expect.objectContaining(routeCase.expectedPayloadSubset))
      }

      const json = await res.json() as Record<string, unknown>
      const isVoiceGenerateRoute = routeCase.routeFile.endsWith('/voice-generate/route.ts')
      if (isVoiceGenerateRoute) {
        expect(json.success).toBe(true)
        expect(json.async).toBe(true)
        expect(typeof json.taskId).toBe('string')
      } else {
        expect(json.async).toBe(true)
        expect(typeof json.taskId).toBe('string')
      }
    })
  }
})
