'use client'

import ProgressToast from '@/components/ProgressToast'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useTranslations } from 'next-intl'
import { WorkspaceProvider } from './WorkspaceProvider'
import WorkspaceRunStreamConsoles from './components/WorkspaceRunStreamConsoles'
import WorkspaceStageContent from './components/WorkspaceStageContent'
import WorkspaceAssetLibraryModal from './components/WorkspaceAssetLibraryModal'
import WorkspaceHeaderShell from './components/WorkspaceHeaderShell'
import WorkspaceSidebar from './components/WorkspaceSidebar'
import { WorkspaceStageRuntimeProvider } from './WorkspaceStageRuntimeContext'
import { useStudioWorkspaceController } from './hooks/useStudioWorkspaceController'
import type { StudioWorkspaceProps } from './types'
import type { AppIconName } from '@/components/ui/icons'
import '@/styles/animations.css'

const stageIconMap: Record<string, AppIconName> = {
  config: 'fileText',
  script: 'bookOpen',
  storyboard: 'image',
  videos: 'video',
  voice: 'mic',
  editor: 'film',
}

function StudioWorkspaceContent(props: StudioWorkspaceProps) {
  const vm = useStudioWorkspaceController(props)
  const tProgress = useTranslations('progress')

  const {
    project,
    projectId,
    episodeId,
    episodes = [],
    onEpisodeSelect,
    onEpisodeCreate,
    onEpisodeRename,
    onEpisodeDelete,
  } = props

  const storyToScriptStream = vm.execution.storyToScriptStream
  const scriptToStoryboardStream = vm.execution.scriptToStoryboardStream
  const storyToScriptActive =
    storyToScriptStream.isRunning ||
    storyToScriptStream.isRecoveredRunning ||
    storyToScriptStream.status === 'running'
  const scriptToStoryboardActive =
    scriptToStoryboardStream.isRunning ||
    scriptToStoryboardStream.isRecoveredRunning ||
    scriptToStoryboardStream.status === 'running'

  const showStoryToScriptMinBadge =
    storyToScriptStream.isVisible &&
    storyToScriptStream.stages.length > 0 &&
    storyToScriptActive &&
    vm.execution.storyToScriptConsoleMinimized

  const showScriptToStoryboardMinBadge =
    scriptToStoryboardStream.isVisible &&
    scriptToStoryboardStream.stages.length > 0 &&
    scriptToStoryboardActive &&
    vm.execution.scriptToStoryboardConsoleMinimized

  const runBadges: { id: string; label: string; onClick: () => void }[] = []

  if (showStoryToScriptMinBadge) {
    runBadges.push({
      id: 'story-to-script',
      label: tProgress('runConsole.storyToScriptRunning'),
      onClick: () => vm.execution.setStoryToScriptConsoleMinimized(false),
    })
  }

  if (showScriptToStoryboardMinBadge) {
    runBadges.push({
      id: 'script-to-storyboard',
      label: tProgress('runConsole.scriptToStoryboardRunning'),
      onClick: () => vm.execution.setScriptToStoryboardConsoleMinimized(false),
    })
  }

  if (!vm.project.projectData) {
    return <div className="text-center text-[#525252]">{vm.i18n.tc('loading')}</div>
  }

  const sidebarStages = vm.stageNav.capsuleNavItems
    .filter(item => item.id !== 'editor')
    .map(item => ({
      id: item.id,
      label: item.label,
      icon: stageIconMap[item.id] || 'fileText',
      disabled: item.disabled,
      status: item.status === 'processing' ? 'processing' as const : item.status === 'ready' ? 'ready' as const : 'idle' as const,
    }))

  return (
    <>
    <div className="flex h-full overflow-hidden">
        {/* Left sidebar */}
        <WorkspaceSidebar
          episodes={episodes}
          currentEpisodeId={episodeId ?? null}
          onEpisodeSelect={onEpisodeSelect ?? (() => {})}
          stages={sidebarStages}
          currentStage={vm.stageNav.currentStage}
          onStageChange={vm.stageNav.handleStageChange}
          onOpenAssetLibrary={() => vm.ui.openAssetLibrary()}
          onOpenSettings={() => vm.ui.setIsSettingsModalOpen(true)}
          onRefresh={() => vm.ui.onRefresh({ mode: 'full' })}
          projectName={project.name}
        />

        {/* Right content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <WorkspaceStageRuntimeProvider value={vm.runtime.stageRuntime}>
            <WorkspaceStageContent currentStage={vm.stageNav.currentStage} />
          </WorkspaceStageRuntimeProvider>
        </main>
    </div>

    {/* Modals — outside flex layout */}
    <WorkspaceHeaderShell
        isSettingsModalOpen={vm.ui.isSettingsModalOpen}
        isWorldContextModalOpen={vm.ui.isWorldContextModalOpen}
        onCloseSettingsModal={() => vm.ui.setIsSettingsModalOpen(false)}
        onCloseWorldContextModal={() => vm.ui.setIsWorldContextModalOpen(false)}
        availableModels={vm.ui.userModelsForSettings || undefined}
        modelsLoaded={vm.ui.userModelsLoaded}
        artStyle={vm.project.artStyle}
        analysisModel={vm.project.analysisModel}
        characterModel={vm.project.characterModel}
        locationModel={vm.project.locationModel}
        storyboardModel={vm.project.storyboardModel}
        editModel={vm.project.editModel}
        videoModel={vm.project.videoModel}
        audioModel={vm.project.audioModel}
        capabilityOverrides={vm.project.capabilityOverrides}
        videoRatio={vm.project.videoRatio}
        ttsRate={vm.project.ttsRate !== undefined && vm.project.ttsRate !== null ? String(vm.project.ttsRate) : undefined}
        onUpdateConfig={vm.actions.handleUpdateConfig}
        globalAssetText={vm.project.globalAssetText}
      />

      <WorkspaceAssetLibraryModal
        isOpen={vm.ui.isAssetLibraryOpen}
        onClose={vm.ui.closeAssetLibrary}
        assetsLoading={vm.ui.assetsLoading}
        assetsLoadingState={vm.ui.assetsLoadingState}
        hasCharacters={vm.project.projectCharacters.length > 0}
        hasLocations={vm.project.projectLocations.length > 0}
        projectId={projectId}
        isAnalyzingAssets={vm.execution.isAssetAnalysisRunning}
        focusCharacterId={vm.ui.assetLibraryFocusCharacterId}
        focusCharacterRequestId={vm.ui.assetLibraryFocusRequestId}
        triggerGlobalAnalyze={vm.ui.triggerGlobalAnalyzeOnOpen}
        onGlobalAnalyzeComplete={() => vm.ui.setTriggerGlobalAnalyzeOnOpen(false)}
      />

      {vm.execution.showCreatingToast && (
        <ProgressToast
          show
          message={vm.i18n.t('storyInput.creating')}
          step={vm.execution.transitionProgress.step || ''}
          runBadges={runBadges}
        />
      )}

      <ConfirmDialog
        show={vm.rebuild.showRebuildConfirm}
        type="warning"
        title={vm.rebuild.rebuildConfirmTitle}
        message={vm.rebuild.rebuildConfirmMessage}
        confirmText={vm.i18n.t('rebuildConfirm.confirm')}
        cancelText={vm.i18n.t('rebuildConfirm.cancel')}
        onConfirm={vm.rebuild.handleAcceptRebuildConfirm}
        onCancel={vm.rebuild.handleCancelRebuildConfirm}
      />

      <WorkspaceRunStreamConsoles
        storyToScriptStream={vm.execution.storyToScriptStream}
        scriptToStoryboardStream={vm.execution.scriptToStoryboardStream}
        storyToScriptConsoleMinimized={vm.execution.storyToScriptConsoleMinimized}
        scriptToStoryboardConsoleMinimized={vm.execution.scriptToStoryboardConsoleMinimized}
        onStoryToScriptMinimizedChange={vm.execution.setStoryToScriptConsoleMinimized}
        onScriptToStoryboardMinimizedChange={vm.execution.setScriptToStoryboardConsoleMinimized}
        hideMinimizedBadges={vm.execution.showCreatingToast}
      />
    </>
  )
}

export default function StudioWorkspace(props: StudioWorkspaceProps) {
  const { projectId, episodeId } = props
  return (
    <WorkspaceProvider projectId={projectId} episodeId={episodeId}>
      <StudioWorkspaceContent {...props} />
    </WorkspaceProvider>
  )
}
