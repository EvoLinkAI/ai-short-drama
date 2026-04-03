import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { isErrorResponse, requireUserAuth } from '@/lib/api-auth'
import { selectAssetRender } from '@/lib/assets/services/asset-actions'

type LegacySelectBody = Record<string, unknown> & {
  type?: 'character' | 'location'
  id?: string
}

export const POST = apiHandler(async (request: NextRequest) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json() as LegacySelectBody
  if ((body.type !== 'character' && body.type !== 'location') || typeof body.id !== 'string' || body.id.trim().length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const result = await selectAssetRender({
    kind: body.type,
    assetId: body.id,
    body,
    access: {
      scope: 'global',
      userId: authResult.session.user.id,
    },
  })

  return NextResponse.json(result)
})
