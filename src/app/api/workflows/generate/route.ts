import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { getProviderConfig } from '@/lib/api-config'
import { EVOLINK_API_BASE } from '@/lib/providers/evolink/constants'

export const POST = apiHandler(async (request: NextRequest) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const step = body.step as string

  const { apiKey } = await getProviderConfig(session.user.id, 'evolink')
  if (!apiKey) {
    return NextResponse.json({ error: 'EvoLink API key not configured' }, { status: 400 })
  }

  let endpoint: string
  let payload: Record<string, unknown>

  if (step === 'image') {
    endpoint = `${EVOLINK_API_BASE}/images/generations`
    payload = {
      model: body.model || 'gpt-image-2',
      prompt: body.prompt,
    }
    if (body.size) payload.size = body.size
    if (body.resolution) payload.resolution = body.resolution
    if (body.quality) payload.quality = body.quality
  } else if (step === 'video') {
    endpoint = `${EVOLINK_API_BASE}/videos/generations`
    payload = {
      model: body.model || 'seedance-2.0',
      image_url: body.imageUrl,
      prompt: body.prompt || '',
    }
    if (body.duration) payload.duration = Number(body.duration)
    if (body.size) payload.aspect_ratio = body.size
  } else {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    const msg = data?.error?.message || data?.message || `API error ${response.status}`
    return NextResponse.json({ error: msg }, { status: response.status })
  }

  return NextResponse.json({ taskId: data.id, status: data.status })
})
