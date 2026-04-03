import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useEffectMock, useRefMock } = vi.hoisted(() => ({
  useEffectMock: vi.fn(),
  useRefMock: vi.fn(),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useEffect: useEffectMock,
    useRef: useRefMock,
  }
})

import { useWorkspaceAutoRun } from '@/app/[locale]/workspace/[projectId]/modes/studio/hooks/useWorkspaceAutoRun'

describe('useWorkspaceAutoRun', () => {
  beforeEach(() => {
    useEffectMock.mockReset()
    useRefMock.mockReset()
    useRefMock.mockImplementation((initialValue: unknown) => ({
      current: initialValue,
    }))
  })

  it('consumes autoRun=storyToScript and starts the story-to-script flow once', async () => {
    const effectCallbacks: Array<() => void | (() => void)> = []
    const router = { replace: vi.fn() }
    const runWithRebuildConfirm = vi.fn(async () => undefined)
    const runStoryToScriptFlow = vi.fn(async () => undefined)

    useEffectMock.mockImplementation((callback: () => void | (() => void)) => {
      effectCallbacks.push(callback)
    })

    useWorkspaceAutoRun({
      searchParams: new URLSearchParams('episode=episode-1&autoRun=storyToScript'),
      router,
      episodeId: 'episode-1',
      novelText: '第一章内容',
      isTransitioning: false,
      isStoryToScriptRunning: false,
      runWithRebuildConfirm,
      runStoryToScriptFlow,
    })

    effectCallbacks[0]?.()

    expect(router.replace).toHaveBeenCalledWith('?episode=episode-1', { scroll: false })
    expect(runWithRebuildConfirm).toHaveBeenCalledWith('storyToScript', runStoryToScriptFlow)
  })

  it('does not auto-run when the episode text is still empty', () => {
    const effectCallbacks: Array<() => void | (() => void)> = []
    const router = { replace: vi.fn() }
    const runWithRebuildConfirm = vi.fn(async () => undefined)
    const runStoryToScriptFlow = vi.fn(async () => undefined)

    useEffectMock.mockImplementation((callback: () => void | (() => void)) => {
      effectCallbacks.push(callback)
    })

    useWorkspaceAutoRun({
      searchParams: new URLSearchParams('episode=episode-1&autoRun=storyToScript'),
      router,
      episodeId: 'episode-1',
      novelText: '   ',
      isTransitioning: false,
      isStoryToScriptRunning: false,
      runWithRebuildConfirm,
      runStoryToScriptFlow,
    })

    effectCallbacks[0]?.()

    expect(router.replace).not.toHaveBeenCalled()
    expect(runWithRebuildConfirm).not.toHaveBeenCalled()
  })
})
