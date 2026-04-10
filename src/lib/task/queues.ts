import { JobsOptions, Queue } from 'bullmq'
import { queueRedis } from '@/lib/redis'
import { QueueType, TaskType, TASK_TYPE, type TaskJobData } from './types'

export const QUEUE_NAME = {
  IMAGE: 'aidrama-studio-image',
  VIDEO: 'aidrama-studio-video',
  VOICE: 'aidrama-studio-voice',
  TEXT: 'aidrama-studio-text',
} as const

const defaultJobOptions: JobsOptions = {
  removeOnComplete: 300,
  removeOnFail: 200,
  attempts: 4,
  backoff: {
    type: 'exponential',
    delay: 3_000,
  },
}

export const imageQueue = new Queue<TaskJobData>(QUEUE_NAME.IMAGE, {
  connection: queueRedis,
  defaultJobOptions,
})

export const videoQueue = new Queue<TaskJobData>(QUEUE_NAME.VIDEO, {
  connection: queueRedis,
  defaultJobOptions,
})

export const voiceQueue = new Queue<TaskJobData>(QUEUE_NAME.VOICE, {
  connection: queueRedis,
  defaultJobOptions,
})

export const textQueue = new Queue<TaskJobData>(QUEUE_NAME.TEXT, {
  connection: queueRedis,
  defaultJobOptions,
})

const ALL_QUEUES = [imageQueue, videoQueue, voiceQueue, textQueue]

const IMAGE_TYPES = new Set<TaskType>([
  TASK_TYPE.IMAGE_PANEL,
  TASK_TYPE.IMAGE_CHARACTER,
  TASK_TYPE.IMAGE_LOCATION,
  TASK_TYPE.PANEL_VARIANT,
  TASK_TYPE.MODIFY_ASSET_IMAGE,
  TASK_TYPE.REGENERATE_GROUP,
  TASK_TYPE.ASSET_HUB_IMAGE,
  TASK_TYPE.ASSET_HUB_MODIFY,
])

const VIDEO_TYPES = new Set<TaskType>([TASK_TYPE.VIDEO_PANEL, TASK_TYPE.LIP_SYNC, TASK_TYPE.MERGE_EPISODE_VIDEOS])
const VOICE_TYPES = new Set<TaskType>([
  TASK_TYPE.VOICE_LINE,
  TASK_TYPE.VOICE_DESIGN,
  TASK_TYPE.ASSET_HUB_VOICE_DESIGN,
])

const SINGLE_ATTEMPT_TASK_TYPES = new Set<TaskType>([
  TASK_TYPE.STORY_TO_SCRIPT_RUN,
  TASK_TYPE.SCRIPT_TO_STORYBOARD_RUN,
])

export function getQueueTypeByTaskType(type: TaskType): QueueType {
  if (IMAGE_TYPES.has(type)) return 'image'
  if (VIDEO_TYPES.has(type)) return 'video'
  if (VOICE_TYPES.has(type)) return 'voice'
  return 'text'
}

export function getQueueByType(type: QueueType) {
  switch (type) {
    case 'image':
      return imageQueue
    case 'video':
      return videoQueue
    case 'voice':
      return voiceQueue
    case 'text':
    default:
      return textQueue
  }
}

export async function addTaskJob(data: TaskJobData, opts?: JobsOptions) {
  const queueType = getQueueTypeByTaskType(data.type)
  const queue = getQueueByType(queueType)
  const priority = typeof opts?.priority === 'number' ? opts.priority : 0
  const attempts = SINGLE_ATTEMPT_TASK_TYPES.has(data.type)
    ? 1
    : (typeof opts?.attempts === 'number' ? opts.attempts : undefined)
  return await queue.add(data.type, data, {
    jobId: data.taskId,
    priority,
    ...(opts || {}),
    ...(attempts !== undefined ? { attempts } : {}),
  })
}

export async function removeTaskJob(taskId: string) {
  for (const queue of ALL_QUEUES) {
    const job = await queue.getJob(taskId)
    if (!job) continue
    await job.remove()
    return true
  }
  return false
}
