[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **media**

# Media Module

Media object lifecycle management, URL normalization, and outbound image handling.

## Module Purpose

Manages `MediaObject` records in the database -- the central registry for all uploaded/generated media files. Handles URL normalization between internal storage keys and externally-accessible URLs, and provides outbound image processing.

## Key Files

| File | Purpose |
|------|---------|
| `service.ts` | MediaObject CRUD, lookup, URL resolution |
| `attach.ts` | Attach media references to database records (panels, characters, etc.) |
| `image-url.ts` | Image URL normalization and contract validation |
| `outbound-image.ts` | Outbound image URL processing and rewriting |
| `hash.ts` | SHA-256 hashing for media deduplication |
| `types.ts` | Type definitions |

## Data Model

The `MediaObject` table is referenced by 20+ relations across the schema (panels, characters, locations, voice lines, etc.). Every media file has:
- `publicId` -- public-facing identifier
- `storageKey` -- internal storage path
- `sha256` -- content hash
- `mimeType`, `sizeBytes`, `width`, `height`, `durationMs` -- metadata

## Testing

- Unit: `src/lib/media/image-url.test.ts`, `src/lib/media/outbound-image.test.ts`
- Verification: `npm run verify:outbound-image`
- Guard: `scripts/guards/image-reference-normalization-guard.mjs`

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
