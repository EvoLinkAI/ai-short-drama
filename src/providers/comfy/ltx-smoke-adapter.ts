/**
 * Optional LTX smoke adapter (Wave10 alt tier for lower VRAM).
 */
import type { ShotSpec } from '@/schemas/shot-spec';
import { loadComfyWorkflow, patchWorkflowInputs } from './workflow-loader';
import type { ComfyJob } from './types';
import { isLocalComfyTierPrefix, isRefusedDefaultComfyTier } from './types';

export const LTX_SMOKE_DEFAULTS = Object.freeze({
  tierId: 'local.comfy.ltx' as const,
  width: 512,
  height: 512,
  frames: 9,
  cpuOffload: true,
});

export interface LtxSmokeBuildInput {
  readonly shotSpec: ShotSpec;
  readonly tierId?: string;
  readonly fixtureScenario?: ComfyJob['fixtureScenario'];
  readonly positivePrompt?: string;
}

export type LtxSmokeBuildResult =
  | { readonly ok: true; readonly job: ComfyJob; readonly tierId: 'local.comfy.ltx' }
  | { readonly ok: false; readonly code: 'COMFY_TIER_REFUSED'; readonly message: string };

export function buildLtxSmokeJob(input: LtxSmokeBuildInput): LtxSmokeBuildResult {
  const tierId = input.tierId ?? LTX_SMOKE_DEFAULTS.tierId;
  if (isRefusedDefaultComfyTier(tierId) || !isLocalComfyTierPrefix(tierId) || tierId !== 'local.comfy.ltx') {
    return {
      ok: false,
      code: 'COMFY_TIER_REFUSED',
      message: `ltx adapter only accepts local.comfy.ltx; got ${tierId}`,
    };
  }

  const promptText =
    input.positivePrompt ??
    `shot=${input.shotSpec.shotKey} | ${input.shotSpec.blocking}`;

  const base = loadComfyWorkflow('ltx_smoke');
  const prompt = patchWorkflowInputs(base, [
    { nodeId: '3', input: 'width', value: LTX_SMOKE_DEFAULTS.width },
    { nodeId: '3', input: 'height', value: LTX_SMOKE_DEFAULTS.height },
    { nodeId: '3', input: 'frames', value: LTX_SMOKE_DEFAULTS.frames },
    { nodeId: '5', input: 'text', value: promptText },
    { nodeId: '6', input: 'cpu_offload', value: LTX_SMOKE_DEFAULTS.cpuOffload },
  ]);

  return {
    ok: true,
    tierId: 'local.comfy.ltx',
    job: {
      prompt,
      clientId: `aidrama-ltx-${input.shotSpec.id}`,
      fixtureScenario: input.fixtureScenario ?? 'success',
    },
  };
}
