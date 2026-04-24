import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { getProviderConfig } from '@/lib/api-config'

const EVOLINK_FILES_API = 'https://files-api.evolink.ai'

export const POST = apiHandler(async (request: NextRequest) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const { audioUrl, duration = 10 } = body

  if (!audioUrl) {
    return NextResponse.json({ error: 'Missing audioUrl' }, { status: 400 })
  }

  const { apiKey } = await getProviderConfig(session.user.id, 'evolink')
  if (!apiKey) {
    return NextResponse.json({ error: 'EvoLink API key not configured' }, { status: 400 })
  }

  const targetDuration = Math.max(4, Math.min(15, Number(duration)))

  // Download the full audio
  const audioRes = await fetch(audioUrl)
  if (!audioRes.ok) {
    return NextResponse.json({ error: 'Failed to download audio' }, { status: 500 })
  }

  const fullBuffer = Buffer.from(await audioRes.arrayBuffer())
  const contentType = audioRes.headers.get('content-type') || 'audio/mpeg'

  // Rough MP3 trim: estimate bytes for target duration
  // MP3 typical bitrate ~128-192kbps, use ~20KB/sec as safe estimate
  const bytesPerSecond = 20_000
  const targetBytes = targetDuration * bytesPerSecond
  const trimmedBuffer = fullBuffer.length > targetBytes
    ? fullBuffer.subarray(0, targetBytes)
    : fullBuffer

  console.log(`[trim-audio] original=${fullBuffer.length}b trimmed=${trimmedBuffer.length}b target=${targetDuration}s`)

  // Upload trimmed audio to EvoLink file service
  const ext = contentType.includes('mp3') || contentType.includes('mpeg') ? 'mp3' : 'wav'
  const base64Data = `data:${contentType};base64,${trimmedBuffer.toString('base64')}`

  const uploadRes = await fetch(`${EVOLINK_FILES_API}/api/v1/files/upload/base64`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64_data: base64Data,
      upload_path: 'workflow-audio',
      file_name: `trimmed-${Date.now()}.${ext}`,
    }),
  })

  const uploadData = await uploadRes.json()

  if (!uploadRes.ok || !uploadData?.success) {
    console.error('[trim-audio] Upload failed:', JSON.stringify(uploadData))
    return NextResponse.json({
      error: uploadData?.msg || 'Audio upload failed',
      fallback: true,
    }, { status: 200 })
  }

  const trimmedUrl = uploadData.data?.file_url || uploadData.data?.download_url
  console.log(`[trim-audio] Uploaded: ${trimmedUrl}`)

  return NextResponse.json({ trimmedUrl })
})
