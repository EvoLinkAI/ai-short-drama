import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { getProviderConfig } from '@/lib/api-config'
import { EVOLINK_API_BASE } from '@/lib/providers/evolink/constants'

function buildSystemPrompt(duration: number): string {
  let timeAxis: string
  let cutCount: string

  if (duration <= 6) {
    cutCount = '2-3'
    timeAxis = `[0s-2s] Shot 1: Opening — establishing shot, character intro, strong visual hook
[2s-4s] Shot 2 (Fast Cut): Core action — close-up or tracking shot, key conflict/expression
[4s-6s] Shot 3 (Closing): Resolution — pull back or freeze, emotional landing, suspense hold`
  } else if (duration <= 10) {
    cutCount = '3-4'
    timeAxis = `[0s-3s] Shot 1: Opening — establishing shot, character intro, environment mood
[3s-5s] Shot 2 (Fast Cut): Angle shift — close-up or side profile, dialogue/action beat
[5s-8s] Shot 3 (Push-in): Emotional peak — interaction, expression shift, tension build
[8s-10s] Shot 4 (Closing): Pull-back or environment shift — suspense hold, visual echo`
  } else {
    cutCount = '4-5'
    timeAxis = `[0s-3s] Shot 1: Opening — camera movement, establishing framing, character placement
[3s-7s] Shot 2 (Fast Cut): Angle change — new composition, core conflict or dialogue action
[7s-11s] Shot 3 (Push-in): Emotional eruption — extreme close-up, interaction, tension peak
[11s-15s] Shot 4 (Closing): Pull-back or transition — suspense, lighting shift, visual echo`
  }

  return `You are a top-tier Seedance 2.0 short drama director specializing in cinematic AI video prompts.

TASK: Given a generated storyboard image and the user's original text prompt, produce an optimized Seedance 2.0 video prompt that will create a ${duration}-second cinematic video clip.

RULES:
- Output ONLY the video prompt text, no explanations or metadata.
- Duration: ${duration} seconds with ${cutCount} camera cuts.
- Use specific cinematic terminology: camera movements (pan, tilt, dolly, tracking, crane), shot types (ECU, CU, MS, WS, EWS), and lighting descriptions.
- Describe physical actions, facial micro-expressions, and body language in detail.
- Include [Sound: ...] tags for diegetic sound effects (footsteps, door slam, wind). NO music/BGM.
- NO subtitles, NO on-screen text.
- For dialogue, write: Character speaks: "[exact line]" — this enables native lip-sync.
- Maintain visual continuity with the provided storyboard image.
- CRITICAL: Keep the prompt under 400 characters total. Be concise. Merge shots into flowing descriptions.

TIME AXIS STRUCTURE (${duration}s):
${timeAxis}

OUTPUT FORMAT:
Write a single flowing prompt that follows the time axis structure. Start with the scene setting, then describe each shot transition naturally. Include camera movements, character actions, expressions, and sound effects inline.`
}

export const POST = apiHandler(async (request: NextRequest) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const { imageUrl, imagePrompt, videoPromptTemplate, duration = 10 } = body

  if (!imageUrl || !imagePrompt) {
    console.error('[optimize-prompt] Missing fields:', { imageUrl: !!imageUrl, imagePrompt: !!imagePrompt })
    return NextResponse.json({ error: 'Missing imageUrl or imagePrompt' }, { status: 400 })
  }

  const { apiKey } = await getProviderConfig(session.user.id, 'evolink')
  if (!apiKey) {
    console.error('[optimize-prompt] No API key for user:', session.user.id)
    return NextResponse.json({ error: 'EvoLink API key not configured' }, { status: 400 })
  }

  const systemPrompt = buildSystemPrompt(Number(duration))

  console.log('[optimize-prompt] Calling LLM:', { model: 'gpt-5.4', duration, hasImage: !!imageUrl })
  const response = await fetch(`${EVOLINK_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.4',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: `## Image Prompt (what was generated):\n${imagePrompt}\n\n## Video Prompt Template (reference style):\n${videoPromptTemplate || 'cinematic, 24fps'}\n\nAnalyze the generated storyboard image above, reference the video prompt template style, and generate an optimized ${duration}-second Seedance 2.0 video prompt with cinematic camera movements, shot transitions, and physical sound effects.`,
            },
          ],
        },
      ],
      temperature: 0.7,
      top_p: 0.9,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[optimize-prompt] LLM API error:', response.status, JSON.stringify(data))
    const msg = data?.error?.message || data?.message || `LLM API error ${response.status}`
    return NextResponse.json({ error: msg }, { status: response.status })
  }

  const optimizedPrompt = data?.choices?.[0]?.message?.content?.trim() || ''

  if (!optimizedPrompt) {
    return NextResponse.json({ error: 'Empty response from LLM' }, { status: 500 })
  }

  return NextResponse.json({ optimizedPrompt })
})
