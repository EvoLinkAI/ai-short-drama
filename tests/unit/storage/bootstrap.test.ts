import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureStorageReady } from '@/lib/storage/bootstrap'

type MockCommand = {
  readonly type: 'HeadBucketCommand' | 'CreateBucketCommand'
  readonly input: Record<string, unknown>
}

const {
  sendMock,
  s3ClientMock,
  headBucketCommandMock,
  createBucketCommandMock,
} = vi.hoisted(() => ({
  sendMock: vi.fn<(command: MockCommand) => Promise<unknown>>(),
  s3ClientMock: vi.fn(() => ({ send: undefined as unknown })),
  headBucketCommandMock: vi.fn((input: Record<string, unknown>): MockCommand => ({
    type: 'HeadBucketCommand',
    input,
  })),
  createBucketCommandMock: vi.fn((input: Record<string, unknown>): MockCommand => ({
    type: 'CreateBucketCommand',
    input,
  })),
}))

s3ClientMock.mockImplementation(() => ({ send: sendMock }))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: s3ClientMock,
  HeadBucketCommand: headBucketCommandMock,
  CreateBucketCommand: createBucketCommandMock,
}))

describe('storage bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MINIO_ENDPOINT = 'http://127.0.0.1:9000'
    process.env.MINIO_REGION = 'us-east-1'
    process.env.MINIO_BUCKET = 'aidrama-studio'
    process.env.MINIO_ACCESS_KEY = 'minioadmin'
    process.env.MINIO_SECRET_KEY = 'minioadmin'
    process.env.MINIO_FORCE_PATH_STYLE = 'true'
  })

  it('skips startup storage initialization when STORAGE_TYPE=local', async () => {
    await expect(ensureStorageReady({ storageType: 'local' })).resolves.toBe('skipped')
    expect(s3ClientMock).not.toHaveBeenCalled()
  })

  it('verifies the MinIO bucket during startup when it already exists', async () => {
    sendMock.mockResolvedValueOnce({})

    await expect(ensureStorageReady({ storageType: 'minio' })).resolves.toBe('existing')

    expect(s3ClientMock).toHaveBeenCalledWith({
      endpoint: 'http://127.0.0.1:9000',
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
      },
    })
    expect(headBucketCommandMock).toHaveBeenCalledWith({ Bucket: 'aidrama-studio' })
    expect(createBucketCommandMock).not.toHaveBeenCalled()
  })

  it('creates the MinIO bucket during startup when HeadBucket reports it missing', async () => {
    sendMock
      .mockRejectedValueOnce(Object.assign(new Error('missing bucket'), {
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      }))
      .mockResolvedValueOnce({})

    await expect(ensureStorageReady({ storageType: 'minio' })).resolves.toBe('created')

    expect(headBucketCommandMock).toHaveBeenCalledWith({ Bucket: 'aidrama-studio' })
    expect(createBucketCommandMock).toHaveBeenCalledWith({ Bucket: 'aidrama-studio' })
    expect(sendMock).toHaveBeenNthCalledWith(2, {
      type: 'CreateBucketCommand',
      input: { Bucket: 'aidrama-studio' },
    })
  })

  it('fails fast when MinIO returns a non-bucket-missing error at startup', async () => {
    const startupError = Object.assign(new Error('MinIO unavailable'), {
      name: 'TimeoutError',
      $metadata: { httpStatusCode: 503 },
    })
    sendMock.mockRejectedValueOnce(startupError)

    await expect(ensureStorageReady({ storageType: 'minio' })).rejects.toBe(startupError)
    expect(createBucketCommandMock).not.toHaveBeenCalled()
  })
})
