export type RouteCategory =
  | 'assets'
  | 'asset-hub'
  | 'studio'
  | 'projects'
  | 'tasks'
  | 'user'
  | 'auth'
  | 'infra'
  | 'system'

export type RouteContractGroup =
  | 'llm-observe-routes'
  | 'direct-submit-routes'
  | 'crud-assets-routes'
  | 'crud-asset-hub-routes'
  | 'crud-studio-routes'
  | 'task-infra-routes'
  | 'user-project-routes'
  | 'auth-routes'
  | 'infra-routes'

export type RouteCatalogEntry = {
  routeFile: string
  category: RouteCategory
  contractGroup: RouteContractGroup
}

const ROUTE_FILES = [
  'src/app/api/admin/download-logs/route.ts',
  'src/app/api/asset-hub/ai-design-character/route.ts',
  'src/app/api/asset-hub/ai-design-location/route.ts',
  'src/app/api/asset-hub/ai-modify-character/route.ts',
  'src/app/api/asset-hub/ai-modify-location/route.ts',
  'src/app/api/asset-hub/appearances/route.ts',
  'src/app/api/asset-hub/character-voice/route.ts',
  'src/app/api/asset-hub/characters/[characterId]/appearances/[appearanceIndex]/route.ts',
  'src/app/api/asset-hub/characters/[characterId]/route.ts',
  'src/app/api/asset-hub/characters/route.ts',
  'src/app/api/asset-hub/folders/[folderId]/route.ts',
  'src/app/api/asset-hub/folders/route.ts',
  'src/app/api/asset-hub/generate-image/route.ts',
  'src/app/api/asset-hub/locations/[locationId]/route.ts',
  'src/app/api/asset-hub/locations/route.ts',
  'src/app/api/asset-hub/modify-image/route.ts',
  'src/app/api/asset-hub/picker/route.ts',
  'src/app/api/asset-hub/reference-to-character/route.ts',
  'src/app/api/asset-hub/select-image/route.ts',
  'src/app/api/asset-hub/undo-image/route.ts',
  'src/app/api/asset-hub/update-asset-label/route.ts',
  'src/app/api/asset-hub/upload-image/route.ts',
  'src/app/api/asset-hub/upload-temp/route.ts',
  'src/app/api/asset-hub/voice-design/route.ts',
  'src/app/api/asset-hub/voices/[id]/route.ts',
  'src/app/api/asset-hub/voices/route.ts',
  'src/app/api/asset-hub/voices/upload/route.ts',
  'src/app/api/assets/[assetId]/copy/route.ts',
  'src/app/api/assets/[assetId]/generate/route.ts',
  'src/app/api/assets/[assetId]/modify-render/route.ts',
  'src/app/api/assets/[assetId]/revert-render/route.ts',
  'src/app/api/assets/[assetId]/route.ts',
  'src/app/api/assets/[assetId]/select-render/route.ts',
  'src/app/api/assets/[assetId]/update-label/route.ts',
  'src/app/api/assets/[assetId]/variants/[variantId]/route.ts',
  'src/app/api/assets/route.ts',
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/cos/image/route.ts',
  'src/app/api/files/[...path]/route.ts',
  'src/app/api/storage/sign/route.ts',
  'src/app/api/studio/[projectId]/ai-create-character/route.ts',
  'src/app/api/studio/[projectId]/ai-create-location/route.ts',
  'src/app/api/studio/[projectId]/ai-modify-appearance/route.ts',
  'src/app/api/studio/[projectId]/ai-modify-location/route.ts',
  'src/app/api/studio/[projectId]/ai-modify-shot-prompt/route.ts',
  'src/app/api/studio/[projectId]/analyze-global/route.ts',
  'src/app/api/studio/[projectId]/analyze-shot-variants/route.ts',
  'src/app/api/studio/[projectId]/analyze/route.ts',
  'src/app/api/studio/[projectId]/assets/route.ts',
  'src/app/api/studio/[projectId]/character-profile/batch-confirm/route.ts',
  'src/app/api/studio/[projectId]/character-profile/confirm/route.ts',
  'src/app/api/studio/[projectId]/character-voice/route.ts',
  'src/app/api/studio/[projectId]/character/appearance/route.ts',
  'src/app/api/studio/[projectId]/character/confirm-selection/route.ts',
  'src/app/api/studio/[projectId]/character/route.ts',
  'src/app/api/studio/[projectId]/cleanup-unselected-images/route.ts',
  'src/app/api/studio/[projectId]/clips/[clipId]/route.ts',
  'src/app/api/studio/[projectId]/clips/route.ts',
  'src/app/api/studio/[projectId]/copy-from-global/route.ts',
  'src/app/api/studio/[projectId]/download-images/route.ts',
  'src/app/api/studio/[projectId]/download-videos/route.ts',
  'src/app/api/studio/[projectId]/download-voices/route.ts',
  'src/app/api/studio/[projectId]/editor/route.ts',
  'src/app/api/studio/[projectId]/episodes/[episodeId]/route.ts',
  'src/app/api/studio/[projectId]/episodes/batch/route.ts',
  'src/app/api/studio/[projectId]/episodes/route.ts',
  'src/app/api/studio/[projectId]/episodes/split-by-markers/route.ts',
  'src/app/api/studio/[projectId]/episodes/split/route.ts',
  'src/app/api/studio/[projectId]/generate-character-image/route.ts',
  'src/app/api/studio/[projectId]/generate-image/route.ts',
  'src/app/api/studio/[projectId]/generate-video/route.ts',
  'src/app/api/studio/[projectId]/insert-panel/route.ts',
  'src/app/api/studio/[projectId]/merge-episode-videos/route.ts',
  'src/app/api/studio/[projectId]/lip-sync/route.ts',
  'src/app/api/studio/[projectId]/location/confirm-selection/route.ts',
  'src/app/api/studio/[projectId]/location/route.ts',
  'src/app/api/studio/[projectId]/modify-asset-image/route.ts',
  'src/app/api/studio/[projectId]/modify-storyboard-image/route.ts',
  'src/app/api/studio/[projectId]/panel-link/route.ts',
  'src/app/api/studio/[projectId]/panel-variant/route.ts',
  'src/app/api/studio/[projectId]/panel/route.ts',
  'src/app/api/studio/[projectId]/panel/select-candidate/route.ts',
  'src/app/api/studio/[projectId]/photography-plan/route.ts',
  'src/app/api/studio/[projectId]/reference-to-character/route.ts',
  'src/app/api/studio/[projectId]/regenerate-group/route.ts',
  'src/app/api/studio/[projectId]/regenerate-panel-image/route.ts',
  'src/app/api/studio/[projectId]/regenerate-single-image/route.ts',
  'src/app/api/studio/[projectId]/regenerate-storyboard-text/route.ts',
  'src/app/api/studio/[projectId]/route.ts',
  'src/app/api/studio/[projectId]/screenplay-conversion/route.ts',
  'src/app/api/studio/[projectId]/script-to-storyboard-stream/route.ts',
  'src/app/api/studio/[projectId]/select-character-image/route.ts',
  'src/app/api/studio/[projectId]/select-location-image/route.ts',
  'src/app/api/studio/[projectId]/speaker-voice/route.ts',
  'src/app/api/studio/[projectId]/story-to-script-stream/route.ts',
  'src/app/api/studio/[projectId]/storyboard-group/route.ts',
  'src/app/api/studio/[projectId]/storyboards/route.ts',
  'src/app/api/studio/[projectId]/undo-regenerate/route.ts',
  'src/app/api/studio/[projectId]/update-appearance/route.ts',
  'src/app/api/studio/[projectId]/update-asset-label/route.ts',
  'src/app/api/studio/[projectId]/update-location/route.ts',
  'src/app/api/studio/[projectId]/update-prompt/route.ts',
  'src/app/api/studio/[projectId]/upload-asset-image/route.ts',
  'src/app/api/studio/[projectId]/video-proxy/route.ts',
  'src/app/api/studio/[projectId]/video-urls/route.ts',
  'src/app/api/studio/[projectId]/voice-analyze/route.ts',
  'src/app/api/studio/[projectId]/voice-design/route.ts',
  'src/app/api/studio/[projectId]/voice-generate/route.ts',
  'src/app/api/studio/[projectId]/voice-lines/route.ts',
  'src/app/api/projects/[projectId]/assets/route.ts',
  'src/app/api/projects/[projectId]/costs/route.ts',
  'src/app/api/projects/[projectId]/data/route.ts',
  'src/app/api/projects/[projectId]/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/runs/[runId]/cancel/route.ts',
  'src/app/api/runs/[runId]/events/route.ts',
  'src/app/api/runs/[runId]/route.ts',
  'src/app/api/runs/[runId]/steps/[stepKey]/retry/route.ts',
  'src/app/api/runs/route.ts',
  'src/app/api/sse/route.ts',
  'src/app/api/system/boot-id/route.ts',
  'src/app/api/task-target-states/route.ts',
  'src/app/api/tasks/[taskId]/route.ts',
  'src/app/api/tasks/dismiss/route.ts',
  'src/app/api/tasks/route.ts',
  'src/app/api/user-preference/route.ts',
  'src/app/api/user/api-config/route.ts',
  'src/app/api/user/assistant/chat/route.ts',
  'src/app/api/user/api-config/assistant/validate-media-template/route.ts',
  'src/app/api/user/api-config/assistant/probe-media-template/route.ts',
  'src/app/api/user/api-config/probe-model-llm-protocol/route.ts',
  'src/app/api/user/api-config/test-connection/route.ts',
  'src/app/api/user/api-config/test-provider/route.ts',
  'src/app/api/user/balance/route.ts',
  'src/app/api/user/costs/details/route.ts',
  'src/app/api/user/costs/route.ts',
  'src/app/api/user/models/route.ts',
  'src/app/api/user/transactions/route.ts',
] as const

