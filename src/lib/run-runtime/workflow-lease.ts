import { TaskTerminatedError } from '@/lib/task/errors'
import { RUN_STATUS } from './types'
import { claimRunLease, getRunById, releaseRunLease, renewRunLease } from './service'

const DEFAULT_RUN_LEASE_MS = 30_000

export function getDefaultRunLeaseMs() {
  return DEFAULT_RUN_LEASE_MS
}

export async function assertWorkflowRunActive(params: {
  runId: string
  workerId: string
  stage: string
}) {
  const run = await getRunById(params.runId)
  if (!run) {
    throw new TaskTerminatedError(params.runId, `Run terminated during ${params.stage}: run not found`)
  }
  if (run.leaseOwner !== params.workerId) {
    throw new TaskTerminatedError(params.runId, `Run terminated during ${params.stage}: lease lost`)
  }
  if (
    run.status === RUN_STATUS.CANCELING
    || run.status === RUN_STATUS.CANCELED
    || run.status === RUN_STATUS.COMPLETED
    || run.status === RUN_STATUS.FAILED
  ) {
    throw new TaskTerminatedError(params.runId, `Run terminated during ${params.stage}`)
  }
}

export async function withWorkflowRunLease<T>(params: {
  runId: string
  userId: string
  workerId: string
  leaseMs?: number
  run: () => Promise<T>
}): Promise<{ claimed: boolean; result: T | null }> {
  const leaseMs = params.leaseMs ?? DEFAULT_RUN_LEASE_MS
  const claimed = await claimRunLease({
    runId: params.runId,
    userId: params.userId,
    workerId: params.workerId,
    leaseMs,
  })
  if (!claimed) {
    return { claimed: false, result: null }
  }

  const heartbeatTimer = setInterval(() => {
    void renewRunLease({
      runId: params.runId,
      userId: params.userId,
      workerId: params.workerId,
      leaseMs,
    })
  }, Math.max(5_000, Math.floor(leaseMs / 3)))

  try {
    return {
      claimed: true,
      result: await params.run(),
    }
  } finally {
    clearInterval(heartbeatTimer)
    await releaseRunLease({
      runId: params.runId,
      workerId: params.workerId,
    })
  }
}
