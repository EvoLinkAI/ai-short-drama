import { safeParseJsonArray, safeParseJsonObject } from '@/lib/json-repair'
import { buildCharactersIntroduction } from '@/lib/constants'
import { normalizeAnyError } from '@/lib/errors/normalize'
import { createScopedLogger } from '@/lib/logging/core'
import { createClipContentMatcher, type ClipMatchLevel } from './clip-matching'
import { mapWithConcurrency } from '@/lib/async/map-with-concurrency'
import {
  DEFAULT_ANALYSIS_WORKFLOW_CONCURRENCY,
  normalizeWorkflowConcurrencyValue,
} from '@/lib/workflow-concurrency'

export type StoryToScriptStepMeta = {
  stepId: string
  stepAttempt?: number
  stepTitle: string
  stepIndex: number
  stepTotal: number
  dependsOn?: string[]
  groupId?: string
  parallelKey?: string
  retryable?: boolean
  blockedBy?: string[]
}

export type StoryToScriptStepOutput = {
  text: string
  reasoning: string
}

export type StoryToScriptClipCandidate = {
  id: string
  startText: string
  endText: string
  summary: string
  location: string | null
  characters: string[]
  props: string[]
  content: string
  matchLevel: ClipMatchLevel
  matchConfidence: number
}

export type StoryToScriptScreenplayResult = {
  clipId: string
  success: boolean
  sceneCount: number
  screenplay?: Record<string, unknown>
  error?: string
}

export type StoryToScriptPromptTemplates = {
  characterPromptTemplate: string
  locationPromptTemplate: string
  propPromptTemplate: string
  clipPromptTemplate: string
  screenplayPromptTemplate: string
}

export type StoryToScriptOrchestratorInput = {
  concurrency?: number
  content: string
  baseCharacters: string[]
  baseLocations: string[]
  baseProps?: string[]
  baseCharacterIntroductions: Array<{ name: string; introduction?: string | null }>
  promptTemplates: StoryToScriptPromptTemplates
  runStep: (
    meta: StoryToScriptStepMeta,
    prompt: string,
    action: string,
    maxOutputTokens: number,
  ) => Promise<StoryToScriptStepOutput>
  onStepError?: (meta: StoryToScriptStepMeta, message: string) => void
  onLog?: (message: string, details?: Record<string, unknown>) => void
}

export type StoryToScriptOrchestratorResult = {
  characterStep: StoryToScriptStepOutput
  locationStep: StoryToScriptStepOutput
  propStep: StoryToScriptStepOutput
  splitStep: StoryToScriptStepOutput
  charactersObject: Record<string, unknown>
  locationsObject: Record<string, unknown>
  propsObject: Record<string, unknown>
  analyzedCharacters: Record<string, unknown>[]
  analyzedLocations: Record<string, unknown>[]
  analyzedProps: Record<string, unknown>[]
  charactersLibName: string
  locationsLibName: string
  propsLibName: string
  charactersIntroduction: string
  clipList: StoryToScriptClipCandidate[]
  screenplayResults: StoryToScriptScreenplayResult[]
  summary: {
    characterCount: number
      locationCount: number
      propCount: number
      clipCount: number
    screenplaySuccessCount: number
    screenplayFailedCount: number
    totalScenes: number
  }
}
const orchestratorLogger = createScopedLogger({ module: 'worker.orchestrator.story_to_script' })

