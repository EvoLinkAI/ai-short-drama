/**
 * ComfyUI HTTP client — process-out API only (Wave10 Phase A).
 * Fixture mode never touches the network.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  isV11ComfyUseFixture,
  isV11LocalComfyRender,
  resolveV11ComfyBaseUrl,
} from '@/core/config/v11-flags';
import type {
  ComfyArtifactRef,
  ComfyHealth,
  ComfyJob,
  ComfyJobStatus,
  ComfyRenderPort,
  ComfyRenderPortEx,
  ComfySubmitResult,
  PollUntilOptions,
} from './types';
import { COMFY_DEFAULT_BASE_URL } from './types';

export interface ComfyHttpClientOptions {
  readonly baseUrl?: string;
  /** Override fixture flag (tests). */
  readonly useFixture?: boolean;
  /** Override live-render flag (tests). */
  readonly localComfyRender?: boolean;
  /** Absolute or cwd-relative fixture directory. */
  readonly fixtureDir?: string;
  readonly fetchImpl?: typeof fetch;
  /** Max poll iterations for helpers (not used by single poll()). */
  readonly maxPollAttempts?: number;
}

const DEFAULT_FIXTURE_DIR = path.join('tests', 'fixtures', 'comfy');

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function resolveFixtureDir(explicit?: string): string {
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.resolve(process.cwd(), explicit);
  }
  return path.resolve(process.cwd(), DEFAULT_FIXTURE_DIR);
}

