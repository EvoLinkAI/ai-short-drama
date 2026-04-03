import type { Worker } from 'bullmq'
import type { TaskJobData } from '@/lib/task/types'

export type SystemWorkerScope = 'image' | 'video' | 'voice' | 'text'

export type SystemWorkers = Partial<Record<SystemWorkerScope, Worker<TaskJobData>>>

async function createWorker(scope: SystemWorkerScope): Promise<Worker<TaskJobData>> {
  if (scope === 'image') {
    const mod = await import('@/lib/workers/image.worker')
    return mod.createImageWorker()
  }
  if (scope === 'video') {
    const mod = await import('@/lib/workers/video.worker')
    return mod.createVideoWorker()
  }
  if (scope === 'voice') {
    const mod = await import('@/lib/workers/voice.worker')
    return mod.createVoiceWorker()
  }
  const mod = await import('@/lib/workers/text.worker')
  return mod.createTextWorker()
}

export async function startSystemWorkers(scopes: ReadonlyArray<SystemWorkerScope>): Promise<SystemWorkers> {
  const started: SystemWorkers = {}
  for (const scope of scopes) {
    const worker = await createWorker(scope)
    await worker.waitUntilReady()
    started[scope] = worker
  }
  return started
}

export async function stopSystemWorkers(workers: SystemWorkers): Promise<void> {
  for (const worker of Object.values(workers)) {
    if (!worker) continue
    await worker.close()
  }
}
