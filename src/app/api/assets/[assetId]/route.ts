import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { isErrorResponse, requireProjectAuthLight, requireUserAuth } from '@/lib/api-auth'
import { removeAsset, updateAsset } from '@/lib/assets/services/asset-actions'
import type { AssetKind, AssetScope } from '@/lib/assets/contracts'

type UpdateAssetBody = {
  scope?: AssetScope
  kind?: AssetKind
  projectId?: string
} & Record<string, unknown>

function isAssetScope(value: unknown): value is AssetScope {
  return value === 'global' || value === 'project'
}

function isAssetKind(value: unknown): value is AssetKind {
  return value === 'character' || value === 'location' || value === 'prop' || value === 'voice'
}

export const PATCH = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) => {
  const { assetId } = await context.params
  const body = await request.json() as UpdateAssetBody
  if (!isAssetScope(body.scope) || !isAssetKind(body.kind)) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (body.scope === 'project') {
    if (!body.projectId) throw new ApiError('INVALID_PARAMS')
    const authResult = await requireProjectAuthLight(body.projectId)
    if (isErrorResponse(authResult)) return authResult
    const result = await updateAsset({
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
  const result = await updateAsset({
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

type DeleteAssetBody = {
  scope?: AssetScope
  kind?: AssetKind
  projectId?: string
}

function isDeletableKind(value: AssetKind | undefined): value is Extract<AssetKind, 'location' | 'prop'> {
  return value === 'location' || value === 'prop'
}

export const DELETE = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) => {
  const { assetId } = await context.params
  const body = await request.json() as DeleteAssetBody
  if (!isAssetScope(body.scope) || !isDeletableKind(body.kind)) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (body.scope === 'project') {
    if (!body.projectId) throw new ApiError('INVALID_PARAMS')
    const authResult = await requireProjectAuthLight(body.projectId)
    if (isErrorResponse(authResult)) return authResult
    const result = await removeAsset({
      kind: body.kind,
      assetId,
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
  const result = await removeAsset({
    kind: body.kind,
    assetId,
    access: {
      scope: 'global',
      userId: authResult.session.user.id,
    },
  })
  return NextResponse.json(result)
})
