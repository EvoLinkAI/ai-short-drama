/**
 * ShotSpec → MiniMax-H3 I2V workflow (AutoDL remote via tunnel).
 * Official API Format contract (Comfy-Org video_minimax_h3_i2v subgraph IDs).
 * Stub minimax_h3_i2v_smoke is DEPRECATED — not the production path.
 * Adapter-only knobs — not stored on ShotSpec.
 */
import type { ShotSpec } from '@/schemas/shot-spec';
import { loadComfyWorkflow, patchWorkflowInputs } from './workflow-loader';
import type { ComfyJob } from './types';
import {
  isLocalComfySubmitTier,
  isLocalComfyTierPrefix,
  isMinimaxH3Tier,
  isRefusedDefaultComfyTier,
} from './types';

/** AutoDL H3 smoke defaults (NOT for 8GB laptop). */
export const MINIMAX_H3_SMOKE_DEFAULTS = Object.freeze({
  tierId: 'local.comfy.minimax_h3' as const,
  width: 768,
  height: 1280,
  frames: 124,
  /** Align OSS Scout recommended FL2VA pruned INT8. */
  diffusionName: 'minimax_h3_fl2va_pruned_int8_convrot.safetensors',
  textEncoderName: 'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors',
  videoVaeName: 'minimax_h3_video_vae_fp16.safetensors',
  audioVaeName: 'minimax_h3_audio_vae_fp32.safetensors',
});

export interface MinimaxH3SmokeBuildInput {
  readonly shotSpec: ShotSpec;
  readonly tierId?: string;
  readonly fixtureScenario?: ComfyJob['fixtureScenario'];
  readonly positivePrompt?: string;
  /**
   * I2V reference image path already present on Comfy input filesystem,
   * or filename Comfy LoadImage can see. Fail-closed if missing for live.
   */
  readonly referenceImageName?: string;
  /** When true (fixture), allow missing referenceImageName. */
  readonly allowMissingRefForFixture?: boolean;
}

export type MinimaxH3SmokeBuildResult =
  | { readonly ok: true; readonly job: ComfyJob; readonly tierId: 'local.comfy.minimax_h3' }
  | {
      readonly ok: false;
      readonly code: 'COMFY_TIER_REFUSED' | 'COMFY_I2V_REF_MISSING';
      readonly message: string;
    };

export function assertMinimaxH3SubmitTier(tierId: string): MinimaxH3SmokeBuildResult | null {
  if (isRefusedDefaultComfyTier(tierId)) {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `refused default 14B: ${tierId}`,
    };
  }
  if (!isLocalComfyTierPrefix(tierId)) {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `expected local.comfy.*; got ${tierId}`,
    };
  }
  if (!isMinimaxH3Tier(tierId)) {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `h3 adapter only accepts local.comfy.minimax_h3; got ${tierId}`,
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
 * Build ComfyJob for local.comfy.minimax_h3 I2V (official API graph).
 * Patches: 104.prompt/width/height/length, 6.unet_name, 13.clip_name,
 * 11.vae_name (video), 24.vae_name (audio), 114.image when ref present.
 */
export function buildMinimaxH3SmokeJob(input: MinimaxH3SmokeBuildInput): MinimaxH3SmokeBuildResult {
  const tierId = input.tierId ?? MINIMAX_H3_SMOKE_DEFAULTS.tierId;
  const refused = assertMinimaxH3SubmitTier(tierId);
  if (refused) return refused;

  const allowMissing = input.allowMissingRefForFixture === true || input.fixtureScenario !== undefined;
  const refName = input.referenceImageName?.trim();
  if (!refName && !allowMissing) {
    return {
      ok: false,
      code: 'COMFY_I2V_REF_MISSING',
      message: 'H3 I2V requires referenceImageName (LoadImage on Comfy side)',
    };
  }

  const promptText =
    input.positivePrompt ??
    [
      `shot=${input.shotSpec.shotKey}`,
      `blocking=${input.shotSpec.blocking}`,
      `framing=${input.shotSpec.camera.framing ?? 'MCU'}`,
      `durationSec=${input.shotSpec.durationSec}`,
    ].join(' | ');

  const base = loadComfyWorkflow('minimax_h3_i2v');
  const patches: Array<{ nodeId: string; input: string; value: unknown }> = [
    { nodeId: '104', input: 'prompt', value: promptText },
    { nodeId: '104', input: 'width', value: MINIMAX_H3_SMOKE_DEFAULTS.width },
    { nodeId: '104', input: 'height', value: MINIMAX_H3_SMOKE_DEFAULTS.height },
    { nodeId: '104', input: 'length', value: MINIMAX_H3_SMOKE_DEFAULTS.frames },
    { nodeId: '6', input: 'unet_name', value: MINIMAX_H3_SMOKE_DEFAULTS.diffusionName },
    { nodeId: '13', input: 'clip_name', value: MINIMAX_H3_SMOKE_DEFAULTS.textEncoderName },
    { nodeId: '11', input: 'vae_name', value: MINIMAX_H3_SMOKE_DEFAULTS.videoVaeName },
    { nodeId: '24', input: 'vae_name', value: MINIMAX_H3_SMOKE_DEFAULTS.audioVaeName },
  ];
  if (refName) {
    patches.push({ nodeId: '114', input: 'image', value: refName });
  }

  const prompt = patchWorkflowInputs(base, patches);

  return {
    ok: true,
    tierId: 'local.comfy.minimax_h3',
    job: {
      prompt,
      clientId: `aidrama-h3-${input.shotSpec.id}`,
      fixtureScenario: input.fixtureScenario ?? 'success',
    },
  };
}
