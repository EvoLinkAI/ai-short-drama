import { type Job } from 'bullmq'
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { prisma } from '@/lib/prisma'
import { uploadObject, getSignedUrl, toFetchableUrl } from '@/lib/storage'
import type { TaskJobData } from '@/lib/task/types'
import { reportTaskProgress } from '../shared'

const execFileAsync = promisify(execFile)

type AnyObj = Record<string, unknown>

// ─── Concurrency caps ───────────────────────────────────────────────
// MERGE is CPU-bound (libx264) and shares the same BullMQ video worker pool
// (default concurrency = 4) with IO-bound tasks (video_panel / lip_sync).
// If we let merge saturate that pool, API-wait tasks starve. A process-wide
// semaphore pins MERGE to a small subset of the pool.
const MERGE_PROCESS_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.MERGE_VIDEOS_CONCURRENCY || '2', 10) || 2,
)

type Waiter = () => void
let mergeActive = 0
const mergeWaiters: Waiter[] = []

async function acquireMergeSlot(): Promise<void> {
  if (mergeActive < MERGE_PROCESS_CONCURRENCY) {
    mergeActive += 1
    return
  }
  await new Promise<void>((resolve) => mergeWaiters.push(resolve))
  mergeActive += 1
}

function releaseMergeSlot(): void {
  mergeActive = Math.max(0, mergeActive - 1)
  const next = mergeWaiters.shift()
  if (next) next()
}

// ─── ffmpeg/ffprobe hardened execution ──────────────────────────────
const FFPROBE_TIMEOUT_MS = 30 * 1000
const NORMALIZE_TIMEOUT_MS = 5 * 60 * 1000
const CONCAT_TIMEOUT_MS = 5 * 60 * 1000
const DOWNLOAD_MAX_ATTEMPTS = 3
const DOWNLOAD_TIMEOUT_MS = 60 * 1000

async function runFfprobe(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('ffprobe', args, {
    timeout: FFPROBE_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024,
  })
  return stdout
}

async function runFfmpeg(args: string[], timeoutMs: number): Promise<void> {
  // `-nostdin` prevents ffmpeg from hanging waiting for tty input
  // `-v warning` keeps logs sane while still surfacing problems
  await execFileAsync('ffmpeg', ['-nostdin', '-v', 'warning', ...args], {
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
  })
}

