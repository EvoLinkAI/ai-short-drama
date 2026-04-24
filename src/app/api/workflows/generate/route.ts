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
    const isBeta = (body.model || '') === 'gpt-image-2-beta'
    payload = {
      model: body.model || 'gpt-image-2',
      prompt: body.prompt,
    }
    if (body.size) payload.size = body.size
    if (!isBeta && body.resolution) payload.resolution = body.resolution
    if (!isBeta && body.quality) payload.quality = body.quality
  } else if (step === 'video') {
    endpoint = `${EVOLINK_API_BASE}/videos/generations`
    const hasAudio = !!body.audioUrl
    const hasImage = !!body.imageUrl
    const defaultModel = hasAudio
      ? 'seedance-2.0-reference-to-video'
      : hasImage
        ? 'seedance-2.0-image-to-video'
        : 'seedance-2.0-text-to-video'
    const videoPrompt = (body.prompt || '').slice(0, 500)
    payload = {
      model: body.model || defaultModel,
      prompt: videoPrompt,
    }
    if (hasImage) {
      payload.image_urls = [body.imageUrl]
    }
    if (hasAudio) {
      payload.audio_urls = [body.audioUrl]
      payload.quality = '720p'
    }
    const dur = Math.max(4, Math.min(15, Number(body.duration) || 5))
    payload.duration = dur
    if (body.size) payload.aspect_ratio = body.size
    payload.generate_audio = true
  } else if (step === 'music') {
    endpoint = `${EVOLINK_API_BASE}/audios/generations`
    payload = {
      model: body.model || 'suno-v5-beta',
      prompt: body.prompt || '',
      custom_mode: body.customMode ?? false,
      instrumental: body.instrumental ?? false,
      duration: Math.min(15, Number(body.duration) || 15),
    }
    if (body.style) payload.style = body.style
    if (body.title) payload.title = body.title
  } else {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  }

  console.log(`[workflow-generate] step=${step} endpoint=${endpoint} payload=`, JSON.stringify(payload))
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
