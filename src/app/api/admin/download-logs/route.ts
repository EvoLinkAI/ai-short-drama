import { NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { readAllLogs } from '@/lib/logging/file-writer'

export const dynamic = 'force-dynamic'

// GET - 下载所有日志
export const GET = apiHandler(async () => {
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult

    const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean)
    if (adminIds.length > 0 && !adminIds.includes(authResult.session.user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const logs = await readAllLogs()
    if (!logs) {
        return NextResponse.json({ error: 'No logs available' }, { status: 404 })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `app-logs-${timestamp}.txt`

    return new NextResponse(logs, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    })
})
