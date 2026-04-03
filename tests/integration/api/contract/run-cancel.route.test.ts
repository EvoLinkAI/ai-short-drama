import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildMockRequest } from '../../../helpers/request'

const authState = vi.hoisted(() => ({ authenticated: true }))
const getRunByIdMock = vi.hoisted(() => vi.fn())
const requestRunCancelMock = vi.hoisted(() => vi.fn())
const cancelTaskMock = vi.hoisted(() => vi.fn())
const publishRunEventMock = vi.hoisted(() => vi.fn(async () => undefined))

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
  }
})

vi.mock('@/lib/run-runtime/service', () => ({
  getRunById: getRunByIdMock,
  requestRunCancel: requestRunCancelMock,
}))

vi.mock('@/lib/task/service', () => ({
  cancelTask: cancelTaskMock,
}))

vi.mock('@/lib/run-runtime/publisher', () => ({
  publishRunEvent: publishRunEventMock,
}))

describe('api contract - run cancel route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.authenticated = true
    getRunByIdMock.mockResolvedValue({
      id: 'run-1',
      userId: 'user-1',
      projectId: 'project-1',
      taskId: 'task-1',
    })
    requestRunCancelMock.mockResolvedValue({
      id: 'run-1',
      userId: 'user-1',
      projectId: 'project-1',
      taskId: 'task-1',
      status: 'canceling',
    })
    cancelTaskMock.mockResolvedValue({
      task: {
        id: 'task-1',
        status: 'canceled',
        errorCode: 'TASK_CANCELLED',
        errorMessage: 'Run cancelled by user',
      },
      cancelled: true,
    })
  })

  it('marks the run canceled and mirrors task cancellation without failing the task', async () => {
    const { POST } = await import('@/app/api/runs/[runId]/cancel/route')

    const req = buildMockRequest({
      path: '/api/runs/run-1/cancel',
      method: 'POST',
    })
    const res = await POST(req, {
      params: Promise.resolve({ runId: 'run-1' }),
    })

    expect(res.status).toBe(200)
    const payload = await res.json() as {
      success: boolean
      run: {
        id: string
        status: string
      }
    }
    expect(payload.success).toBe(true)
    expect(payload.run).toMatchObject({
      id: 'run-1',
      status: 'canceling',
    })
    expect(cancelTaskMock).toHaveBeenCalledWith('task-1', 'Run cancelled by user')
    expect(publishRunEventMock).toHaveBeenCalledWith(expect.objectContaining({
      runId: 'run-1',
      eventType: 'run.canceled',
    }))
  })
})
