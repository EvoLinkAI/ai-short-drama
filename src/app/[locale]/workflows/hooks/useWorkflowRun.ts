'use client'

import { useState, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api-fetch'

export type WorkflowStatus =
  | 'idle'
  | 'generating_image'
  | 'image_done'
  | 'generating_video'
  | 'video_done'
  | 'error'

interface WorkflowRunParams {
  imagePrompt: string
  videoPrompt: string
  imageModel?: string
  videoModel?: string
  size?: string
  resolution?: string
  quality?: string
  duration?: number
}

interface WorkflowRunState {
  status: WorkflowStatus
  imageUrl: string | null
  videoUrl: string | null
  progress: number
  error: string | null
}

const POLL_INTERVAL = 3000
const POLL_TIMEOUT = 300_000

async function submitStep(params: Record<string, unknown>): Promise<string> {
  const res = await apiFetch('/api/workflows/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Submit failed (${res.status})`)
  return data.taskId
}

async function pollTask(taskId: string): Promise<{ resultUrls: string[]; error: string | null }> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    const res = await apiFetch(`/api/workflows/task/${encodeURIComponent(taskId)}`)
    const data = await res.json()
    if (data.status === 'completed') {
      return { resultUrls: data.resultUrls || [], error: null }
    }
    if (data.status === 'failed') {
      return { resultUrls: [], error: data.error || 'Task failed' }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }
  return { resultUrls: [], error: 'Timeout waiting for result' }
}

export function useWorkflowRun() {
  const [state, setState] = useState<WorkflowRunState>({
    status: 'idle',
    imageUrl: null,
    videoUrl: null,
    progress: 0,
    error: null,
  })
  const abortRef = useRef(false)

  const run = useCallback(async (params: WorkflowRunParams) => {
    abortRef.current = false
    setState({ status: 'generating_image', imageUrl: null, videoUrl: null, progress: 10, error: null })

    try {
      const imageTaskId = await submitStep({
        step: 'image',
        prompt: params.imagePrompt,
        model: params.imageModel || 'gpt-image-2',
        size: params.size || '16:9',
        resolution: params.resolution,
        quality: params.quality,
      })

      setState((s) => ({ ...s, progress: 25 }))
      const imageResult = await pollTask(imageTaskId)
      if (abortRef.current) return
      if (imageResult.error || imageResult.resultUrls.length === 0) {
        setState((s) => ({ ...s, status: 'error', error: imageResult.error || 'No image generated' }))
        return
      }

      const imageUrl = imageResult.resultUrls[0]
      setState({ status: 'image_done', imageUrl, videoUrl: null, progress: 50, error: null })

      // small pause for UX — let user see the image
      await new Promise((r) => setTimeout(r, 800))
      if (abortRef.current) return

      setState((s) => ({ ...s, status: 'generating_video', progress: 60 }))
      const videoTaskId = await submitStep({
        step: 'video',
        prompt: params.videoPrompt,
        imageUrl,
        model: params.videoModel || 'seedance-2.0',
        size: params.size || '16:9',
        duration: params.duration || 5,
      })

      setState((s) => ({ ...s, progress: 75 }))
      const videoResult = await pollTask(videoTaskId)
      if (abortRef.current) return
      if (videoResult.error || videoResult.resultUrls.length === 0) {
        setState((s) => ({ ...s, status: 'error', error: videoResult.error || 'No video generated' }))
        return
      }

      setState({ status: 'video_done', imageUrl, videoUrl: videoResult.resultUrls[0], progress: 100, error: null })
    } catch (err) {
      if (!abortRef.current) {
        setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }))
      }
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    setState({ status: 'idle', imageUrl: null, videoUrl: null, progress: 0, error: null })
  }, [])

  return { ...state, run, reset }
}
