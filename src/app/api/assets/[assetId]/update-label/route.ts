import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { isErrorResponse, requireProjectAuth, requireUserAuth } from '@/lib/api-auth'
import { updateAssetRenderLabel } from '@/lib/assets/services/asset-label'
import type { AssetKind, AssetScope } from '@/lib/assets/contracts'

type UpdateLabelBody = {
  scope?: AssetScope
  kind?: AssetKind
  projectId?: string
  newName?: string
}

function isUpdatableKind(value: AssetKind | undefined): value is Extract<AssetKind, 'character' | 'location' | 'prop'> {
  return value === 'character' || value === 'location' || value === 'prop'
}

export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) => {
  const { assetId } = await context.params
  const body = await request.json() as UpdateLabelBody

  if (!body.scope || !body.newName || !isUpdatableKind(body.kind)) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (body.scope === 'project') {
    if (!body.projectId) {
      throw new ApiError('INVALID_PARAMS', { details: 'projectId is required for project scope' })
    }
    const authResult = await requireProjectAuth(body.projectId)
    if (isErrorResponse(authResult)) return authResult
  } else {
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
  }

  await updateAssetRenderLabel({
    scope: body.scope,
    kind: body.kind,
    assetId,
    projectId: body.projectId,
    newName: body.newName,
  })

  return NextResponse.json({ success: true })
})
