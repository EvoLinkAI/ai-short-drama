import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { isErrorResponse, requireProjectAuthLight } from '@/lib/api-auth'
import { copyAssetFromGlobal } from '@/lib/assets/services/asset-actions'
import type { AssetKind } from '@/lib/assets/contracts'

type CopyBody = {
  kind?: AssetKind
  projectId?: string
  globalAssetId?: string
}

export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) => {
  const { assetId } = await context.params
  const body = await request.json() as CopyBody
  if (!body.projectId || !body.globalAssetId || (body.kind !== 'character' && body.kind !== 'location' && body.kind !== 'prop' && body.kind !== 'voice')) {
    throw new ApiError('INVALID_PARAMS')
  }
  const authResult = await requireProjectAuthLight(body.projectId)
  if (isErrorResponse(authResult)) return authResult
  const result = await copyAssetFromGlobal({
    kind: body.kind,
    targetId: assetId,
    globalAssetId: body.globalAssetId,
    access: {
      userId: authResult.session.user.id,
      projectId: body.projectId,
    },
  })
  return NextResponse.json(result)
})
