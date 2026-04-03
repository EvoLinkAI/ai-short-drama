import { ensureStorageReady } from '@/lib/storage/bootstrap'
import { requireEnv } from '@/lib/storage/utils'
import { createScopedLogger } from '@/lib/logging/core'

const logger = createScopedLogger({ module: 'storage:init' })

async function main() {
  const result = await ensureStorageReady()

  if (result === 'skipped') {
    return
  }

  const bucket = requireEnv('MINIO_BUCKET')
  if (result === 'created') {
    logger.info(`[storage:init] created MinIO bucket "${bucket}"`)
    return
  }

  logger.info(`[storage:init] verified MinIO bucket "${bucket}"`)
}

void main().catch((error: unknown) => {
  logger.error('[storage:init] failed to prepare storage', error)
  process.exit(1)
})