function applyTemplate(template: string, replacements: Record<string, string>) {
  let next = template
  for (const [key, value] of Object.entries(replacements)) {
    next = next.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return next
}

function parseClipArray(responseText: string): Record<string, unknown>[] {
  return safeParseJsonArray(responseText, 'clips')
}

function parseScreenplayObject(responseText: string): Record<string, unknown> {
  return safeParseJsonObject(responseText)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function toObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
}

function extractAnalyzedCharacters(obj: Record<string, unknown>): Record<string, unknown>[] {
  const primary = toObjectArray(obj.characters)
  if (primary.length > 0) return primary
  return toObjectArray(obj.new_characters)
}

function extractAnalyzedLocations(obj: Record<string, unknown>): Record<string, unknown>[] {
  return toObjectArray(obj.locations)
}

function extractAnalyzedProps(obj: Record<string, unknown>): Record<string, unknown>[] {
  return toObjectArray(obj.props)
}

const MAX_STEP_ATTEMPTS = 3
const MAX_SPLIT_BOUNDARY_ATTEMPTS = 2
const MAX_RETRY_DELAY_MS = 10_000
const CLIP_BOUNDARY_SUFFIX = `

[Boundary Constraints]
1. The "start" and "end" anchors must come from the original text and be locatable.
2. Allow punctuation/whitespace differences, but do not rewrite key entities or events.
3. If anchors cannot be located reliably, return [] directly.`

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function computeRetryDelayMs(attempt: number) {
  const base = Math.min(1_000 * Math.pow(2, Math.max(0, attempt - 1)), MAX_RETRY_DELAY_MS)
  const jitter = Math.floor(Math.random() * 300)
  return base + jitter
}

function isRecoverableJsonParseError(error: unknown, normalizedMessage: string): boolean {
  if (normalizedMessage.includes('ark responses 调用失败')) return false
  if (normalizedMessage.includes('invalidparameter')) return false
  if (normalizedMessage.includes('unknown field')) return false

  if (error instanceof SyntaxError) return true

  return normalizedMessage.includes('unexpected token')
    || normalizedMessage.includes('unexpected end of json input')
    || normalizedMessage.includes('json format invalid')
    || normalizedMessage.includes('invalid clip json format')
}

async function runStepWithRetry<T>(
  runStep: StoryToScriptOrchestratorInput['runStep'],
  baseMeta: StoryToScriptStepMeta,
  prompt: string,
  action: string,
  maxOutputTokens: number,
  parse: (text: string) => T,
): Promise<{ output: StoryToScriptStepOutput; parsed: T }> {
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= MAX_STEP_ATTEMPTS; attempt++) {
    const meta = attempt === 1
      ? baseMeta
      : {
        ...baseMeta,
        stepId: baseMeta.stepId,
        stepAttempt: attempt,
        stepTitle: baseMeta.stepTitle,
      }
    try {
      const output = await runStep(meta, prompt, action, maxOutputTokens)
      const parsed = parse(output.text)
      return { output, parsed }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const normalizedError = normalizeAnyError(error, { context: 'worker' })
      const lowerMessage = normalizedError.message.toLowerCase()
      const shouldRetry = attempt < MAX_STEP_ATTEMPTS
        && (
          normalizedError.retryable
          || isRecoverableJsonParseError(error, lowerMessage)
        )

      orchestratorLogger.error({
        action: 'orchestrator.step.retry',
        message: shouldRetry ? 'step failed, retrying' : 'step failed, no more retry',
        errorCode: normalizedError.code,
        retryable: normalizedError.retryable,
        details: {
          stepId: baseMeta.stepId,
          action,
          attempt,
          maxAttempts: MAX_STEP_ATTEMPTS,
        },
        error: {
          name: lastError.name,
          message: lastError.message,
          stack: lastError.stack,
        },
      })

      if (!shouldRetry) {
        break
      }
      await wait(computeRetryDelayMs(attempt))
    }
  }
  throw lastError!
}

