import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { isErrorResponse, requireProjectAuthLight, requireUserAuth } from '@/lib/api-auth'
import { createAsset } from '@/lib/assets/services/asset-actions'
import { readAssets } from '@/lib/assets/services/read-assets'
import type { AssetKind, AssetScope } from '@/lib/assets/contracts'

function isAssetScope(value: string | null): value is AssetScope {
  return value === 'global' || value === 'project'
}

function isAssetKind(value: string | null): value is AssetKind {
  return value === 'character' || value === 'location' || value === 'prop' || value === 'voice'
}

export const GET = apiHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const scope = searchParams.get('scope')
  const projectId = searchParams.get('projectId')
  const folderId = searchParams.get('folderId')
  const kind = searchParams.get('kind')

  if (!isAssetScope(scope)) {
    throw new ApiError('INVALID_PARAMS', { details: 'scope must be global or project' })
  }

  if (scope === 'project') {
    if (!projectId) {
      throw new ApiError('INVALID_PARAMS', { details: 'projectId is required for project scope' })
    }
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult
    const assets = await readAssets({
      scope,
      projectId,
      folderId,
      kind: isAssetKind(kind) ? kind : null,
    })
    return NextResponse.json({ assets })
  } else {
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
    const assets = await readAssets({
      scope,
      projectId,
      folderId,
      kind: isAssetKind(kind) ? kind : null,
    }, {
      userId: authResult.session.user.id,
    })
    return NextResponse.json({ assets })
  }
})

type CreateAssetBody = {
  scope?: AssetScope
  kind?: AssetKind
  projectId?: string
} & Record<string, unknown>

function isCreatableKind(value: AssetKind | undefined): value is Extract<AssetKind, 'location' | 'prop'> {
  return value === 'location' || value === 'prop'
}

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json() as CreateAssetBody
  if (!body.scope || !isCreatableKind(body.kind)) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (body.scope === 'project') {
    if (!body.projectId) {
      throw new ApiError('INVALID_PARAMS', { details: 'projectId is required for project scope' })
    }
    const authResult = await requireProjectAuthLight(body.projectId)
    if (isErrorResponse(authResult)) return authResult
    const result = await createAsset({
      kind: body.kind,
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
  const result = await createAsset({
    kind: body.kind,
    body,
    access: {
      scope: 'global',
      userId: authResult.session.user.id,
    },
  })
  return NextResponse.json(result)
})
