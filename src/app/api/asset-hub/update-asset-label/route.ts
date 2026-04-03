import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { updateAssetRenderLabel } from '@/lib/assets/services/asset-label'

/**
 * POST /api/asset-hub/update-asset-label
 * 更新资产中心图片上的黑边标识符（修改名字后调用）
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
    void authResult

    const body = await request.json()
    const { type, id, newName, appearanceIndex } = body

    if (!type || !id || !newName) {
        throw new ApiError('INVALID_PARAMS')
    }

    void appearanceIndex

    if (type === 'character' || type === 'location') {
        await updateAssetRenderLabel({
            scope: 'global',
            kind: type,
            assetId: id,
            newName,
        })
        return NextResponse.json({ success: true })
    }

    throw new ApiError('INVALID_PARAMS')
})
