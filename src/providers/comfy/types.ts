/**
 * ComfyUI out-of-process HTTP client types (Wave10 Phase A + H3 wiring).
 * No ComfyUI GPL source — HTTP contract + fixture shapes only.
 */

export const COMFY_DEFAULT_BASE_URL = 'http://127.0.0.1:8188';

/** Allowed submit tiers. H3 = AutoDL remote via SSH tunnel (loopback client). */
export const LOCAL_COMFY_SUBMIT_TIERS = [
  'local.comfy.wan22_5b',
  'local.comfy.ltx',
  'local.comfy.minimax_h3',
] as const;

export type LocalComfySubmitTier = (typeof LOCAL_COMFY_SUBMIT_TIERS)[number];

/** Documented but refused as default / submit on 8GB laptop path. */
export const LOCAL_COMFY_REFUSED_DEFAULT_TIERS = ['local.comfy.wan22_14b'] as const;

export type ComfyFailureCode =
  | 'COMFY_UNAVAILABLE'
  | 'COMFY_TIER_REFUSED'
  | 'COMFY_PROMPT_REJECTED'
  | 'COMFY_JOB_FAILED'
  | 'COMFY_JOB_UNKNOWN'
  | 'COMFY_INVALID_INPUT'
  | 'COMFY_LIVE_DISABLED'
  | 'COMFY_NETWORK_FORBIDDEN'
  | 'COMFY_H3_WEIGHTS_MISSING'
  | 'COMFY_I2V_REF_MISSING'
  | 'COMFY_VIEW_FETCH_FAILED';

export interface ComfyHealth {
  readonly ok: boolean;
  readonly version?: string;
  readonly vramHint?: string;
  /** Phase A probe: when false, ENV cannot smoke live. */
  readonly canSmoke?: boolean;
}

export interface ComfyArtifactRef {
  readonly filename: string;
  readonly subfolder: string;
  readonly type: string;
  /** Repo-relative or absolute path when fixture / local view resolved. */
  readonly localPath?: string;
  readonly contentSha256: string;
}

export interface ComfyJob {
  /** Prompt graph (workflow JSON object). */
  readonly prompt: Record<string, unknown>;
  readonly clientId?: string;
  /** Optional fixture routing hint (success | failed | pending | timeout). */
  readonly fixtureScenario?: 'success' | 'failed' | 'pending' | 'timeout';
}

export type ComfyJobStatus =
  | { readonly status: 'PENDING' }
  | { readonly status: 'SUCCEEDED'; readonly artifacts: readonly ComfyArtifactRef[] }
  | { readonly status: 'FAILED'; readonly error: string; readonly code?: ComfyFailureCode }
  | { readonly status: 'UNKNOWN'; readonly error?: string; readonly code?: ComfyFailureCode };

export interface ComfySubmitResult {
  readonly promptId: string;
}

export interface PollUntilOptions {
  readonly intervalMs?: number;
  readonly timeoutMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
}

/**
 * Port used by generation orchestration — injectable for tests / fixtures.
 */
export interface ComfyRenderPort {
  health(): Promise<ComfyHealth>;
  submit(job: ComfyJob): Promise<ComfySubmitResult>;
  poll(promptId: string): Promise<ComfyJobStatus>;
}

/** Optional extended port for H3 live (pollUntil + view). */
export interface ComfyRenderPortEx extends ComfyRenderPort {
  pollUntil?(promptId: string, options?: PollUntilOptions): Promise<ComfyJobStatus>;
  fetchViewToFile?(
    artifact: Pick<ComfyArtifactRef, 'filename' | 'subfolder' | 'type'>,
    destPath: string,
  ): Promise<{ contentSha256: string; bytes: number }>;
}

export type ComfyResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: ComfyFailureCode; readonly message?: string };

export function isLocalComfyTierPrefix(value: string): boolean {
  return value.startsWith('local.comfy.');
}

export function isLocalComfySubmitTier(value: string): value is LocalComfySubmitTier {
  return (LOCAL_COMFY_SUBMIT_TIERS as readonly string[]).includes(value);
}

export function isRefusedDefaultComfyTier(value: string): boolean {
  return (LOCAL_COMFY_REFUSED_DEFAULT_TIERS as readonly string[]).includes(value);
}

export function isMinimaxH3Tier(value: string): boolean {
  return value === 'local.comfy.minimax_h3';
}
