'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api-fetch'

type MergeState = 'idle' | 'submitting' | 'merging' | 'done' | 'error'

interface MergeResult {
  mergedVideoKey?: string
  mergedVideoUrl?: string  // Derived from key — relative path for download
  videosCount?: number
}

/** Convert a storage key to a browser-relative download URL */
function storageKeyToDownloadUrl(key: string): string {
  return `/api/files/${encodeURIComponent(key)}`
}

interface UseMergeVideosParams {
  projectId: string
  episodeId: string
}

/** Poll interval for checking task completion (ms) */
const POLL_INTERVAL = 2000
const MAX_POLL_ATTEMPTS = 300 // 10 minutes max

export function useMergeVideos({ projectId, episodeId }: UseMergeVideosParams) {
  const [mergeState, setMergeState] = useState<MergeState>('idle')
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null)
  const [mergeError, setMergeError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptRef = useRef(0)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    attemptRef.current = 0
  }, [])

  const startPolling = useCallback((taskId: string) => {
    stopPolling()
    attemptRef.current = 0

    pollRef.current = setInterval(async () => {
      attemptRef.current++
      if (attemptRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling()
        setMergeState('error')
        setMergeError('Merge timed out')
        return
      }

      try {
        const res = await apiFetch(`/api/tasks/${taskId}`)
        // 401/403 — session gone; fail fast instead of silently retrying
        // for 10 minutes and leaving the user stuck on "merging".
        if (res.status === 401 || res.status === 403) {
          stopPolling()
          setMergeState('error')
          setMergeError('Session expired — please sign in again')
          return
        }
        if (!res.ok) return // transient — retry on next tick

        const data = await res.json()
        const task = data?.task
        if (!task) return

        if (task.status === 'completed') {
          stopPolling()
          const result = typeof task.result === 'object' && task.result ? task.result : {}
          const key = typeof result.mergedVideoKey === 'string' ? result.mergedVideoKey : undefined
          const url = key ? storageKeyToDownloadUrl(key) : undefined
          setMergeResult({
            mergedVideoKey: key,
            mergedVideoUrl: url,
            videosCount: typeof result.videosCount === 'number' ? result.videosCount : undefined,
          })
          setMergeState('done')
          // Auto-trigger download
          if (url) {
            const a = document.createElement('a')
            a.href = url
            a.download = ''
            a.click()
          }
        } else if (task.status === 'failed' || task.status === 'canceled') {
          stopPolling()
          setMergeState('error')
          setMergeError(task.error?.message || 'Merge failed')
        }
        // else: still processing, keep polling
      } catch {
        // Network error — keep polling, don't fail immediately
      }
    }, POLL_INTERVAL)
  }, [stopPolling])

  const handleMergeVideos = useCallback(async () => {
    if (mergeState === 'submitting' || mergeState === 'merging') return

    setMergeState('submitting')
    setMergeError(null)
    setMergeResult(null)

    try {
      const response = await apiFetch(`/api/studio/${projectId}/merge-episode-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit merge task')
      }

      if (data.deduped && data.status === 'completed') {
        // Task already completed — fetch result directly
        const taskRes = await apiFetch(`/api/tasks/${data.taskId}`)
        if (taskRes.ok) {
          const taskData = await taskRes.json()
          const result = taskData?.task?.result || {}
          const key = typeof result.mergedVideoKey === 'string' ? result.mergedVideoKey : undefined
          setMergeResult({
            mergedVideoKey: key,
            mergedVideoUrl: key ? storageKeyToDownloadUrl(key) : undefined,
            videosCount: typeof result.videosCount === 'number' ? result.videosCount : undefined,
          })
        }
        setMergeState('done')
        return
      }

      setMergeState('merging')
      startPolling(data.taskId)
    } catch (err) {
      setMergeState('error')
      setMergeError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [projectId, episodeId, mergeState, startPolling])

  const resetMerge = useCallback(() => {
    stopPolling()
    setMergeState('idle')
    setMergeResult(null)
    setMergeError(null)
  }, [stopPolling])

  return {
    mergeState,
    mergeResult,
    mergeError,
    handleMergeVideos,
    resetMerge,
  }
}
