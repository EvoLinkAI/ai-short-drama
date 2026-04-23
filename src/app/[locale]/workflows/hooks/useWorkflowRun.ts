'use client'

import { useState, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api-fetch'

export type WorkflowStatus =
  | 'idle'
  | 'generating_music'
  | 'music_done'
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
  musicPrompt?: string
  musicStyle?: string
  musicTitle?: string
}

interface WorkflowRunState {
  status: WorkflowStatus
  musicUrl: string | null
  imageUrl: string | null
  videoUrl: string | null
  progress: number
  error: string | null
}

const POLL_INTERVAL = 4000
const POLL_TIMEOUT = 600_000

async function submitStep(params: Record<string, unknown>): Promise<string> {
  const res = await apiFetch('/api/workflows/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) {
    const raw = data?.error ?? data?.message ?? ''
    const msg = typeof raw === 'string' ? raw
      : typeof raw?.message === 'string' ? raw.message
      : `Submit failed (${res.status})`
    if (msg.includes('not configured') || msg.includes('PROVIDER_NOT_FOUND')) {
      throw new Error('API_KEY_REQUIRED')
    }
    throw new Error(msg)
  }
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
    musicUrl: null,
    imageUrl: null,
    videoUrl: null,
    progress: 0,
    error: null,
  })
  const abortRef = useRef(false)

  const run = useCallback(async (params: WorkflowRunParams) => {
    abortRef.current = false
    const hasMusic = !!params.musicPrompt

    // ── Step 0: Music (optional, only for music-video workflow) ──
    let musicUrl: string | null = null
    if (hasMusic) {
      setState({ status: 'generating_music', musicUrl: null, imageUrl: null, videoUrl: null, progress: 5, error: null })

      try {
        const musicTaskId = await submitStep({
          step: 'music',
          prompt: params.musicPrompt,
          style: params.musicStyle || '',
          title: params.musicTitle || 'Workflow Track',
          customMode: true,
          instrumental: false,
        })

        setState((s) => ({ ...s, progress: 12 }))
        const musicResult = await pollTask(musicTaskId)
        if (abortRef.current) return
        if (musicResult.error || musicResult.resultUrls.length === 0) {
          setState((s) => ({ ...s, status: 'error', error: musicResult.error || 'No music generated' }))
          return
        }

        musicUrl = musicResult.resultUrls[0]
        setState((s) => ({ ...s, status: 'music_done', musicUrl, progress: 20 }))
        await new Promise((r) => setTimeout(r, 800))
        if (abortRef.current) return
      } catch (err) {
        if (!abortRef.current) {
          setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Music generation failed' }))
        }
        return
      }
    }

    // ── Step 1: Image ──
    setState((s) => ({ ...s, status: 'generating_image', progress: hasMusic ? 25 : 10 }))

    try {
      const imageTaskId = await submitStep({
        step: 'image',
        prompt: params.imagePrompt,
        model: params.imageModel || 'gpt-image-2',
        size: params.size || '16:9',
        resolution: params.resolution,
        quality: params.quality,
      })

      setState((s) => ({ ...s, progress: hasMusic ? 35 : 25 }))
      const imageResult = await pollTask(imageTaskId)
      if (abortRef.current) return
      if (imageResult.error || imageResult.resultUrls.length === 0) {
        setState((s) => ({ ...s, status: 'error', error: imageResult.error || 'No image generated' }))
        return
      }

      const imageUrl = imageResult.resultUrls[0]
      setState((s) => ({ ...s, status: 'image_done', imageUrl, progress: hasMusic ? 55 : 50 }))
      await new Promise((r) => setTimeout(r, 800))
      if (abortRef.current) return

      // ── Step 2: Video ──
      setState((s) => ({ ...s, status: 'generating_video', progress: 60 }))
      const videoStepParams: Record<string, unknown> = {
        step: 'video',
        prompt: params.videoPrompt,
        imageUrl,
        size: params.size || '16:9',
        duration: params.duration || 10,
      }
      if (musicUrl) {
        videoStepParams.audioUrl = musicUrl
      }
      const videoTaskId = await submitStep(videoStepParams)

      setState((s) => ({ ...s, progress: 75 }))
      const videoResult = await pollTask(videoTaskId)
      if (abortRef.current) return
      if (videoResult.error || videoResult.resultUrls.length === 0) {
        setState((s) => ({ ...s, status: 'error', error: videoResult.error || 'No video generated' }))
        return
      }

      setState({ status: 'video_done', musicUrl, imageUrl, videoUrl: videoResult.resultUrls[0], progress: 100, error: null })
    } catch (err) {
      if (!abortRef.current) {
        setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }))
      }
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    setState({ status: 'idle', musicUrl: null, imageUrl: null, videoUrl: null, progress: 0, error: null })
  }, [])

  return { ...state, run, reset }
}
