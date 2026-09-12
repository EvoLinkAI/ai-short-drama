/**
 * ShotSpec → Wan2.2-5B smoke workflow params (8GB offload defaults).
 * Adapter-only knobs — not stored on ShotSpec.
 */
import type { ShotSpec } from '@/schemas/shot-spec';
import { loadComfyWorkflow, patchWorkflowInputs } from './workflow-loader';
import type { ComfyJob } from './types';
import { isLocalComfySubmitTier, isRefusedDefaultComfyTier, isLocalComfyTierPrefix } from './types';

/** 8GB-safe smoke defaults (Phase A fixture / Phase B runbook). */
export const WAN22_5B_SMOKE_DEFAULTS = Object.freeze({
  tierId: 'local.comfy.wan22_5b' as const,
  width: 480,
  height: 480,
  frames: 17,
  cpuOffload: true,
  modelName: 'wan2.2_t2v_5B_fixture.safetensors',
});

export interface Wan22SmokeBuildInput {
  readonly shotSpec: ShotSpec;
  readonly tierId?: string;
  readonly fixtureScenario?: ComfyJob['fixtureScenario'];
  readonly positivePrompt?: string;
}

export type Wan22SmokeBuildResult =
  | { readonly ok: true; readonly job: ComfyJob; readonly tierId: 'local.comfy.wan22_5b' }
  | { readonly ok: false; readonly code: 'COMFY_TIER_REFUSED'; readonly message: string };

export function assertWan22SubmitTier(tierId: string): Wan22SmokeBuildResult | null {
  if (isRefusedDefaultComfyTier(tierId)) {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `refused default 14B on 8GB: ${tierId}`,
    };
  }
  if (!isLocalComfyTierPrefix(tierId)) {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `expected local.comfy.*; got ${tierId}`,
    };
  }
  if (tierId !== 'local.comfy.wan22_5b') {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `wan22 adapter only accepts local.comfy.wan22_5b; got ${tierId}`,
    };
  }
  if (!isLocalComfySubmitTier(tierId)) {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `tier not submit-allowed: ${tierId}`,
    };
  }
  return null;
}

/**
 * Build a ComfyJob for local.comfy.wan22_5b smoke (offload + low res).
 */
export function buildWan22SmokeJob(input: Wan22SmokeBuildInput): Wan22SmokeBuildResult {
  const tierId = input.tierId ?? WAN22_5B_SMOKE_DEFAULTS.tierId;
  const refused = assertWan22SubmitTier(tierId);
  if (refused) return refused;

  const promptText =
    input.positivePrompt ??
    [
      `shot=${input.shotSpec.shotKey}`,
      `blocking=${input.shotSpec.blocking}`,
      `framing=${input.shotSpec.camera.framing ?? 'MCU'}`,
    ].join(' | ');

  const base = loadComfyWorkflow('wan22_t2v_smoke');
  const prompt = patchWorkflowInputs(base, [
    { nodeId: '3', input: 'width', value: WAN22_5B_SMOKE_DEFAULTS.width },
    { nodeId: '3', input: 'height', value: WAN22_5B_SMOKE_DEFAULTS.height },
    { nodeId: '3', input: 'length', value: WAN22_5B_SMOKE_DEFAULTS.frames },
    { nodeId: '5', input: 'text', value: promptText },
    { nodeId: '6', input: 'cpu_offload', value: WAN22_5B_SMOKE_DEFAULTS.cpuOffload },
    { nodeId: '6', input: 'ckpt_name', value: WAN22_5B_SMOKE_DEFAULTS.modelName },
  ]);

  return {
    ok: true,
    tierId: 'local.comfy.wan22_5b',
    job: {
      prompt,
      clientId: `aidrama-${input.shotSpec.id}`,
      fixtureScenario: input.fixtureScenario ?? 'success',
    },
  };
}
