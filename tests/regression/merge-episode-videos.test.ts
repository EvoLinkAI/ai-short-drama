import { describe, expect, it } from 'vitest'
import { TASK_TYPE } from '@/lib/task/types'
import { getQueueTypeByTaskType } from '@/lib/task/queues'

const fs = await import('fs/promises')
const path = await import('path')

/**
 * Regression: merge_episode_videos feature — task type registration,
 * queue routing, worker handler, and API route.
 */

describe('merge-episode-videos feature', () => {
  it('MERGE_EPISODE_VIDEOS is registered in TASK_TYPE enum', () => {
    expect(TASK_TYPE.MERGE_EPISODE_VIDEOS).toBe('merge_episode_videos')
  })

  it('MERGE_EPISODE_VIDEOS routes to video queue', () => {
    expect(getQueueTypeByTaskType(TASK_TYPE.MERGE_EPISODE_VIDEOS)).toBe('video')
  })

  it('worker handler file exists', async () => {
    const handlerPath = path.join(process.cwd(), 'src/lib/workers/handlers/merge-videos.ts')
    const stat = await fs.stat(handlerPath)
    expect(stat.isFile()).toBe(true)
  })

  it('video worker imports and dispatches merge handler', async () => {
    const workerPath = path.join(process.cwd(), 'src/lib/workers/video.worker.ts')
    const source = await fs.readFile(workerPath, 'utf-8')
    expect(source).toContain('handleMergeEpisodeVideosTask')
    expect(source).toContain('TASK_TYPE.MERGE_EPISODE_VIDEOS')
  })

  it('API route exists and requires auth', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/studio/[projectId]/merge-episode-videos/route.ts')
    const source = await fs.readFile(routePath, 'utf-8')
    expect(source).toContain('requireProjectAuthLight')
    expect(source).toContain('TASK_TYPE.MERGE_EPISODE_VIDEOS')
    expect(source).toContain('merge_videos:')
  })

  it('task intent is registered for MERGE_EPISODE_VIDEOS', async () => {
    const intentPath = path.join(process.cwd(), 'src/lib/task/intent.ts')
    const source = await fs.readFile(intentPath, 'utf-8')
    expect(source).toContain('MERGE_EPISODE_VIDEOS')
  })
})
