import { NextRequest, NextResponse } from 'next/server'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError, getRequestId } from '@/lib/api-errors'
import { submitTask } from '@/lib/task/submitter'
import { resolveRequiredTaskLocale } from '@/lib/task/resolve-locale'
import { TASK_TYPE } from '@/lib/task/types'

export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params

  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)

  const episodeId = body?.episodeId
  if (typeof episodeId !== 'string' || !episodeId) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'EPISODE_ID_REQUIRED',
      field: 'episodeId',
    })
  }

  const result = await submitTask({
    userId: session.user.id,
    locale,
    requestId: getRequestId(request),
    projectId,
    episodeId,
    type: TASK_TYPE.MERGE_EPISODE_VIDEOS,
    targetType: 'StudioEpisode',
    targetId: episodeId,
    payload: { episodeId },
    dedupeKey: `merge_videos:${episodeId}`,
    billingInfo: { billable: false },
  })

  return NextResponse.json(result)
})
