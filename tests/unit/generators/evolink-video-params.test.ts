import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiConfigMock = vi.hoisted(() => ({
  getProviderConfig: vi.fn(async () => ({ apiKey: 'evolink-key' })),
}))

vi.mock('@/lib/api-config', () => apiConfigMock)

const fetchMock = vi.hoisted(() =>
  vi.fn(async () => ({
    ok: true,
    json: async () => ({ id: 'task-evolink-1' }),
    text: async () => '',
  })),
)
vi.stubGlobal('fetch', fetchMock)

import { EvolinkVideoGenerator } from '@/lib/generators/evolink'

function getLastFetchBody(): Record<string, unknown> {
  const call = fetchMock.mock.calls.at(-1) as [string, RequestInit] | undefined
  if (!call) throw new Error('fetch not called')
  return JSON.parse(call[1].body as string) as Record<string, unknown>
}

function getLastFetchUrl(): string {
  const call = fetchMock.mock.calls.at(-1) as [string, RequestInit] | undefined
  if (!call) throw new Error('fetch not called')
  return call[0]
}

describe('EvolinkVideoGenerator param routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiConfigMock.getProviderConfig.mockResolvedValue({ apiKey: 'evolink-key' })
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'task-evolink-1' }),
      text: async () => '',
    })
  })

  // ============================================================
  // Kling models: image_start/image_end + sound
  // ============================================================

  it('Kling uses image_start and image_end', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: {
        modelId: 'kling-v3-image-to-video',
        lastFrameImageUrl: 'https://img.com/end.jpg',
      },
    })

    const body = getLastFetchBody()
    expect(body.model).toBe('kling-v3-image-to-video')
    expect(body.image_start).toBe('https://img.com/start.jpg')
    expect(body.image_end).toBe('https://img.com/end.jpg')
    expect(body.image_urls).toBeUndefined()
  })

  it('Kling maps generateAudio to sound on/off', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'kling-o3-image-to-video', generateAudio: true },
    })
    expect(getLastFetchBody().sound).toBe('on')

    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'kling-o3-image-to-video', generateAudio: false },
    })
    expect(getLastFetchBody().sound).toBe('off')
  })

  it('Kling supports aspect_ratio and quality', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: {
        modelId: 'kling-v3-image-to-video',
        aspectRatio: '16:9',
        resolution: '1080p',
        duration: 10,
      },
    })

    const body = getLastFetchBody()
    expect(body.aspect_ratio).toBe('16:9')
    expect(body.quality).toBe('1080p')
    expect(body.duration).toBe(10)
  })

  // ============================================================
  // Wan models: image_urls array, no aspect_ratio
  // ============================================================

  it('Wan uses image_urls array instead of image_start', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'wan2.6-image-to-video' },
    })

    const body = getLastFetchBody()
    expect(body.image_urls).toEqual(['https://img.com/start.jpg'])
    expect(body.image_start).toBeUndefined()
    expect(body.image_end).toBeUndefined()
  })

  it('Wan does not send aspect_ratio', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'wan2.6-image-to-video', aspectRatio: '16:9' },
    })

    expect(getLastFetchBody().aspect_ratio).toBeUndefined()
  })

  it('Wan 2.6 (non-flash) does not send generate_audio', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'wan2.6-image-to-video', generateAudio: true },
    })

    const body = getLastFetchBody()
    expect(body.generate_audio).toBeUndefined()
    expect(body.sound).toBeUndefined()
  })

  it('Wan 2.6 Flash sends generate_audio', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'wan2.6-image-to-video-flash', generateAudio: true },
    })

    expect(getLastFetchBody().generate_audio).toBe(true)
  })

  it('Wan does not include lastFrameImageUrl', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: {
        modelId: 'wan2.6-image-to-video',
        lastFrameImageUrl: 'https://img.com/end.jpg',
      },
    })

    const body = getLastFetchBody()
    // Wan is not Seedance, so lastFrameImageUrl should NOT be in image_urls
    expect(body.image_urls).toEqual(['https://img.com/start.jpg'])
  })

  // ============================================================
  // Seedance models: image_urls with first+last frame, generate_audio
  // ============================================================

  it('Seedance uses image_urls with first and last frame', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: {
        modelId: 'seedance-1.5-pro',
        lastFrameImageUrl: 'https://img.com/end.jpg',
      },
    })

    const body = getLastFetchBody()
    expect(body.image_urls).toEqual([
      'https://img.com/start.jpg',
      'https://img.com/end.jpg',
    ])
    expect(body.image_start).toBeUndefined()
  })

  it('Seedance maps generateAudio to generate_audio boolean', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'seedance-1.5-pro', generateAudio: false },
    })

    const body = getLastFetchBody()
    expect(body.generate_audio).toBe(false)
    expect(body.sound).toBeUndefined()
  })

  it('Seedance supports aspect_ratio', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'seedance-1.5-pro', aspectRatio: '9:16' },
    })

    expect(getLastFetchBody().aspect_ratio).toBe('9:16')
  })

  // ============================================================
  // Common behavior
  // ============================================================

  it('returns async result with EVOLINK:VIDEO externalId', async () => {
    const generator = new EvolinkVideoGenerator()
    const result = await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'kling-v3-image-to-video' },
    })

    expect(result.success).toBe(true)
    expect(result.async).toBe(true)
    expect(result.requestId).toBe('task-evolink-1')
    expect(result.externalId).toBe('EVOLINK:VIDEO:task-evolink-1')
  })

  it('sends to /v1/videos/generations with Bearer auth', async () => {
    const generator = new EvolinkVideoGenerator()
    await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'kling-v3-image-to-video' },
    })

    expect(getLastFetchUrl()).toBe('https://api.evolink.ai/v1/videos/generations')
    const call = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit]
    const headers = call[1].headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer evolink-key')
  })

  it('rejects unsupported options', async () => {
    const generator = new EvolinkVideoGenerator()
    const result = await generator.generate({
      userId: 'u1',
      imageUrl: 'https://img.com/start.jpg',
      prompt: 'test',
      options: { modelId: 'kling-v3-image-to-video', unknownParam: 'bad' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('EVOLINK_VIDEO_OPTION_UNSUPPORTED: unknownParam')
  })
})
