'use client'

import { AppIcon, type AppIconName } from '@/components/ui/icons'

interface WorkspaceSidebarProps {
  episodes: Array<{ id: string; name: string; episodeNumber: number }>
  currentEpisodeId: string | null
  onEpisodeSelect: (id: string) => void
  onEpisodeCreate?: () => void

  stages: Array<{
    id: string
    label: string
    icon: AppIconName
    disabled?: boolean
    status?: 'idle' | 'processing' | 'ready' | 'error'
  }>
  currentStage: string
  onStageChange: (stage: string) => void

  onOpenAssetLibrary?: () => void
  onOpenSettings?: () => void
  onRefresh?: () => void

  projectName?: string
}

const statusDot: Record<string, string> = {
  processing: 'w-2 h-2 rounded-full bg-amber-400 animate-pulse',
  ready: 'w-2 h-2 rounded-full bg-emerald-500',
  error: 'w-2 h-2 rounded-full bg-red-500',
}

export default function WorkspaceSidebar({
  episodes,
  currentEpisodeId,
  onEpisodeSelect,
  onEpisodeCreate,
  stages,
  currentStage,
  onStageChange,
  onOpenAssetLibrary,
  onOpenSettings,
  onRefresh,
  projectName,
}: WorkspaceSidebarProps) {
  return (
    <aside className="w-[200px] h-full flex-shrink-0 bg-white border-r border-[#e5e5e5] flex flex-col overflow-y-auto">
      {/* Project / Episode */}
      <div className="p-4 border-b border-[#e5e5e5]">
        {projectName && (
          <div className="text-sm font-semibold text-[#171717] truncate mb-2">
            {projectName}
          </div>
        )}

        <div className="flex items-center gap-1">
          <select
            value={currentEpisodeId ?? ''}
            onChange={(e) => onEpisodeSelect(e.target.value)}
            className="flex-1 min-w-0 text-sm text-[#525252] bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-2 py-1.5 outline-none focus:border-[#171717] transition-colors"
          >
            {episodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                EP{ep.episodeNumber} {ep.name}
              </option>
            ))}
          </select>

          {onEpisodeCreate && (
            <button
              onClick={onEpisodeCreate}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[#525252] hover:bg-[#f5f5f5] transition-colors"
            >
              <AppIcon name="plus" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stage Navigation */}
      <nav className="p-3 space-y-1">
        {stages.map((stage) => {
          const isActive = stage.id === currentStage
          const dot = stage.status && stage.status !== 'idle' ? statusDot[stage.status] : null

          return (
            <button
              key={stage.id}
              onClick={() => onStageChange(stage.id)}
              disabled={stage.disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#171717] text-white font-medium'
                  : 'text-[#525252] hover:bg-[#f5f5f5]'
              } ${stage.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <AppIcon name={stage.icon} className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{stage.label}</span>
              {dot && <span className={`ml-auto flex-shrink-0 ${dot}`} />}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions — pinned to bottom */}
      <div className="mt-auto p-3 border-t border-[#e5e5e5] space-y-1">
        {onOpenAssetLibrary && (
          <button
            onClick={onOpenAssetLibrary}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#525252] hover:bg-[#f5f5f5] transition-colors"
          >
            <AppIcon name="folderOpen" className="w-4 h-4" />
            <span>Asset Library</span>
          </button>
        )}

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#525252] hover:bg-[#f5f5f5] transition-colors"
          >
            <AppIcon name="settingsHex" className="w-4 h-4" />
            <span>Settings</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#525252] hover:bg-[#f5f5f5] transition-colors"
          >
            <AppIcon name="refresh" className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </aside>
  )
}
