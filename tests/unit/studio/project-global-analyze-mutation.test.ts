import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  useQueryClientMock,
  useMutationMock,
  requestTaskResponseWithErrorMock,
} = vi.hoisted(() => ({
  useQueryClientMock: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  useMutationMock: vi.fn((options: unknown) => options),
  requestTaskResponseWithErrorMock: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => useQueryClientMock(),
  useMutation: (options: unknown) => useMutationMock(options),
}))

vi.mock('@/lib/query/mutations/mutation-shared', async () => {
  const actual = await vi.importActual<typeof import('@/lib/query/mutations/mutation-shared')>(
    '@/lib/query/mutations/mutation-shared',
  )
  return {
    ...actual,
    requestTaskResponseWithError: requestTaskResponseWithErrorMock,
  }
})

import { useAnalyzeProjectGlobalAssets } from '@/lib/query/mutations/useProjectConfigMutations'

interface AnalyzeGlobalMutation {
  mutationFn: () => Promise<unknown>
}

describe('project global analyze mutation', () => {
  beforeEach(() => {
    useQueryClientMock.mockClear()
    useMutationMock.mockClear()
    requestTaskResponseWithErrorMock.mockReset()
  })

  it('returns async task submission instead of waiting for final task result', async () => {
    requestTaskResponseWithErrorMock.mockResolvedValue({
      json: async () => ({
        async: true,
        taskId: 'task-global-1',
        status: 'queued',
        deduped: false,
      }),
    } as Response)

    const mutation = useAnalyzeProjectGlobalAssets('project-1') as unknown as AnalyzeGlobalMutation
    const result = await mutation.mutationFn() as { taskId: string; async: boolean }

    expect(requestTaskResponseWithErrorMock).toHaveBeenCalledWith(
      '/api/studio/project-1/analyze-global',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ async: true }),
      },
      'Failed to analyze global assets',
    )
    expect(result).toEqual({
      async: true,
      taskId: 'task-global-1',
      status: 'queued',
      deduped: false,
    })
  })

  it('fails explicitly when route does not return an async task submission payload', async () => {
    requestTaskResponseWithErrorMock.mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response)

    const mutation = useAnalyzeProjectGlobalAssets('project-1') as unknown as AnalyzeGlobalMutation

    await expect(mutation.mutationFn()).rejects.toThrow('Failed to submit global asset analysis task')
  })
})
