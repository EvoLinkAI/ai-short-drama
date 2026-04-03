[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **storage**

# Storage Module

Pluggable object storage abstraction supporting MinIO (default), local filesystem, and COS.

## Module Purpose

Provides a unified `StorageProvider` interface for all media upload/download operations. All media references in the database go through `MediaObject` records with `storageKey` fields.

## Entry & Exports

- **Entry**: `src/lib/storage/index.ts` -- singleton provider, convenience functions
- Key exports: `getStorageProvider()`, `uploadObject()`, `deleteObject()`, `downloadAndUploadImage()`, `downloadAndUploadVideo()`, `getSignedUrl()`, `extractStorageKey()`
- **Init**: `src/lib/storage/init.ts` -- bootstrap (ensure bucket exists), run via `npm run storage:init`

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Singleton provider, high-level upload/download with retry |
| `factory.ts` | Provider creation based on `STORAGE_TYPE` env var |
| `types.ts` | `StorageProvider` interface definition |
| `providers/minio.ts` | MinIO/S3 implementation using `@aws-sdk/client-s3` |
| `providers/local.ts` | Local filesystem storage (dev only) |
| `providers/cos.ts` | Tencent COS provider (reserved) |
| `bootstrap.ts` | Bucket creation and initialization |
| `signed-urls.ts` | Pre-signed URL generation |
| `utils.ts` | Retry helper, default expiry constants |
| `errors.ts` | Storage-specific error types |

## Configuration

| Env Variable | Description |
|-------------|-------------|
| `STORAGE_TYPE` | `minio` (default), `local`, `cos` |
| `MINIO_ENDPOINT` | MinIO/S3 endpoint URL |
| `MINIO_REGION` | S3 region |
| `MINIO_BUCKET` | Bucket name |
| `MINIO_ACCESS_KEY` | Access key |
| `MINIO_SECRET_KEY` | Secret key |
| `MINIO_FORCE_PATH_STYLE` | Path-style access (true for MinIO) |

## Key Behaviors

- Image upload includes automatic JPEG compression via `sharp` (quality 95, progressive reduction if >10MB)
- Upload operations retry up to 3 times with exponential backoff (2s base)
- Signed URLs route through `/api/storage/sign` or `/api/files/` for local storage

## Related Files

- `src/lib/media/service.ts` -- MediaObject lifecycle management
- `src/lib/media/attach.ts` -- Attaching media to database records

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
