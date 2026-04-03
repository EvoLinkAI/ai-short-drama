const STORY_TO_SCRIPT_WORKFLOW = 'story_to_script_run'
const SCRIPT_TO_STORYBOARD_WORKFLOW = 'script_to_storyboard_run'

function uniqueStepKeys(stepKeys: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(stepKeys).filter((stepKey) => stepKey.trim().length > 0)))
}

function resolveStoryToScriptInvalidation(params: {
  stepKey: string
  existingStepKeys: ReadonlySet<string>
}): string[] {
  const affected = new Set<string>([params.stepKey])
  if (params.stepKey === 'analyze_characters' || params.stepKey === 'analyze_locations') {
    if (params.existingStepKeys.has('split_clips')) {
      affected.add('split_clips')
    }
    for (const stepKey of params.existingStepKeys) {
      if (stepKey.startsWith('screenplay_')) {
        affected.add(stepKey)
      }
    }
  } else if (params.stepKey === 'split_clips') {
    for (const stepKey of params.existingStepKeys) {
      if (stepKey.startsWith('screenplay_')) {
        affected.add(stepKey)
      }
    }
  }
  return uniqueStepKeys(affected)
}

type StoryboardPhase = 'phase1' | 'phase2_cinematography' | 'phase2_acting' | 'phase3_detail'

function parseStoryboardStepKey(stepKey: string): { clipId: string; phase: StoryboardPhase } | null {
  const match = /^clip_(.+)_(phase1|phase2_cinematography|phase2_acting|phase3_detail)$/.exec(stepKey.trim())
  if (!match) return null
  const clipId = (match[1] || '').trim()
  const phase = match[2] as StoryboardPhase
  if (!clipId) return null
  return { clipId, phase }
}

function resolveScriptToStoryboardInvalidation(params: {
  stepKey: string
  existingStepKeys: ReadonlySet<string>
}): string[] {
  const affected = new Set<string>([params.stepKey])
  if (params.stepKey === 'voice_analyze') {
    return uniqueStepKeys(affected)
  }

  const parsed = parseStoryboardStepKey(params.stepKey)
  if (!parsed) {
    return uniqueStepKeys(affected)
  }

  const clipPrefix = `clip_${parsed.clipId}_`
  if (parsed.phase === 'phase1') {
    affected.add(`${clipPrefix}phase2_cinematography`)
    affected.add(`${clipPrefix}phase2_acting`)
    affected.add(`${clipPrefix}phase3_detail`)
    affected.add('voice_analyze')
    return uniqueStepKeys(Array.from(affected).filter((stepKey) => params.existingStepKeys.has(stepKey)))
  }

  if (parsed.phase === 'phase2_cinematography' || parsed.phase === 'phase2_acting') {
    affected.add(`${clipPrefix}phase3_detail`)
    affected.add('voice_analyze')
    return uniqueStepKeys(Array.from(affected).filter((stepKey) => params.existingStepKeys.has(stepKey)))
  }

  affected.add('voice_analyze')
  return uniqueStepKeys(Array.from(affected).filter((stepKey) => params.existingStepKeys.has(stepKey)))
}

export function resolveRetryInvalidationStepKeys(params: {
  workflowType: string
  stepKey: string
  existingStepKeys: string[]
}): string[] {
  const existingStepKeys = new Set(params.existingStepKeys)
  if (params.workflowType === STORY_TO_SCRIPT_WORKFLOW) {
    return resolveStoryToScriptInvalidation({
      stepKey: params.stepKey,
      existingStepKeys,
    })
  }
  if (params.workflowType === SCRIPT_TO_STORYBOARD_WORKFLOW) {
    return resolveScriptToStoryboardInvalidation({
      stepKey: params.stepKey,
      existingStepKeys,
    })
  }
  return uniqueStepKeys([params.stepKey].filter((stepKey) => existingStepKeys.has(stepKey)))
}
