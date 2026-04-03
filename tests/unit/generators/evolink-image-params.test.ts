import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiConfigMock = vi.hoisted(() => ({
  getProviderConfig: vi.fn(async () => ({ apiKey: 'evolink-key' })),
}))

const outboundImageMock = vi.hoisted(() => ({
  normalizeToBase64ForGeneration: vi.fn(async (url: string) => `data:image/png;base64,${Buffer.from(url).toString('base64')}`),
}))

const urlResolverMock = vi.hoisted(() => ({
  resolveToExternalUrl: vi.fn(async (input: string) => input),
  toPublicUrl: vi.fn((input: string) => input),
  isPrivateUrl: vi.fn(() => false),
}))

vi.mock('@/lib/api-config', () => apiConfigMock)
vi.mock('@/lib/media/outbound-image', () => outboundImageMock)
vi.mock('@/lib/providers/evolink/url-resolver', () => urlResolverMock)

const fetchMock = vi.hoisted(() =>
  vi.fn(async () => ({
    ok: true,
    json: async () => ({ id: 'task-img-1' }),
    text: async () => '',
  })),
)
vi.stubGlobal('fetch', fetchMock)

import { EvolinkImageGenerator } from '@/lib/generators/evolink'

function getLastFetchBody(): Record<string, unknown> {
  const call = fetchMock.mock.calls.at(-1) as [string, RequestInit] | undefined
  if (!call) throw new Error('fetch not called')
  return JSON.parse(call[1].body as string) as Record<string, unknown>
}

describe('EvolinkImageGenerator param mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiConfigMock.getProviderConfig.mockResolvedValue({ apiKey: 'evolink-key' })
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'task-img-1' }),
      text: async () => '',
    })
  })

  it('maps aspectRatio to size', async () => {
    const generator = new EvolinkImageGenerator()
    await generator.generate({
      userId: 'u1',
      prompt: 'a cat',
      options: { modelId: 'z-image-turbo', aspectRatio: '16:9' },
    })

    const body = getLastFetchBody()
    expect(body.model).toBe('z-image-turbo')
    expect(body.size).toBe('16:9')
    expect(body.prompt).toBe('a cat')
  })

  it('maps resolution to quality', async () => {
    const generator = new EvolinkImageGenerator()
    await generator.generate({
      userId: 'u1',
      prompt: 'a dog',
      options: { modelId: 'gemini-3.1-flash-image-preview', resolution: '2K' },
    })

    expect(getLastFetchBody().quality).toBe('2K')
  })

  it('converts reference images to base64 and sends as image_urls', async () => {
    const generator = new EvolinkImageGenerator()
    await generator.generate({
      userId: 'u1',
      prompt: 'a scene',
      referenceImages: ['https://img.com/ref1.jpg', 'data:image/png;base64,AAAA'],
      options: { modelId: 'gemini-3.1-flash-image-preview' },
    })

    const body = getLastFetchBody()
    const imageUrls = body.image_urls as string[]
    expect(imageUrls).toHaveLength(2)
    // Both images resolved through resolveToExternalUrl (called via Array.map with 3 args)
    expect(urlResolverMock.resolveToExternalUrl).toHaveBeenCalledTimes(2)
    expect(urlResolverMock.resolveToExternalUrl.mock.calls[0][0]).toBe('https://img.com/ref1.jpg')
    expect(urlResolverMock.resolveToExternalUrl.mock.calls[1][0]).toBe('data:image/png;base64,AAAA')
    expect(imageUrls[0]).toBe('https://img.com/ref1.jpg')
    expect(imageUrls[1]).toBe('data:image/png;base64,AAAA')
  })

  it('does not send image_urls when no reference images', async () => {
    const generator = new EvolinkImageGenerator()
    await generator.generate({
      userId: 'u1',
      prompt: 'a landscape',
      options: { modelId: 'z-image-turbo' },
    })

    expect(getLastFetchBody().image_urls).toBeUndefined()
  })

  it('returns async result with EVOLINK:IMAGE externalId', async () => {
    const generator = new EvolinkImageGenerator()
    const result = await generator.generate({
      userId: 'u1',
      prompt: 'test',
      options: { modelId: 'z-image-turbo' },
    })

    expect(result.success).toBe(true)
    expect(result.async).toBe(true)
    expect(result.requestId).toBe('task-img-1')
    expect(result.externalId).toBe('EVOLINK:IMAGE:task-img-1')
  })

  it('sends to /v1/images/generations with Bearer auth', async () => {
    const generator = new EvolinkImageGenerator()
    await generator.generate({
      userId: 'u1',
      prompt: 'test',
      options: { modelId: 'z-image-turbo' },
    })

    const call = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(call[0]).toBe('https://api.evolink.ai/v1/images/generations')
    const headers = call[1].headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer evolink-key')
  })

  it('defaults modelId to z-image-turbo', async () => {
    const generator = new EvolinkImageGenerator()
    await generator.generate({
      userId: 'u1',
      prompt: 'test',
    })

    expect(getLastFetchBody().model).toBe('z-image-turbo')
  })

  it('rejects unsupported options', async () => {
    const generator = new EvolinkImageGenerator()
    const result = await generator.generate({
      userId: 'u1',
      prompt: 'test',
      options: { modelId: 'z-image-turbo', badOption: 'oops' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('EVOLINK_IMAGE_OPTION_UNSUPPORTED: badOption')
  })
})
