import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { executeAiTextStep } from '@/lib/ai-runtime'
import {
  getUserWorkflowConcurrencyConfig,
  resolveProjectModelCapabilityGenerationOptions,
} from '@/lib/config-service'
import { withInternalLLMStreamCallbacks } from '@/lib/llm-observe/internal-stream-context'
import { logAIAnalysis } from '@/lib/logging/semantic'
import { onProjectNameAvailable } from '@/lib/logging/file-writer'
import { TaskTerminatedError } from '@/lib/task/errors'
import { reportTaskProgress } from '@/lib/workers/shared'
import {
  runStoryToScriptOrchestrator,
  type StoryToScriptStepMeta,
  type StoryToScriptStepOutput,
  type StoryToScriptOrchestratorResult,
} from '@/lib/studio/story-to-script/orchestrator'
import { createWorkerLLMStreamCallbacks, createWorkerLLMStreamContext } from './llm-stream'
import type { TaskJobData } from '@/lib/task/types'
import {
  asString,
  type AnyObj,
  parseEffort,
  parseTemperature,
  persistAnalyzedCharacters,
  persistAnalyzedLocations,
  persistAnalyzedProps,
  persistClips,
  resolveClipRecordId,
} from './story-to-script-helpers'
import { getPromptTemplate, PROMPT_IDS } from '@/lib/prompt-i18n'
import { resolveAnalysisModel } from './resolve-analysis-model'
import { createArtifact, listArtifacts } from '@/lib/run-runtime/service'
import { assertWorkflowRunActive, withWorkflowRunLease } from '@/lib/run-runtime/workflow-lease'
import { parseScreenplayPayload } from './screenplay-convert-helpers'

function readAssetKind(value: Record<string, unknown>): string {
  return typeof value.assetKind === 'string' ? value.assetKind : 'location'
}

function isReasoningEffort(value: unknown): value is 'minimal' | 'low' | 'medium' | 'high' {
  return value === 'minimal' || value === 'low' || value === 'medium' || value === 'high'
}

function resolveRetryClipId(retryStepKey: string): string | null {
  if (!retryStepKey.startsWith('screenplay_')) return null
  const clipId = retryStepKey.slice('screenplay_'.length).trim()
  return clipId || null
}

function buildWorkflowWorkerId(job: Job<TaskJobData>, label: string) {
  return `${label}:${job.queueName}:${job.data.taskId}`
}

