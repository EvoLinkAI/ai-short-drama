import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { createStorageProvider } from '@/lib/storage/factory'
import type { StorageFactoryOptions } from '@/lib/storage/types'
import { requireEnv } from '@/lib/storage/utils'

const DEFAULT_MINIO_REGION = 'us-east-1'

export type StorageBootstrapResult = 'skipped' | 'existing' | 'created'

type BucketErrorShape = {
  name?: string
  code?: string
  Code?: string
  $metadata?: {
    httpStatusCode?: number
  }
}

function isMissingBucketError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const bucketError = error as BucketErrorShape
  const errorName = bucketError.name || ''
  const errorCode = bucketError.code || bucketError.Code || ''
  const statusCode = bucketError.$metadata?.httpStatusCode

  return errorName === 'NotFound'
    || errorCode === 'NotFound'
    || errorCode === 'NoSuchBucket'
    || statusCode === 404
}

export async function ensureMinioBucket(): Promise<Exclude<StorageBootstrapResult, 'skipped'>> {
  const endpoint = requireEnv('MINIO_ENDPOINT')
  const accessKeyId = requireEnv('MINIO_ACCESS_KEY')
  const secretAccessKey = requireEnv('MINIO_SECRET_KEY')
  const bucket = requireEnv('MINIO_BUCKET')
  const region = (process.env.MINIO_REGION || DEFAULT_MINIO_REGION).trim() || DEFAULT_MINIO_REGION
  const forcePathStyle = process.env.MINIO_FORCE_PATH_STYLE !== 'false'

  const client = new S3Client({
    endpoint,
    region,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    return 'existing'
  } catch (error: unknown) {
    if (!isMissingBucketError(error)) {
      throw error
    }
  }

  await client.send(new CreateBucketCommand({ Bucket: bucket }))
  return 'created'
}

export async function ensureStorageReady(options: StorageFactoryOptions = {}): Promise<StorageBootstrapResult> {
  const provider = createStorageProvider(options)

  if (provider.kind !== 'minio') {
    return 'skipped'
  }

  return await ensureMinioBucket()
}