function resolveCategory(routeFile: string): RouteCategory {
  if (routeFile.startsWith('src/app/api/assets/')) return 'assets'
  if (routeFile.startsWith('src/app/api/asset-hub/')) return 'asset-hub'
  if (routeFile.startsWith('src/app/api/studio/')) return 'studio'
  if (routeFile.startsWith('src/app/api/projects/')) return 'projects'
  if (
    routeFile.startsWith('src/app/api/tasks/')
    || routeFile.startsWith('src/app/api/runs/')
    || routeFile === 'src/app/api/task-target-states/route.ts'
  ) {
    return 'tasks'
  }
  if (routeFile.startsWith('src/app/api/user/') || routeFile === 'src/app/api/user-preference/route.ts') return 'user'
  if (routeFile.startsWith('src/app/api/auth/')) return 'auth'
  if (routeFile.startsWith('src/app/api/system/')) return 'system'
  return 'infra'
}

function resolveContractGroup(routeFile: string): RouteContractGroup {
  if (
    routeFile.includes('/ai-')
    || routeFile.includes('/analyze')
    || routeFile.includes('/story-to-script-stream/')
    || routeFile.includes('/script-to-storyboard-stream/')
    || routeFile.includes('/screenplay-conversion/')
    || routeFile.includes('/reference-to-character/')
    || routeFile.includes('/character-profile/')
    || routeFile.endsWith('/clips/route.ts')
    || routeFile.endsWith('/episodes/split/route.ts')
    || routeFile.endsWith('/voice-analyze/route.ts')
  ) {
    return 'llm-observe-routes'
  }
  if (
    routeFile.endsWith('/generate-image/route.ts')
    || routeFile.endsWith('/generate-video/route.ts')
    || routeFile.endsWith('/generate/route.ts')
    || routeFile.endsWith('/modify-image/route.ts')
    || routeFile.endsWith('/modify-render/route.ts')
    || routeFile.endsWith('/voice-design/route.ts')
    || routeFile.endsWith('/insert-panel/route.ts')
    || routeFile.endsWith('/lip-sync/route.ts')
    || routeFile.endsWith('/modify-asset-image/route.ts')
    || routeFile.endsWith('/modify-storyboard-image/route.ts')
    || routeFile.endsWith('/panel-variant/route.ts')
    || routeFile.endsWith('/regenerate-group/route.ts')
    || routeFile.endsWith('/regenerate-panel-image/route.ts')
    || routeFile.endsWith('/regenerate-single-image/route.ts')
    || routeFile.endsWith('/regenerate-storyboard-text/route.ts')
    || routeFile.endsWith('/voice-generate/route.ts')
  ) {
    return 'direct-submit-routes'
  }
  if (routeFile.startsWith('src/app/api/assets/')) return 'crud-assets-routes'
  if (routeFile.startsWith('src/app/api/asset-hub/')) return 'crud-asset-hub-routes'
  if (routeFile.startsWith('src/app/api/studio/')) return 'crud-studio-routes'
  if (
    routeFile.startsWith('src/app/api/tasks/')
    || routeFile.startsWith('src/app/api/runs/')
    || routeFile === 'src/app/api/task-target-states/route.ts'
    || routeFile === 'src/app/api/sse/route.ts'
  ) {
    return 'task-infra-routes'
  }
  if (routeFile.startsWith('src/app/api/projects/') || routeFile.startsWith('src/app/api/user/')) {
    return 'user-project-routes'
  }
  if (routeFile.startsWith('src/app/api/auth/')) return 'auth-routes'
  return 'infra-routes'
}

export const ROUTE_CATALOG: ReadonlyArray<RouteCatalogEntry> = ROUTE_FILES.map((routeFile) => ({
  routeFile,
  category: resolveCategory(routeFile),
  contractGroup: resolveContractGroup(routeFile),
}))

export const ROUTE_COUNT = ROUTE_CATALOG.length