export async function handleStoryToScriptTask(job: Job<TaskJobData>) {
  const payload = (job.data.payload || {}) as AnyObj
  const projectId = job.data.projectId
  const episodeIdRaw = asString(payload.episodeId || job.data.episodeId || '')
  const episodeId = episodeIdRaw.trim()
  const contentRaw = asString(payload.content)
  const inputModel = asString(payload.model).trim()
  const retryStepKey = asString(payload.retryStepKey).trim()
  const retryStepAttempt = typeof payload.retryStepAttempt === 'number' && Number.isFinite(payload.retryStepAttempt)
    ? Math.max(1, Math.floor(payload.retryStepAttempt))
    : 1
  const reasoning = payload.reasoning !== false
  const requestedReasoningEffort = parseEffort(payload.reasoningEffort)
  const temperature = parseTemperature(payload.temperature)

  if (!episodeId) {
    throw new Error('episodeId is required')
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      mode: true,
    },
  })
  if (!project) {
    throw new Error('Project not found')
  }
  if (project.mode !== 'studio') {
    throw new Error('Not a studio project')
  }

  // Register project name for per-project log file routing
  onProjectNameAvailable(projectId, project.name)

  const novelData = await prisma.studioProject.findUnique({
    where: { projectId },
    include: {
      characters: true,
      locations: true,
    },
  })
  if (!novelData) {
    throw new Error('Studio data not found')
  }

  const episode = await prisma.studioEpisode.findUnique({
    where: { id: episodeId },
    select: {
      id: true,
      studioProjectId: true,
      novelText: true,
    },
  })
  if (!episode || episode.studioProjectId !== novelData.id) {
    throw new Error('Episode not found')
  }

  const model = await resolveAnalysisModel({
    userId: job.data.userId,
    inputModel,
    projectAnalysisModel: novelData.analysisModel,
  })
  const [llmCapabilityOptions, workflowConcurrency] = await Promise.all([
    resolveProjectModelCapabilityGenerationOptions({
      projectId,
      userId: job.data.userId,
      modelType: 'llm',
      modelKey: model,
    }),
    getUserWorkflowConcurrencyConfig(job.data.userId),
  ])
  const capabilityReasoningEffort = llmCapabilityOptions.reasoningEffort
  const reasoningEffort = requestedReasoningEffort
    || (isReasoningEffort(capabilityReasoningEffort) ? capabilityReasoningEffort : 'high')

  const mergedContent = contentRaw.trim() || (episode.novelText || '')
  if (!mergedContent.trim()) {
    throw new Error('content is required')
  }
  const characterPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_AGENT_CHARACTER_PROFILE, job.data.locale)
  const locationPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_SELECT_LOCATION, job.data.locale)
  const propPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_SELECT_PROP, job.data.locale)
  const clipPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_AGENT_CLIP, job.data.locale)
  const screenplayPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_SCREENPLAY_CONVERSION, job.data.locale)
  const maxLength = 30000
  const content = mergedContent.length > maxLength ? mergedContent.slice(0, maxLength) : mergedContent
  const payloadMeta = typeof payload.meta === 'object' && payload.meta !== null
    ? (payload.meta as AnyObj)
    : {}
  const runId = typeof payload.runId === 'string' && payload.runId.trim()
    ? payload.runId.trim()
    : (typeof payloadMeta.runId === 'string' ? payloadMeta.runId.trim() : '')
  if (!runId) {
    throw new Error('runId is required for story_to_script pipeline')
  }
  const retryClipId = resolveRetryClipId(retryStepKey)
  if (retryStepKey && !retryClipId) {
    throw new Error(`unsupported retry step for story_to_script: ${retryStepKey}`)
  }
  const workerId = buildWorkflowWorkerId(job, 'story_to_script')
  const assertRunActive = async (stage: string) => {
    await assertWorkflowRunActive({
      runId,
      workerId,
      stage,
    })
  }
  const streamContext = createWorkerLLMStreamContext(job, 'story_to_script')
  const callbacks = createWorkerLLMStreamCallbacks(job, streamContext, {
    assertActive: async (stage) => {
      await assertRunActive(stage)
    },
    isActive: async () => {
      try {
        await assertRunActive('worker_llm_stream_probe')
        return true
      } catch (error) {
        if (error instanceof TaskTerminatedError) {
          return false
        }
        throw error
      }
    },
  })

  const runStep = async (
    meta: StoryToScriptStepMeta,
    prompt: string,
    action: string,
    _maxOutputTokens: number,
  ): Promise<StoryToScriptStepOutput> => {
    void _maxOutputTokens
    const stepAttempt = meta.stepAttempt
      || (retryStepKey && meta.stepId === retryStepKey ? retryStepAttempt : 1)
    await assertRunActive(`story_to_script_step:${meta.stepId}`)
    const progress = 15 + Math.min(55, Math.floor((meta.stepIndex / Math.max(1, meta.stepTotal)) * 55))
    await reportTaskProgress(job, progress, {
      stage: 'story_to_script_step',
      stageLabel: 'progress.stage.storyToScriptStep',
      displayMode: 'detail',
      message: meta.stepTitle,
      stepId: meta.stepId,
      stepAttempt,
      stepTitle: meta.stepTitle,
      stepIndex: meta.stepIndex,
      stepTotal: meta.stepTotal,
      dependsOn: Array.isArray(meta.dependsOn) ? meta.dependsOn : [],
      groupId: meta.groupId || null,
      parallelKey: meta.parallelKey || null,
      retryable: meta.retryable !== false,
      blockedBy: Array.isArray(meta.blockedBy) ? meta.blockedBy : [],
    })

    logAIAnalysis(job.data.userId, 'worker', projectId, project.name, {
      action: `STORY_TO_SCRIPT_PROMPT:${action}`,
      input: { stepId: meta.stepId, stepTitle: meta.stepTitle, prompt },
      model,
    })

    const output = await executeAiTextStep({
      userId: job.data.userId,
      model,
      messages: [{ role: 'user', content: prompt }],
      projectId,
      action,
      meta: {
        ...meta,
        stepAttempt,
      },
      temperature,
      reasoning,
      reasoningEffort,
    })
    await callbacks.flush()

    logAIAnalysis(job.data.userId, 'worker', projectId, project.name, {
      action: `STORY_TO_SCRIPT_OUTPUT:${action}`,
      output: {
        stepId: meta.stepId,
        stepTitle: meta.stepTitle,
        rawText: output.text,
        textLength: output.text.length,
        reasoningLength: output.reasoning.length,
      },
      model,
    })

    return {
      text: output.text,
      reasoning: output.reasoning,
    }
  }

  const leaseResult = await withWorkflowRunLease({
    runId,
    userId: job.data.userId,
    workerId,
    run: async () => {
      await reportTaskProgress(job, 10, {
        stage: 'story_to_script_prepare',
        stageLabel: 'progress.stage.storyToScriptPrepare',
        displayMode: 'detail',
      })

      if (retryClipId) {
        const splitArtifacts = await listArtifacts({
          runId,
          artifactType: 'clips.split',
          limit: 1,
        })
        const latestSplit = splitArtifacts[0]
        const splitPayload = latestSplit && typeof latestSplit.payload === 'object' && latestSplit.payload !== null
          ? (latestSplit.payload as Record<string, unknown>)
          : null
        if (!splitPayload) {
          throw new Error('missing clips.split artifact for retry')
        }

        const clipRows = Array.isArray(splitPayload.clipList) ? splitPayload.clipList : []
        const retryClip = clipRows.find((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return false
          return asString((item as Record<string, unknown>).id).trim() === retryClipId
        }) as Record<string, unknown> | undefined
        if (!retryClip) {
          throw new Error(`retry clip not found in artifact: ${retryClipId}`)
        }

        const clipContent = asString(retryClip.content)
        if (!clipContent.trim()) {
          throw new Error(`retry clip content is empty: ${retryClipId}`)
        }

        const screenplayPrompt = screenplayPromptTemplate
          .replace('{clip_content}', clipContent)
          .replace('{locations_lib_name}', asString(splitPayload.locationsLibName) || '无')
          .replace('{characters_lib_name}', asString(splitPayload.charactersLibName) || '无')
          .replace('{props_lib_name}', asString(splitPayload.propsLibName) || '无')
          .replace('{characters_introduction}', asString(splitPayload.charactersIntroduction) || '暂无角色介绍')
          .replace('{clip_id}', retryClipId)

        const stepMeta: StoryToScriptStepMeta = {
          stepId: retryStepKey,
          stepAttempt: retryStepAttempt,
          stepTitle: 'progress.streamStep.screenplayConversion',
          stepIndex: 1,
          stepTotal: 1,
          dependsOn: ['split_clips'],
          retryable: true,
        }
        let screenplay: AnyObj | null = null
        try {
          const stepOutput = await (async () => {
            try {
              return await withInternalLLMStreamCallbacks(
                callbacks,
                async () => await runStep(stepMeta, screenplayPrompt, 'screenplay_conversion', 2200),
              )
            } finally {
              await callbacks.flush()
            }
          })()
          screenplay = parseScreenplayPayload(stepOutput.text)
        } catch (error) {
          await createArtifact({
            runId,
            stepKey: retryStepKey,
            artifactType: 'screenplay.clip',
            refId: retryClipId,
            payload: {
              clipId: retryClipId,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            },
          })
          throw error
        }
        if (!screenplay) {
          throw new Error('retry screenplay output is empty')
        }
        await createArtifact({
          runId,
          stepKey: retryStepKey,
          artifactType: 'screenplay.clip',
          refId: retryClipId,
          payload: {
            clipId: retryClipId,
            success: true,
            sceneCount: Array.isArray(screenplay.scenes) ? screenplay.scenes.length : 0,
            screenplay,
          },
        })

        let clipRecord = await prisma.studioClip.findFirst({
          where: {
            episodeId,
            startText: asString(retryClip.startText) || null,
            endText: asString(retryClip.endText) || null,
          },
          select: { id: true },
        })
        if (!clipRecord) {
          const clipModel = prisma.studioClip as unknown as {
            create: (args: { data: Record<string, unknown>; select: { id: true } }) => Promise<{ id: string }>
          }
          clipRecord = await clipModel.create({
            data: {
              episodeId,
              startText: asString(retryClip.startText) || null,
              endText: asString(retryClip.endText) || null,
              summary: asString(retryClip.summary),
              location: asString(retryClip.location) || null,
              characters: Array.isArray(retryClip.characters) ? JSON.stringify(retryClip.characters) : null,
              props: Array.isArray(retryClip.props) ? JSON.stringify(retryClip.props) : null,
              content: clipContent,
            },
            select: { id: true },
          })
        }
        await prisma.studioClip.update({
          where: { id: clipRecord.id },
          data: {
            screenplay: JSON.stringify(screenplay),
          },
        })

        await reportTaskProgress(job, 96, {
          stage: 'story_to_script_persist_done',
          stageLabel: 'progress.stage.storyToScriptPersistDone',
          displayMode: 'detail',
          message: 'retry step completed',
          stepId: retryStepKey,
          stepAttempt: retryStepAttempt,
          stepTitle: 'progress.streamStep.screenplayConversion',
          stepIndex: 1,
          stepTotal: 1,
        })

        return {
          episodeId,
          clipCount: 1,
          screenplaySuccessCount: 1,
          screenplayFailedCount: 0,
          persistedCharacters: 0,
          persistedLocations: 0,
          persistedClips: 1,
          retryStepKey,
        }
      }

      const result: StoryToScriptOrchestratorResult = await (async () => {
        try {
          return await withInternalLLMStreamCallbacks(
            callbacks,
            async () => await runStoryToScriptOrchestrator({
              concurrency: workflowConcurrency.analysis,
              content,
              baseCharacters: (novelData.characters || []).map((item) => item.name),
              baseLocations: (novelData.locations || [])
                .filter((item) => readAssetKind(item as unknown as Record<string, unknown>) !== 'prop')
                .map((item) => item.name),
              baseProps: (novelData.locations || [])
                .filter((item) => readAssetKind(item as unknown as Record<string, unknown>) === 'prop')
                .map((item) => item.name),
              baseCharacterIntroductions: (novelData.characters || []).map((item) => ({
                name: item.name,
                introduction: item.introduction || '',
              })),
              promptTemplates: {
                characterPromptTemplate,
                locationPromptTemplate,
                propPromptTemplate,
                clipPromptTemplate,
                screenplayPromptTemplate,
              },
              runStep,
            }),
          )
        } finally {
          await callbacks.flush()
        }
      })()

      await createArtifact({
        runId,
        stepKey: 'analyze_characters',
        artifactType: 'analysis.characters',
        refId: episodeId,
        payload: {
          characters: result.analyzedCharacters,
          raw: result.charactersObject,
        },
      })
      await createArtifact({
        runId,
        stepKey: 'analyze_locations',
        artifactType: 'analysis.locations',
        refId: episodeId,
        payload: {
          locations: result.analyzedLocations,
          raw: result.locationsObject,
        },
      })
      await createArtifact({
        runId,
        stepKey: 'analyze_props',
        artifactType: 'analysis.props',
        refId: episodeId,
        payload: {
          props: result.analyzedProps,
          raw: result.propsObject,
        },
      })
      await createArtifact({
        runId,
        stepKey: 'split_clips',
        artifactType: 'clips.split',
        refId: episodeId,
        payload: {
          clipList: result.clipList,
          charactersLibName: result.charactersLibName,
          locationsLibName: result.locationsLibName,
          propsLibName: result.propsLibName,
          charactersIntroduction: result.charactersIntroduction,
        },
      })
      for (const screenplayResult of result.screenplayResults) {
        await createArtifact({
          runId,
          stepKey: `screenplay_${screenplayResult.clipId}`,
          artifactType: 'screenplay.clip',
          refId: screenplayResult.clipId,
          payload: {
            ...screenplayResult,
          },
        })
      }

      if (result.summary.screenplayFailedCount > 0) {
        const failed = result.screenplayResults.filter((item) => !item.success)
        const preview = failed
          .slice(0, 3)
          .map((item) => `${item.clipId}:${item.error || 'unknown error'}`)
          .join(' | ')
        throw new Error(
          `STORY_TO_SCRIPT_PARTIAL_FAILED: ${result.summary.screenplayFailedCount}/${result.summary.clipCount} screenplay steps failed. ${preview}`,
        )
      }

      await reportTaskProgress(job, 80, {
        stage: 'story_to_script_persist',
        stageLabel: 'progress.stage.storyToScriptPersist',
        displayMode: 'detail',
      })
      await assertRunActive('story_to_script_persist')

      const episodeStillExists = await prisma.studioEpisode.findUnique({
        where: { id: episodeId },
        select: { id: true },
      })
      if (!episodeStillExists) {
        throw new Error(`NOT_FOUND: Episode ${episodeId} was deleted while the task was running`)
      }

      const existingCharacterNames = new Set<string>(
        (novelData.characters || []).map((item) => String(item.name || '').toLowerCase()),
      )
      const existingLocationNames = new Set<string>(
        (novelData.locations || [])
          .filter((item) => readAssetKind(item as unknown as Record<string, unknown>) !== 'prop')
          .map((item) => String(item.name || '').toLowerCase()),
      )
      const existingPropNames = new Set<string>(
        (novelData.locations || [])
          .filter((item) => readAssetKind(item as unknown as Record<string, unknown>) === 'prop')
          .map((item) => String(item.name || '').toLowerCase()),
      )

      const createdCharacters = await persistAnalyzedCharacters({
        projectInternalId: novelData.id,
        existingNames: existingCharacterNames,
        analyzedCharacters: result.analyzedCharacters,
      })

      const createdLocations = await persistAnalyzedLocations({
        projectInternalId: novelData.id,
        existingNames: existingLocationNames,
        analyzedLocations: result.analyzedLocations,
      })
      const createdProps = await persistAnalyzedProps({
        projectInternalId: novelData.id,
        existingNames: existingPropNames,
        analyzedProps: result.analyzedProps,
      })

      const createdClipRows = await persistClips({
        episodeId,
        clipList: result.clipList,
      })
      const clipIdMap = new Map(createdClipRows.map((item) => [item.clipKey, item.id]))

      for (const screenplayResult of result.screenplayResults) {
        if (!screenplayResult.success || !screenplayResult.screenplay) continue
        const clipRecordId = resolveClipRecordId(clipIdMap, screenplayResult.clipId)
        if (!clipRecordId) continue
        await prisma.studioClip.update({
          where: { id: clipRecordId },
          data: {
            screenplay: JSON.stringify(screenplayResult.screenplay),
          },
        })
      }

      await reportTaskProgress(job, 96, {
        stage: 'story_to_script_persist_done',
        stageLabel: 'progress.stage.storyToScriptPersistDone',
        displayMode: 'detail',
      })

      return {
        episodeId,
        clipCount: result.summary.clipCount,
        screenplaySuccessCount: result.summary.screenplaySuccessCount,
        screenplayFailedCount: result.summary.screenplayFailedCount,
        persistedCharacters: createdCharacters.length,
        persistedLocations: createdLocations.length,
        persistedProps: createdProps.length,
        persistedClips: createdClipRows.length,
      }
    },
  })

  if (!leaseResult.claimed || !leaseResult.result) {
    return {
      runId,
      skipped: true,
      episodeId,
    }
  }
  return leaseResult.result
}
