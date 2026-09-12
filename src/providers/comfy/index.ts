/**
 * Comfy provider barrel (Wave10 + H3) — HTTP client + adapters only.
 */
export {
  COMFY_DEFAULT_BASE_URL,
  LOCAL_COMFY_REFUSED_DEFAULT_TIERS,
  LOCAL_COMFY_SUBMIT_TIERS,
  isLocalComfySubmitTier,
  isLocalComfyTierPrefix,
  isMinimaxH3Tier,
  isRefusedDefaultComfyTier,
} from './types';
export type {
  ComfyArtifactRef,
  ComfyFailureCode,
  ComfyHealth,
  ComfyJob,
  ComfyJobStatus,
  ComfyRenderPort,
  ComfyRenderPortEx,
  ComfyResult,
  ComfySubmitResult,
  LocalComfySubmitTier,
  PollUntilOptions,
} from './types';

export {
  ComfyHttpClient,
  assertLocalComfyReady,
  createComfyHttpClient,
} from './comfy-http-client';
export type { ComfyHttpClientOptions } from './comfy-http-client';

export {
  loadComfyWorkflow,
  patchWorkflowInputs,
  resolveComfyWorkflowsDir,
} from './workflow-loader';
export type { ComfyWorkflowId } from './workflow-loader';

export {
  WAN22_5B_SMOKE_DEFAULTS,
  assertWan22SubmitTier,
  buildWan22SmokeJob,
} from './wan22-smoke-adapter';
export type { Wan22SmokeBuildInput, Wan22SmokeBuildResult } from './wan22-smoke-adapter';

export { LTX_SMOKE_DEFAULTS, buildLtxSmokeJob } from './ltx-smoke-adapter';
export type { LtxSmokeBuildInput, LtxSmokeBuildResult } from './ltx-smoke-adapter';

export {
  MINIMAX_H3_SMOKE_DEFAULTS,
  assertMinimaxH3SubmitTier,
  buildMinimaxH3SmokeJob,
} from './minimax-h3-smoke-adapter';
export type {
  MinimaxH3SmokeBuildInput,
  MinimaxH3SmokeBuildResult,
} from './minimax-h3-smoke-adapter';
