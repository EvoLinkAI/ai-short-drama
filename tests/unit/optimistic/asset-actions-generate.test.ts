import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import type { TaskTargetOverlayMap } from '@/lib/query/task-target-overlay'

const {
  apiFetchMock,
  useQueryClientMock,
} = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  useQueryClientMock: vi.fn(),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => useQueryClientMock(),
  }
})

vi.mock('@/lib/api-fetch', () => ({
  apiFetch: apiFetchMock,
}))

import { useAssetActions } from '@/lib/query/hooks/useAssets'

function getOverlay(
  queryClient: QueryClient,
  projectId: string,
  key: string,
) {
  const map = queryClient.getQueryData<TaskTargetOverlayMap>(
    queryKeys.tasks.targetStateOverlay(projectId),
  ) || {}
  return map[key] || null
}

function createOkResponse() {
  return {
    ok: true,
    json: async () => ({ success: true }),
  } as Response
}

describe('useAssetActions.generate optimistic overlay', () => {
  beforeEach(() => {
    useQueryClientMock.mockReset()
    apiFetchMock.mockReset()
    apiFetchMock.mockResolvedValue(createOkResponse())
  })

  it('keeps global prop in generating state immediately after submit', async () => {
    const queryClient = new QueryClient()
    useQueryClientMock.mockReturnValue(queryClient)

    const actions = useAssetActions({ scope: 'global', kind: 'prop' })
    await actions.generate({ id: 'prop-1' })

    expect(apiFetchMock).toHaveBeenCalledWith('/api/assets/prop-1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'global',
        kind: 'prop',
        projectId: undefined,
        id: 'prop-1',
      }),
    })

    const overlay = getOverlay(queryClient, 'global-asset-hub', 'GlobalLocation:prop-1')
    expect(overlay?.phase).toBe('queued')
    expect(overlay?.intent).toBe('generate')
  })

  it('targets project prop generation overlay at the shared location-image task target', async () => {
    const queryClient = new QueryClient()
    useQueryClientMock.mockReturnValue(queryClient)

    const actions = useAssetActions({
      scope: 'project',
      projectId: 'project-1',
      kind: 'prop',
    })
    await actions.generate({ id: 'prop-2' })

    const overlay = getOverlay(queryClient, 'project-1', 'LocationImage:prop-2')
    expect(overlay?.phase).toBe('queued')
    expect(overlay?.intent).toBe('generate')
  })

  it('clears the overlay when prop generation submission fails', async () => {
    const queryClient = new QueryClient()
    useQueryClientMock.mockReturnValue(queryClient)
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response)

    const actions = useAssetActions({ scope: 'global', kind: 'prop' })

    await expect(actions.generate({ id: 'prop-3' })).rejects.toThrow('Failed to generate asset render')

    const overlay = getOverlay(queryClient, 'global-asset-hub', 'GlobalLocation:prop-3')
    expect(overlay).toBeNull()
  })
})
