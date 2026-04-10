import { describe, expect, it, vi } from 'vitest'

/**
 * Regression: API routes that previously lacked authentication
 * must now require auth (requireUserAuth).
 *
 * These are static analysis checks — they verify the source code
 * contains the expected auth patterns, not runtime behavior.
 */

const fs = await import('fs/promises')
const path = await import('path')

async function readRoute(routePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'src/app/api', routePath, 'route.ts')
  return fs.readFile(fullPath, 'utf-8')
}

describe('regression - API auth hardening', () => {
  it('/api/storage/sign requires auth', async () => {
    const source = await readRoute('storage/sign')
    expect(source).toContain('requireUserAuth')
    expect(source).toContain('isErrorResponse')
  })

  it('/api/files/[...path] is intentionally public (server-side media serving)', async () => {
    // /api/files/ must NOT have auth — it is called server-side by /m/[publicId],
    // /_next/image optimizer, vision.ts, voice generation, etc. without cookies.
    // Path traversal is guarded by normalizedPath check. See route comment for rationale.
    const source = await readRoute('files/[...path]')
    expect(source).not.toContain('requireUserAuth')
  })

  it('/api/admin/download-logs has admin gate', async () => {
    const source = await readRoute('admin/download-logs')
    expect(source).toContain('ADMIN_USER_IDS')
    expect(source).toContain('Forbidden')
  })

  it('docker-compose.yml does not contain hardcoded secrets', async () => {
    const compose = await fs.readFile(
      path.join(process.cwd(), 'docker-compose.yml'),
      'utf-8'
    )
    expect(compose).not.toContain('aidrama-studio-default-secret')
    expect(compose).not.toContain('aidrama-studio-docker-task-token')
    expect(compose).not.toContain('aidrama-studio-opensource-fixed-key')
  })

  it('worker startup log contains EvoLinkAI attribution', async () => {
    const workerEntry = await fs.readFile(
      path.join(process.cwd(), 'src/lib/workers/index.ts'),
      'utf-8'
    )
    expect(workerEntry).toContain('EvoLinkAI')
  })

  /**
   * Regression: /api/auth/register used to collapse all failures into a
   * single `ApiError('INVALID_PARAMS')` with no details, so the frontend
   * could not tell "username taken" apart from "missing field". The route
   * must now emit distinct codes and a details envelope keyed by field.
   */
  it('/api/auth/register emits distinct errors per failure class', async () => {
    const source = await readRoute('auth/register')

    // Username-taken is a 409 CONFLICT, not a 400 INVALID_PARAMS.
    expect(source).toContain("'CONFLICT'")
    expect(source).toMatch(/field:\s*['"]name['"]/)
    expect(source).toMatch(/reason:\s*['"]taken['"]/)

    // Password-too-short carries the field + minLength, so the UI can
    // localize "at least N characters" without hardcoding.
    expect(source).toMatch(/reason:\s*['"]tooShort['"]/)
    expect(source).toMatch(/minLength:\s*6/)

    // Missing-field errors are emitted individually, not collapsed.
    expect(source).toMatch(/reason:\s*['"]required['"]/)

    // Historical leftover from the fork origin (project was phone-based
    // before conversion to username auth) must stay gone.
    expect(source).not.toContain('Phone number already exists')
  })
})
