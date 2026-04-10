'use client'
import { useTranslations } from 'next-intl'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

type MergeState = 'idle' | 'submitting' | 'merging' | 'done' | 'error'

interface VideoToolbarProps {
  totalPanels: number
  runningCount: number
  videosWithUrl: number
  failedCount: number
  isAnyTaskRunning: boolean
  isDownloading: boolean
  onGenerateAll: () => void
  onDownloadAll: () => void
  onBack: () => void
  onEnterEditor?: () => void
  videosReady?: boolean
  mergeState?: MergeState
  mergeVideoUrl?: string | null
  onMergeVideos?: () => void
}

export default function VideoToolbar({
  totalPanels,
  runningCount,
  videosWithUrl,
  failedCount,
  isAnyTaskRunning,
  isDownloading,
  onGenerateAll,
  onDownloadAll,
  onBack,
  onEnterEditor,
  videosReady = false,
  mergeState = 'idle',
  mergeVideoUrl,
  onMergeVideos,
}: VideoToolbarProps) {
  const t = useTranslations('video')
  const videoTaskRunningState = isAnyTaskRunning
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'video',
      hasOutput: videosWithUrl > 0,
    })
    : null
  const videoDownloadState = isDownloading
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'video',
      hasOutput: videosWithUrl > 0,
    })
    : null
  return (
    <div className="glass-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-[var(--glass-text-secondary)]">
             {t('toolbar.title')}
          </span>
          <span className="text-sm text-[var(--glass-text-tertiary)]">
            {t('toolbar.totalShots', { count: totalPanels })}
            {runningCount > 0 && (
              <span className="text-[var(--glass-tone-info-fg)] ml-2 animate-pulse">({t('toolbar.generatingShots', { count: runningCount })})</span>
            )}
            {videosWithUrl > 0 && (
              <span className="text-[var(--glass-tone-success-fg)] ml-2">({t('toolbar.completedShots', { count: videosWithUrl })})</span>
            )}
            {failedCount > 0 && (
              <span className="text-[var(--glass-tone-danger-fg)] ml-2">({t('toolbar.failedShots', { count: failedCount })})</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateAll}
            disabled={isAnyTaskRunning}
            className="glass-btn-base glass-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnyTaskRunning ? (
              <TaskStatusInline state={videoTaskRunningState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              <>
                <AppIcon name="plus" className="w-4 h-4" />
                <span>{t('toolbar.generateAll')}</span>
              </>
            )}
          </button>
          <button
            onClick={onDownloadAll}
            disabled={videosWithUrl === 0 || isDownloading}
            className="glass-btn-base glass-btn-tone-info flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={videosWithUrl === 0 ? t('toolbar.noVideos') : t('toolbar.downloadCount', { count: videosWithUrl })}
          >
            {isDownloading ? (
              <TaskStatusInline state={videoDownloadState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              <>
                <AppIcon name="image" className="w-4 h-4" />
                <span>{t('toolbar.downloadAll')}</span>
              </>
            )}
          </button>
          {onMergeVideos && (
            <div className="relative group">
              {mergeState === 'done' && mergeVideoUrl ? (
                <a
                  href={mergeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="glass-btn-base glass-btn-tone-success flex items-center gap-2 px-4 py-2 text-sm font-medium"
                >
                  <AppIcon name="image" className="w-4 h-4" />
                  <span>{t('toolbar.mergeComplete')}</span>
                </a>
              ) : (
                <button
                  onClick={onMergeVideos}
                  disabled={videosWithUrl < 2 || mergeState === 'submitting' || mergeState === 'merging'}
                  className="glass-btn-base glass-btn-tone-info flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('toolbar.mergeVideosHint')}
                >
                  <AppIcon name="wandOff" className="w-4 h-4" />
                  <span>
                    {mergeState === 'submitting' || mergeState === 'merging'
                      ? t('toolbar.merging')
                      : mergeState === 'error'
                        ? t('toolbar.mergeFailed')
                        : t('toolbar.mergeVideos')}
                  </span>
                </button>
              )}
              <div className="absolute top-full right-0 mt-1 w-64 p-2 rounded-lg bg-[var(--glass-surface-overlay)] border border-[var(--glass-stroke-base)] text-xs text-[var(--glass-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {t('toolbar.mergeDisclaimer')}
              </div>
            </div>
          )}
          {onEnterEditor && (
            <button
              onClick={onEnterEditor}
              disabled={!videosReady}
              className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--glass-stroke-base)] disabled:opacity-50 disabled:cursor-not-allowed"
              title={videosReady ? t('toolbar.enterEditor') : t('panelCard.needVideo')}
            >
              <AppIcon name="wandOff" className="w-4 h-4" />
              <span>{t('toolbar.enterEdit')}</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--glass-stroke-base)] hover:text-[var(--glass-tone-info-fg)]"
          >
            <AppIcon name="chevronLeft" className="w-4 h-4" />
            <span>{t('toolbar.back')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
