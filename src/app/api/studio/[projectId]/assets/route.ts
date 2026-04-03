import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { attachMediaFieldsToProject } from '@/lib/media/attach'

function readAssetKind(value: Record<string, unknown>): string {
    return typeof value.assetKind === 'string' ? value.assetKind : 'location'
}

/**
 * GET - 获取项目资产（角色 + 场景）
 * 🔥 V6.5: 为 useProjectAssets hook 提供统一的资产数据接口
 */
export const GET = apiHandler(async (
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await context.params

    // 🔐 统一权限验证
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult

    // 获取项目的角色和场景数据
    const novelData = await prisma.studioProject.findUnique({
        where: { projectId },
        include: {
            characters: {
                include: {
                    appearances: {
                        orderBy: { appearanceIndex: 'asc' }
                    }
                },
                orderBy: { createdAt: 'asc' }
            },
            locations: {
                include: {
                    images: {
                        orderBy: { imageIndex: 'asc' }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!novelData) {
        return NextResponse.json({ characters: [], locations: [], props: [] })
    }

    // 为资产添加稳定媒体 URL（并保留兼容字段）
    const withSignedUrls = await attachMediaFieldsToProject(novelData)
    const locations = (withSignedUrls.locations || []).filter((item) => readAssetKind(item) !== 'prop')
    const props = (withSignedUrls.locations || []).filter((item) => readAssetKind(item) === 'prop')

    return NextResponse.json({
        characters: withSignedUrls.characters || [],
        locations,
        props,
    })
})
