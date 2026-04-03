import { TASK_EVENT_TYPE, TASK_STATUS, type TaskEventType, type TaskStatus } from '@/lib/task/types'
import { expect } from 'vitest'
import { prisma } from '../../helpers/prisma'

type WaitTaskOptions = {
  timeoutMs?: number
  intervalMs?: number
}

const TERMINAL_STATUSES = new Set<TaskStatus>([
  TASK_STATUS.COMPLETED,
  TASK_STATUS.FAILED,
  TASK_STATUS.CANCELED,
  TASK_STATUS.DISMISSED,
])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForTaskTerminalState(taskId: string, options: WaitTaskOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 15_000
  const intervalMs = options.intervalMs ?? 100
  const startedAt = Date.now()

  while (Date.now() - startedAt <= timeoutMs) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })
    if (task && TERMINAL_STATUSES.has(task.status as TaskStatus)) {
      return task
    }
    await sleep(intervalMs)
  }

  throw new Error(`TASK_WAIT_TIMEOUT: ${taskId}`)
}

export async function listTaskEventTypes(taskId: string): Promise<TaskEventType[]> {
  const events = await prisma.taskEvent.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
    select: { eventType: true },
  })
  return events.map((event) => event.eventType as TaskEventType)
}

export function expectLifecycleEvents(types: ReadonlyArray<TaskEventType>, terminal: 'completed' | 'failed') {
  const expectedTerminal = terminal === 'completed' ? TASK_EVENT_TYPE.COMPLETED : TASK_EVENT_TYPE.FAILED
  expect(types).toContain(TASK_EVENT_TYPE.CREATED)
  expect(types).toContain(TASK_EVENT_TYPE.PROCESSING)
  expect(types).toContain(expectedTerminal)
}