async function downloadWithRetry(url: string, destPath: string): Promise<void> {
  let lastError: unknown
  for (let attempt = 1; attempt <= DOWNLOAD_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      await fs.writeFile(destPath, buffer)
      return
    } catch (err) {
      lastError = err
      if (attempt < DOWNLOAD_MAX_ATTEMPTS) {
        // Exponential backoff: 500ms, 1s, 2s
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)))
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error(
    `MERGE_VIDEOS: download failed after ${DOWNLOAD_MAX_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  )
}

/**
 * Merge all panel videos of an episode into a single video file.
 *
 * Concurrency safety model:
 *  1. BullMQ video worker pool (process)    — default 4
 *  2. Per-user merge gate (via withUserConcurrencyGate in video.worker.ts)
 *  3. Module-level MERGE_PROCESS_CONCURRENCY — pins merge ≤ 2 so video_panel
 *     / lip_sync still get slots while merges run.
 *
 * Flow:
 *  1. Query panels ordered by clip order + panelIndex
 *  2. Download each video to a temp directory (with retry)
 *  3. Probe first video for base resolution
 *  4. Normalize each video → MPEG-TS with uniform codec/resolution/audio
 *  5. Concat demuxer → single MP4 (zero-transcode)
 *  6. Upload result to storage
 *  7. Clean up temp files (always)
 */
export async function handleMergeEpisodeVideosTask(
  job: Job<TaskJobData>,
): Promise<Record<string, unknown>> {
  await acquireMergeSlot()
  try {
    return await runMergeEpisodeVideos(job)
  } finally {
    releaseMergeSlot()
  }
}

async function runMergeEpisodeVideos(
  job: Job<TaskJobData>,
): Promise<Record<string, unknown>> {
  const payload = (job.data.payload || {}) as AnyObj
  const episodeId = typeof payload.episodeId === 'string' ? payload.episodeId : null

  if (!episodeId) {
    throw new Error('MERGE_VIDEOS: episodeId is required')
  }

  // ── Step 1: Fetch all panels with video, ordered by clip + panelIndex ──
  await reportTaskProgress(job, 5, { stage: 'fetching_panels' })

  // Get clips in creation order (same ordering the frontend uses)
  const clips = await prisma.studioClip.findMany({
    where: { episodeId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  const clipOrder = new Map(clips.map((c, i) => [c.id, i]))

  const storyboards = await prisma.studioStoryboard.findMany({
    where: { episodeId },
    include: {
      panels: {
        orderBy: { panelIndex: 'asc' },
        select: {
          id: true,
          panelIndex: true,
          videoUrl: true,
          lipSyncVideoUrl: true,
        },
      },
    },
  })

  // Sort storyboards by their clip's creation order (matching frontend)
  storyboards.sort((a, b) => (clipOrder.get(a.clipId) ?? 999) - (clipOrder.get(b.clipId) ?? 999))

  // Collect panels with video URL, prefer lipSyncVideoUrl
  const videoPanels: { id: string; videoKey: string }[] = []
  for (const sb of storyboards) {
    for (const panel of sb.panels) {
      const videoKey = panel.lipSyncVideoUrl || panel.videoUrl
      if (videoKey) {
        videoPanels.push({ id: panel.id, videoKey })
      }
    }
  }

  if (videoPanels.length === 0) {
    throw new Error('MERGE_VIDEOS: No panels with video found')
  }

  if (videoPanels.length === 1) {
    return {
      mergedVideoKey: videoPanels[0].videoKey,
      videosCount: 1,
      skipped: true,
    }
  }

  // ── Step 2: Download all videos to temp directory (with retry) ──
  await reportTaskProgress(job, 10, { stage: 'downloading', total: videoPanels.length })

  // Sanitize taskId to keep dir name safe; only alnum/dash/underscore allowed.
  const safeTaskId = String(job.data.taskId).replace(/[^a-zA-Z0-9_-]/g, '_')
  const tmpDir = path.join(os.tmpdir(), `merge_${safeTaskId}_${Date.now()}`)
  await fs.mkdir(tmpDir, { recursive: true })

  try {
    const localBasenames: string[] = []
    for (let i = 0; i < videoPanels.length; i++) {
      const panel = videoPanels[i]
      const signedUrl = toFetchableUrl(getSignedUrl(panel.videoKey, 3600))
      const basename = `${String(i).padStart(4, '0')}.mp4`
      const localPath = path.join(tmpDir, basename)

      try {
        await downloadWithRetry(signedUrl, localPath)
      } catch (err) {
        throw new Error(
          `MERGE_VIDEOS: failed to download panel ${panel.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        )
      }
      localBasenames.push(basename)

      const progress = 10 + Math.round((i / videoPanels.length) * 30)
      await reportTaskProgress(job, progress, {
        stage: 'downloading',
        current: i + 1,
        total: videoPanels.length,
      })
    }

    // ── Step 3: Probe first video for base resolution ──
    await reportTaskProgress(job, 42, { stage: 'probing' })

    const probeOut = await runFfprobe([
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'csv=p=0',
      path.join(tmpDir, localBasenames[0]),
    ])
    const [baseWidth, baseHeight] = probeOut.trim().split(',').map(Number)
    if (!baseWidth || !baseHeight) {
      throw new Error('MERGE_VIDEOS: Failed to probe base video resolution')
    }

    // ── Step 4: Normalize each video (uniform resolution + audio track) ──
    await reportTaskProgress(job, 45, { stage: 'normalizing' })

    const normalizedBasenames: string[] = []
    for (let i = 0; i < localBasenames.length; i++) {
      const srcBasename = localBasenames[i]
      const normBasename = `norm_${String(i).padStart(4, '0')}.ts`
      const srcPath = path.join(tmpDir, srcBasename)
      const normPath = path.join(tmpDir, normBasename)

      // Check if source has audio stream (fall back to silent if absent)
      let hasAudio = false
      try {
        const audioProbe = await runFfprobe([
          '-v', 'error',
          '-select_streams', 'a',
          '-show_entries', 'stream=codec_type',
          '-of', 'csv=p=0',
          srcPath,
        ])
        hasAudio = audioProbe.trim().length > 0
      } catch {
        hasAudio = false
      }

      // Normalize: scale+pad to base resolution, add silent audio if missing,
      // output as MPEG-TS so concat demuxer can bitstream-copy later.
      const normArgs = [
        '-i', srcPath,
        ...(hasAudio ? [] : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100']),
        '-filter_complex',
        `[0:v]scale=${baseWidth}:${baseHeight}:force_original_aspect_ratio=decrease,` +
        `pad=${baseWidth}:${baseHeight}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[vout]`,
        '-map', '[vout]',
        '-map', hasAudio ? '0:a' : '1:a',
        ...(hasAudio ? [] : ['-shortest']),
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-y', normPath,
      ]

      await runFfmpeg(normArgs, NORMALIZE_TIMEOUT_MS)
      normalizedBasenames.push(normBasename)

      const progress = 45 + Math.round((i / localBasenames.length) * 25)
      await reportTaskProgress(job, progress, {
        stage: 'normalizing',
        current: i + 1,
        total: localBasenames.length,
      })
    }

    // ── Step 5: Concat via demuxer (relative paths, no shell quoting needed) ──
    await reportTaskProgress(job, 72, { stage: 'encoding' })

    const concatListPath = path.join(tmpDir, 'concat.txt')
    // Write only BASENAMES (not absolute paths). With cwd=tmpDir ffmpeg will
    // resolve them relative to the concat file's directory. This removes any
    // chance of injection via absolute-path substrings and keeps the list
    // file independent of tmpDir mount point.
    const concatContent = normalizedBasenames.map((b) => `file ${b}`).join('\n') + '\n'
    await fs.writeFile(concatListPath, concatContent)

    const outputBasename = 'merged.mp4'
    const outputPath = path.join(tmpDir, outputBasename)

    await execFileAsync(
      'ffmpeg',
      [
        '-nostdin', '-v', 'warning',
        '-f', 'concat', '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        '-movflags', '+faststart',
        '-y', outputBasename,
      ],
      {
        cwd: tmpDir,
        timeout: CONCAT_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
      },
    )

    await reportTaskProgress(job, 85, { stage: 'uploading' })

    // ── Step 6: Upload merged video ──
    const mergedBuffer = await fs.readFile(outputPath)
    const storageKey = `video/merged/${job.data.projectId}/${episodeId}/${job.data.taskId}.mp4`
    await uploadObject(mergedBuffer, storageKey, 3, 'video/mp4')

    await reportTaskProgress(job, 95, { stage: 'done' })

    return {
      mergedVideoKey: storageKey,
      videosCount: videoPanels.length,
    }
  } finally {
    // ── Step 7: Clean up temp files (always) ──
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
