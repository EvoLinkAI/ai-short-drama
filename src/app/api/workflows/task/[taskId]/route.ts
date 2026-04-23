import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { getProviderConfig } from '@/lib/api-config'
import { EVOLINK_API_BASE } from '@/lib/providers/evolink/constants'

export const GET = apiHandler(async (
  _request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const { taskId } = await context.params
  const { apiKey } = await getProviderConfig(session.user.id, 'evolink')

  const response = await fetch(`${EVOLINK_API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message || 'Task query failed' }, { status: response.status })
  }

  const resultUrls: string[] = []
  const rd = data.result_data
  if (rd) {
    if (typeof rd.image_url === 'string') resultUrls.push(rd.image_url)
    if (typeof rd.video_url === 'string') resultUrls.push(rd.video_url)
    if (Array.isArray(rd.images)) {
      for (const img of rd.images) {
        if (typeof img === 'string') resultUrls.push(img)
        else if (img && typeof img.url === 'string') resultUrls.push(img.url)
      }
    }
    if (Array.isArray(rd.results)) {
      for (const r of rd.results) {
        if (typeof r === 'string') resultUrls.push(r)
      }
    }
  }
  if (resultUrls.length === 0 && Array.isArray(data.results)) {
    for (const r of data.results) {
      if (typeof r === 'string') resultUrls.push(r)
    }
  }

  return NextResponse.json({
    status: data.status,
    progress: data.progress ?? 0,
    resultUrls,
    error: data.error?.message || null,
  })
})
