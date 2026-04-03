import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildMockRequest } from '../../../helpers/request'

const authMock = vi.hoisted(() => ({
  requireProjectAuth: vi.fn(async () => ({
    novelData: { id: 'np-1', projectId: 'project-1' },
  })),
  isErrorResponse: vi.fn((value: unknown) => value instanceof Response),
}))

const prismaMock = vi.hoisted(() => ({
  studioEpisode: {
    findFirst: vi.fn(async () => null),
    create: vi.fn(async () => ({
      id: 'episode-1',
      studioProjectId: 'np-1',
      episodeNumber: 1,
      name: '第 1 集',
      description: null,
      novelText: '第一章内容',
    })),
  },
  studioProject: {
    update: vi.fn(async () => ({
      id: 'np-1',
      lastEpisodeId: 'episode-1',
    })),
  },
}))

vi.mock('@/lib/api-auth', () => authMock)
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

describe('api specific - studio episode create text', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists novelText when creating the first episode from home launch', async () => {
    const mod = await import('@/app/api/studio/[projectId]/episodes/route')
    const req = buildMockRequest({
      path: '/api/studio/project-1/episodes',
      method: 'POST',
      body: {
        name: '第 1 集',
        novelText: '第一章内容',
      },
    })

    const res = await mod.POST(req, { params: Promise.resolve({ projectId: 'project-1' }) })

    expect(res.status).toBe(201)
    expect(prismaMock.studioEpisode.create).toHaveBeenCalledWith({
      data: {
        studioProjectId: 'np-1',
        episodeNumber: 1,
        name: '第 1 集',
        description: null,
        novelText: '第一章内容',
      },
    })
    expect(prismaMock.studioProject.update).toHaveBeenCalledWith({
      where: { id: 'np-1' },
      data: { lastEpisodeId: 'episode-1' },
    })
  })
})