export async function runStoryToScriptOrchestrator(
  input: StoryToScriptOrchestratorInput,
): Promise<StoryToScriptOrchestratorResult> {
  const {
    concurrency: rawConcurrency,
    content,
    baseCharacters,
    baseLocations,
    baseProps = [],
    baseCharacterIntroductions,
    promptTemplates,
    runStep,
    onStepError,
    onLog,
  } = input
  const concurrency = normalizeWorkflowConcurrencyValue(
    rawConcurrency,
    DEFAULT_ANALYSIS_WORKFLOW_CONCURRENCY,
  )

  const baseCharactersText = baseCharacters.length > 0 ? baseCharacters.join('、') : '无'
  const baseLocationsText = baseLocations.length > 0 ? baseLocations.join('、') : '无'
  const basePropsText = baseProps.length > 0 ? baseProps.join('、') : '无'
  const baseCharacterInfo = baseCharacterIntroductions.length > 0
    ? baseCharacterIntroductions.map((item, index) => `${index + 1}. ${item.name}`).join('\n')
    : '暂无已有角色'

  const characterPrompt = applyTemplate(promptTemplates.characterPromptTemplate, {
    input: content,
    characters_lib_name: baseCharactersText,
    characters_lib_info: baseCharacterInfo,
  })
  const locationPrompt = applyTemplate(promptTemplates.locationPromptTemplate, {
    input: content,
    locations_lib_name: baseLocationsText,
  })
  const propPrompt = applyTemplate(promptTemplates.propPromptTemplate, {
    input: content,
    props_lib_name: basePropsText,
  })

  onLog?.('开始步骤1：角色/场景/道具分析（并行）')
  const analysisResults = await mapWithConcurrency(
    [
      () => runStepWithRetry(
        runStep,
        {
          stepId: 'analyze_characters',
          stepTitle: 'progress.streamStep.analyzeCharacters',
          stepIndex: 1,
          stepTotal: 2,
          groupId: 'analysis',
          parallelKey: 'characters',
          retryable: true,
        },
        characterPrompt,
        'analyze_characters',
        2200,
        safeParseJsonObject,
      ),
      () => runStepWithRetry(
        runStep,
        {
          stepId: 'analyze_locations',
          stepTitle: 'progress.streamStep.analyzeLocations',
          stepIndex: 2,
          stepTotal: 2,
          groupId: 'analysis',
          parallelKey: 'locations',
          retryable: true,
        },
        locationPrompt,
        'analyze_locations',
        2200,
        safeParseJsonObject,
      ),
      () => runStepWithRetry(
        runStep,
        {
          stepId: 'analyze_props',
          stepTitle: 'progress.streamStep.analyzeProps',
          stepIndex: 3,
          stepTotal: 3,
          groupId: 'analysis',
          parallelKey: 'props',
          retryable: true,
        },
        propPrompt,
        'analyze_props',
        1600,
        safeParseJsonObject,
      ),
    ],
    concurrency,
    async (run) => await run(),
  )
  const { output: characterStep, parsed: charactersObject } = analysisResults[0]
  const { output: locationStep, parsed: locationsObject } = analysisResults[1]
  const { output: propStep, parsed: propsObject } = analysisResults[2]

  const analyzedCharacters = extractAnalyzedCharacters(charactersObject)
  const analyzedLocations = extractAnalyzedLocations(locationsObject)
  const analyzedProps = extractAnalyzedProps(propsObject)

  const analyzedCharacterNames = analyzedCharacters
    .map((item) => asString(item.name).trim())
    .filter(Boolean)
  const analyzedLocationNames = analyzedLocations
    .map((item) => asString(item.name).trim())
    .filter(Boolean)
  const analyzedPropNames = analyzedProps
    .map((item) => asString(item.name).trim())
    .filter(Boolean)

  // 合并新发现角色与已有角色库（新角色优先，已有角色补充），避免已有角色被覆盖丢失
  const analyzedCharacterNameSet = new Set(analyzedCharacterNames)
  const mergedCharacterNames = [
    ...analyzedCharacterNames,
    ...baseCharacters.filter((name) => !analyzedCharacterNameSet.has(name)),
  ]
  const charactersLibName = mergedCharacterNames.length > 0
    ? mergedCharacterNames.join('、')
    : baseCharactersText

  const locationsLibName = analyzedLocationNames.length > 0
    ? analyzedLocationNames.join('、')
    : baseLocationsText
  const analyzedPropNameSet = new Set(analyzedPropNames)
  const mergedPropNames = [
    ...analyzedPropNames,
    ...baseProps.filter((name) => !analyzedPropNameSet.has(name)),
  ]
  const propsLibName = mergedPropNames.length > 0
    ? mergedPropNames.join('、')
    : basePropsText

  // 合并角色介绍：新角色 + 未被新角色覆盖的已有角色介绍
  const mergedCharacterIntroductions = [
    ...analyzedCharacters.map((item) => ({
      name: asString(item.name),
      introduction: asString(item.introduction),
    })),
    ...baseCharacterIntroductions
      .filter((item) => !analyzedCharacterNameSet.has(item.name))
      .map((item) => ({
        name: item.name,
        introduction: item.introduction || '',
      })),
  ]
  const charactersIntroduction = buildCharactersIntroduction(
    mergedCharacterIntroductions.length > 0
      ? mergedCharacterIntroductions
      : baseCharacterIntroductions.map((item) => ({
        name: item.name,
        introduction: item.introduction || '',
      })),
  )

  onLog?.('开始步骤2：片段切分（最多重试1次）', {
    charactersLibName,
    locationsLibName,
  })

  const splitPromptBase = applyTemplate(promptTemplates.clipPromptTemplate, {
    input: content,
    locations_lib_name: locationsLibName || '无',
    characters_lib_name: charactersLibName || '无',
    props_lib_name: propsLibName || '无',
    characters_introduction: charactersIntroduction || '暂无角色介绍',
  })
  const splitPrompt = `${splitPromptBase}${CLIP_BOUNDARY_SUFFIX}`

  let splitStep: StoryToScriptStepOutput | null = null
  let clipList: StoryToScriptClipCandidate[] = []
  let lastBoundaryError: Error | null = null

  for (let attempt = 1; attempt <= MAX_SPLIT_BOUNDARY_ATTEMPTS; attempt += 1) {
    const splitMeta: StoryToScriptStepMeta = {
      stepId: 'split_clips',
      stepAttempt: attempt,
      stepTitle: 'progress.streamStep.splitClips',
      stepIndex: 1,
      stepTotal: 1,
      dependsOn: ['analyze_characters', 'analyze_locations'],
      retryable: true,
    }

    const { output, parsed: rawClipList } = await runStepWithRetry(
      runStep,
      splitMeta,
      splitPrompt,
      'split_clips',
      2600,
      parseClipArray,
    )
    if (rawClipList.length === 0) {
      lastBoundaryError = new Error('split_clips returned empty clips')
      onLog?.('片段切分结果为空', {
        attempt,
        maxAttempts: MAX_SPLIT_BOUNDARY_ATTEMPTS,
      })
      continue
    }

    const matcher = createClipContentMatcher(content)
    const nextClipList: StoryToScriptClipCandidate[] = []
    let searchFrom = 0
    let failedAt: { clipId: string; startText: string; endText: string } | null = null

    for (let index = 0; index < rawClipList.length; index += 1) {
      const item = rawClipList[index]
      const startText = asString(item.start)
      const endText = asString(item.end)
      const clipId = `clip_${index + 1}`
      const match = matcher.matchBoundary(startText, endText, searchFrom)
      if (!match) {
        failedAt = { clipId, startText, endText }
        break
      }

      nextClipList.push({
        id: clipId,
        startText,
        endText,
        summary: asString(item.summary),
        location: asString(item.location) || null,
        characters: toStringArray(item.characters),
        props: toStringArray(item.props),
        content: content.slice(match.startIndex, match.endIndex),
        matchLevel: match.level,
        matchConfidence: match.confidence,
      })
      searchFrom = match.endIndex
    }

    if (!failedAt) {
      splitStep = output
      clipList = nextClipList
      const levelCount: Record<ClipMatchLevel, number> = { L1: 0, L2: 0, L3: 0 }
      for (const clip of nextClipList) {
        levelCount[clip.matchLevel] += 1
      }
      onLog?.('片段边界匹配成功', {
        attempt,
        clipCount: nextClipList.length,
        levelCount,
      })
      break
    }

    lastBoundaryError = new Error(
      `split_clips boundary matching failed at ${failedAt.clipId}: start="${failedAt.startText}" end="${failedAt.endText}"`,
    )
    onLog?.('片段边界匹配失败', {
      attempt,
      maxAttempts: MAX_SPLIT_BOUNDARY_ATTEMPTS,
      failedClip: failedAt.clipId,
      startText: failedAt.startText,
      endText: failedAt.endText,
    })
  }

  if (!splitStep) {
    throw lastBoundaryError || new Error('split_clips boundary matching failed')
  }

  onLog?.('开始步骤3：对每个片段做剧本转换（并行）', { clipCount: clipList.length })

  const screenplayResults = await mapWithConcurrency(
    clipList,
    concurrency,
    async (clip, index): Promise<StoryToScriptScreenplayResult> => {
      const stepMeta: StoryToScriptStepMeta = {
        stepId: `screenplay_${clip.id}`,
        stepTitle: 'progress.streamStep.screenplayConversion',
        stepIndex: index + 1,
        stepTotal: clipList.length || 1,
        dependsOn: ['split_clips'],
        groupId: 'screenplay_conversion',
        parallelKey: clip.id,
        retryable: true,
      }

      try {
        const screenplayPrompt = applyTemplate(promptTemplates.screenplayPromptTemplate, {
          clip_content: clip.content,
          locations_lib_name: locationsLibName || '无',
          characters_lib_name: charactersLibName || '无',
          props_lib_name: propsLibName || '无',
          characters_introduction: charactersIntroduction || '暂无角色介绍',
          clip_id: clip.id,
        })

        const { parsed: screenplay } = await runStepWithRetry(
          runStep,
          stepMeta,
          screenplayPrompt,
          'screenplay_conversion',
          2200,
          parseScreenplayObject,
        )
        const scenes = Array.isArray(screenplay.scenes) ? screenplay.scenes : []
        return {
          clipId: clip.id,
          success: true,
          sceneCount: scenes.length,
          screenplay,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        onStepError?.(stepMeta, message)
        return {
          clipId: clip.id,
          success: false,
          sceneCount: 0,
          error: message,
        }
      }
    },
  )

  const screenplaySuccessCount = screenplayResults.filter((item) => item.success).length
  const screenplayFailedCount = screenplayResults.length - screenplaySuccessCount
  const totalScenes = screenplayResults.reduce((sum, item) => sum + item.sceneCount, 0)

  return {
    characterStep,
    locationStep,
    propStep,
    splitStep,
    charactersObject,
    locationsObject,
    propsObject,
    analyzedCharacters,
    analyzedLocations,
    analyzedProps,
    charactersLibName,
    locationsLibName,
    propsLibName,
    charactersIntroduction,
    clipList,
    screenplayResults,
    summary: {
      characterCount: analyzedCharacters.length,
      locationCount: analyzedLocations.length,
      propCount: analyzedProps.length,
      clipCount: clipList.length,
      screenplaySuccessCount,
      screenplayFailedCount,
      totalScenes,
    },
  }
}
