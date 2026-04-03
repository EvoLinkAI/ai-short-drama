import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { isErrorResponse, requireProjectAuthLight, requireUserAuth } from '@/lib/api-auth'
import { submitAssetGenerateTask } from '@/lib/assets/services/asset-actions'
import type { AssetKind, AssetScope } from '@/lib/assets/contracts'

type GenerateBody = {
  scope?: AssetScope
  kind?: Extract<AssetKind, 'character' | 'location' | 'prop'>
  projectId?: string
} & Record<string, unknown>

export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) => {
  const { assetId } = await context.params
  const body = await request.json() as GenerateBody
  if ((body.scope !== 'global' && body.scope !== 'project') || (body.kind !== 'character' && body.kind !== 'location' && body.kind !== 'prop')) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (body.scope === 'project') {
    if (!body.projectId) throw new ApiError('INVALID_PARAMS')
    const authResult = await requireProjectAuthLight(body.projectId)
    if (isErrorResponse(authResult)) return authResult
    const result = await submitAssetGenerateTask({
      request,
      kind: body.kind,
      assetId,
      body,
      access: {
        scope: 'project',
        userId: authResult.session.user.id,
        projectId: body.projectId,
      },
    })
    return NextResponse.json(result)
  }
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const result = await submitAssetGenerateTask({
    request,
    kind: body.kind,
    assetId,
    body,
    access: {
      scope: 'global',
      userId: authResult.session.user.id,
    },
  })
  return NextResponse.json(result)
})