function sha256File(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

function joinUrl(base: string, route: string): string {
  return `${base.replace(/\/$/, '')}${route.startsWith('/') ? route : `/${route}`}`;
}

type HistoryEntry = {
  outputs?: Record<string, { images?: Array<{ filename: string; subfolder?: string; type?: string }> }>;
  status?: { status_str?: string; completed?: boolean; messages?: unknown[] };
};

/**
 * Live or fixture ComfyRenderPort implementation.
 * Live path requires V11_LOCAL_COMFY_RENDER=true and V11_COMFY_USE_FIXTURE=false.
 */
export class ComfyHttpClient implements ComfyRenderPortEx {
  private readonly baseUrl: string;
  private readonly useFixture: boolean;
  private readonly localComfyRender: boolean;
  private readonly fixtureDir: string;
  private readonly fetchImpl: typeof fetch;
  private lastScenario: ComfyJob['fixtureScenario'] = 'success';

  constructor(options: ComfyHttpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? resolveV11ComfyBaseUrl();
    this.useFixture = options.useFixture ?? isV11ComfyUseFixture();
    this.localComfyRender = options.localComfyRender ?? isV11LocalComfyRender();
    this.fixtureDir = resolveFixtureDir(options.fixtureDir);
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  /** True when this client will not open sockets. */
  isFixtureMode(): boolean {
    return this.useFixture;
  }

  getBaseUrl(): string {
    return this.baseUrl || COMFY_DEFAULT_BASE_URL;
  }

  private assertLiveAllowed(): void {
    if (this.useFixture) return;
    if (!this.localComfyRender) {
      throw new Error('COMFY_LIVE_DISABLED:V11_LOCAL_COMFY_RENDER is false');
    }
    this.assertLoopbackBaseUrl();
  }

  /** Live Comfy must stay on loopback (SSH tunnel). Reject public hosts. */
  private assertLoopbackBaseUrl(): void {
    let host: string;
    try {
      host = new URL(this.baseUrl).hostname;
    } catch {
      throw new Error(`COMFY_NETWORK_FORBIDDEN:invalid baseUrl ${this.baseUrl}`);
    }
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
      throw new Error(
        `COMFY_NETWORK_FORBIDDEN:baseUrl host must be loopback (got ${host}); use SSH -L tunnel`,
      );
    }
  }

  async health(): Promise<ComfyHealth> {
    if (this.useFixture) {
      const health = readJsonFile<{
        ok: boolean;
        version?: string;
        vramHint?: string;
      }>(path.join(this.fixtureDir, 'health_ok.json'));
      return {
        ok: health.ok === true,
        version: health.version,
        vramHint: health.vramHint,
        canSmoke: false, // ENV_PROBE: fixtures ≠ live smoke
      };
    }

    this.assertLiveAllowed();
    try {
      const res = await this.fetchImpl(joinUrl(this.baseUrl, '/system_stats'), {
        method: 'GET',
      });
      if (!res.ok) {
        return { ok: false, canSmoke: false };
      }
      const body = (await res.json()) as { system?: { comfyui_version?: string } };
      return {
        ok: true,
        version: body.system?.comfyui_version,
        canSmoke: true,
      };
    } catch {
      return { ok: false, canSmoke: false };
    }
  }

  async submit(job: ComfyJob): Promise<ComfySubmitResult> {
    if (!job || typeof job !== 'object' || !job.prompt || typeof job.prompt !== 'object') {
      throw new Error('COMFY_INVALID_INPUT:prompt required');
    }

    if (this.useFixture) {
      this.lastScenario = job.fixtureScenario ?? 'success';
      if (this.lastScenario === 'failed') {
        return { promptId: 'fixture-prompt-failed-001' };
      }
      if (this.lastScenario === 'pending') {
        return { promptId: 'fixture-prompt-pending-001' };
      }
      if (this.lastScenario === 'timeout') {
        return { promptId: 'fixture-prompt-timeout-001' };
      }
      const accepted = readJsonFile<{ prompt_id: string }>(
        path.join(this.fixtureDir, 'prompt_accepted.json'),
      );
      return { promptId: accepted.prompt_id };
    }

    this.assertLiveAllowed();
    const res = await this.fetchImpl(joinUrl(this.baseUrl, '/prompt'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: job.prompt,
        client_id: job.clientId ?? 'aidrama-v11',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`COMFY_PROMPT_REJECTED:HTTP ${res.status} ${text}`);
    }
    const body = (await res.json()) as { prompt_id?: string };
    if (!body.prompt_id) {
      throw new Error('COMFY_PROMPT_REJECTED:missing prompt_id');
    }
    return { promptId: body.prompt_id };
  }

  async poll(promptId: string): Promise<ComfyJobStatus> {
    if (this.useFixture) {
      return this.pollFixture(promptId);
    }

    this.assertLiveAllowed();
    try {
      const res = await this.fetchImpl(joinUrl(this.baseUrl, `/history/${encodeURIComponent(promptId)}`), {
        method: 'GET',
      });
      if (!res.ok) {
        return { status: 'UNKNOWN', error: `history HTTP ${res.status}`, code: 'COMFY_JOB_UNKNOWN' };
      }
      const body = (await res.json()) as Record<string, HistoryEntry>;
      const entry = body[promptId];
      if (!entry) {
        return { status: 'PENDING' };
      }
      return this.mapHistoryEntry(entry);
    } catch (err) {
      return {
        status: 'UNKNOWN',
        error: err instanceof Error ? err.message : 'poll failed',
        code: 'COMFY_JOB_UNKNOWN',
      };
    }
  }

  private pollFixture(promptId: string): ComfyJobStatus {
    if (promptId.includes('timeout')) {
      return {
        status: 'UNKNOWN',
        error: 'fixture timeout / process disappeared',
        code: 'COMFY_JOB_UNKNOWN',
      };
    }
    if (promptId.includes('pending')) {
      const pending = readJsonFile<Record<string, HistoryEntry>>(
        path.join(this.fixtureDir, 'history_pending.json'),
      );
      const entry = pending[promptId] ?? Object.values(pending)[0];
      if (!entry) return { status: 'PENDING' };
      return this.mapHistoryEntry(entry, /*fixture*/ true);
    }
    if (promptId.includes('failed')) {
      const failed = readJsonFile<Record<string, HistoryEntry>>(
        path.join(this.fixtureDir, 'history_failed.json'),
      );
      const entry = failed[promptId] ?? Object.values(failed)[0];
      if (!entry) {
        return { status: 'FAILED', error: 'fixture failed', code: 'COMFY_JOB_FAILED' };
      }
      return this.mapHistoryEntry(entry, true);
    }

    const success = readJsonFile<Record<string, HistoryEntry>>(
      path.join(this.fixtureDir, 'history_success.json'),
    );
    const entry = success[promptId] ?? Object.values(success)[0];
    if (!entry) {
      return { status: 'UNKNOWN', error: 'missing success fixture', code: 'COMFY_JOB_UNKNOWN' };
    }
    return this.mapHistoryEntry(entry, true);
  }

  private mapHistoryEntry(entry: HistoryEntry, fixture = false): ComfyJobStatus {
    const statusStr = entry.status?.status_str?.toLowerCase() ?? '';
    const completed = entry.status?.completed === true;

    if (!completed && (statusStr === 'pending' || statusStr === '' || !statusStr)) {
      return { status: 'PENDING' };
    }

    if (statusStr === 'error' || statusStr === 'failed') {
      const msg = extractErrorMessage(entry.status?.messages) ?? 'comfy job failed';
      return { status: 'FAILED', error: msg, code: 'COMFY_JOB_FAILED' };
    }

    if (statusStr === 'success' || completed) {
      const artifacts = this.collectArtifacts(entry, fixture);
      if (artifacts.length === 0) {
        return {
          status: 'UNKNOWN',
          error: 'completed without images',
          code: 'COMFY_JOB_UNKNOWN',
        };
      }
      return { status: 'SUCCEEDED', artifacts };
    }

    return {
      status: 'UNKNOWN',
      error: `unrecognized status_str=${statusStr}`,
      code: 'COMFY_JOB_UNKNOWN',
    };
  }

  private collectArtifacts(entry: HistoryEntry, fixture: boolean): ComfyArtifactRef[] {
    const out: ComfyArtifactRef[] = [];
    const outputs = entry.outputs ?? {};
    for (const node of Object.values(outputs)) {
      for (const img of node.images ?? []) {
        const filename = img.filename;
        const subfolder = img.subfolder ?? '';
        const type = img.type ?? 'output';
        if (fixture) {
          const localPath = path.join(this.fixtureDir, filename);
          const metaPath = path.join(this.fixtureDir, 'artifact_meta.json');
          let contentSha256: string;
          let resolvedPath = localPath;
          if (fs.existsSync(metaPath)) {
            const meta = readJsonFile<{
              contentSha256: string;
              localPath?: string;
            }>(metaPath);
            contentSha256 = meta.contentSha256;
            if (meta.localPath) {
              resolvedPath = path.isAbsolute(meta.localPath)
                ? meta.localPath
                : path.resolve(process.cwd(), meta.localPath);
            }
          } else if (fs.existsSync(localPath)) {
            contentSha256 = sha256File(localPath);
          } else {
            contentSha256 = createHash('sha256').update(`fixture:${filename}`).digest('hex');
          }
          out.push({
            filename,
            subfolder,
            type,
            localPath: resolvedPath,
            contentSha256,
          });
        } else {
          // Live: sha filled later when /view is fetched; placeholder digest of identity.
          const contentSha256 = createHash('sha256')
            .update(['view', filename, subfolder, type].join('|'))
            .digest('hex');
          out.push({ filename, subfolder, type, contentSha256 });
        }
      }
    }
    return out;
  }

  /**
   * Multi-poll until SUCCEEDED / FAILED / UNKNOWN or timeout → UNKNOWN.
   * Phase A single poll remains available via poll().
   */
  async pollUntil(promptId: string, options: PollUntilOptions = {}): Promise<ComfyJobStatus> {
    const intervalMs = options.intervalMs ?? 2000;
    const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
    const sleep =
      options.sleep ??
      ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    const started = Date.now();
    let last: ComfyJobStatus = { status: 'PENDING' };
    while (Date.now() - started <= timeoutMs) {
      last = await this.poll(promptId);
      if (last.status === 'SUCCEEDED' || last.status === 'FAILED' || last.status === 'UNKNOWN') {
        return last;
      }
      await sleep(intervalMs);
    }
    return {
      status: 'UNKNOWN',
      error: `pollUntil timeout after ${timeoutMs}ms (last=PENDING)`,
      code: 'COMFY_JOB_UNKNOWN',
    };
  }

  /**
   * Download Comfy /view output to destPath and return content sha256.
   * Fixture mode copies localPath / smoke.png when present.
   */
  async fetchViewToFile(
    artifact: Pick<ComfyArtifactRef, 'filename' | 'subfolder' | 'type'>,
    destPath: string,
  ): Promise<{ contentSha256: string; bytes: number }> {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    if (this.useFixture) {
      const src =
        artifact.filename && fs.existsSync(path.join(this.fixtureDir, artifact.filename))
          ? path.join(this.fixtureDir, artifact.filename)
          : path.join(this.fixtureDir, 'smoke.png');
      if (!fs.existsSync(src)) {
        throw new Error('COMFY_VIEW_FETCH_FAILED:fixture image missing');
      }
      fs.copyFileSync(src, destPath);
      const contentSha256 = sha256File(destPath);
      return { contentSha256, bytes: fs.statSync(destPath).size };
    }

    this.assertLiveAllowed();
    const qs = new URLSearchParams({
      filename: artifact.filename,
      subfolder: artifact.subfolder ?? '',
      type: artifact.type ?? 'output',
    });
    const res = await this.fetchImpl(joinUrl(this.baseUrl, `/view?${qs.toString()}`), {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error(`COMFY_VIEW_FETCH_FAILED:HTTP ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    fs.writeFileSync(destPath, buf);
    const contentSha256 = createHash('sha256').update(buf).digest('hex');
    return { contentSha256, bytes: buf.length };
  }
}

function extractErrorMessage(messages: unknown[] | undefined): string | undefined {
  if (!Array.isArray(messages) || messages.length === 0) return undefined;
  for (const m of messages) {
    if (Array.isArray(m) && m.length >= 2) {
      const payload = m[1] as { exception_message?: string };
      if (payload?.exception_message) return String(payload.exception_message);
    }
  }
  return JSON.stringify(messages[0]);
}

export function createComfyHttpClient(options?: ComfyHttpClientOptions): ComfyHttpClient {
  return new ComfyHttpClient(options);
}

/**
 * Phase A / Phase B gate helper.
 * Fixture mode ⇒ canSmoke false (ENV still needs real Comfy).
 * Live ⇒ health.ok maps to canSmoke.
 */
export async function assertLocalComfyReady(
  client: ComfyRenderPort = createComfyHttpClient(),
): Promise<{ ok: boolean; canSmoke: boolean; health: ComfyHealth; code?: string }> {
  const health = await client.health();
  const canSmoke = health.canSmoke === true && health.ok === true;
  if (!health.ok) {
    return { ok: false, canSmoke: false, health, code: 'COMFY_UNAVAILABLE' };
  }
  return { ok: true, canSmoke, health };
}
