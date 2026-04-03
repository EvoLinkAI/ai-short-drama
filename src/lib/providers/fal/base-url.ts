const DEFAULT_FAL_QUEUE_BASE_URL = 'https://queue.fal.run'

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

export function resolveFalQueueBaseUrl(): string {
  const override = process.env.FAL_QUEUE_BASE_URL?.trim()
  if (!override) return DEFAULT_FAL_QUEUE_BASE_URL
  return normalizeBaseUrl(override)
}

export function buildFalQueueUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '')
  return `${resolveFalQueueBaseUrl()}/${normalizedPath}`
}
