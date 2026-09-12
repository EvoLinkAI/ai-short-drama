/**
 * Wave11-A · thin H3 enqueue orchestrator.
 * ShotSpec + Continuity preflight → startLocalComfyTakes / runComfyFixtureTakes.
 * On preflight failure: return failed result; never call Comfy submit/port.
 *
 * KEEP: does not modify run-local-comfy-takes.ts / comfy HTTP.
 */
import {
  assertGenerateAllowed,
  type GeneratePreflightDeps,
  type GeneratePreflightInput,
  type GeneratePreflightResult,
} from '@/agents/continuity';
import type { ShotContinuityLock } from '@/schemas/shot-continuity-lock';
import type { ComfyRenderPort, ComfyRenderPortEx } from '@/providers/comfy';
import type { TakeStore } from './take-store';
import type { GenerationResult, TakeAttemptRecord } from './types';
import {
  runComfyFixtureTakes,
  startLocalComfyTakes,
  type RunLocalComfyTakesDeps,
  type RunLocalComfyTakesResult,
  type StartLocalComfyTakesInput,
} from './run-local-comfy-takes';

/** Factory default for H3 I2V (W11A-08). */
export const H3_GENERATOR_KEY = 'local.comfy.minimax_h3' as const;

export interface EnqueueH3TakeInput {
  readonly shotSpec: StartLocalComfyTakesInput['shotSpec'];
  readonly takeManifestId: string;
  /** Continuity / HumanLock preflight (Wave3 assertGenerateAllowed). */
  readonly preflight: GeneratePreflightInput;
  /** H3 I2V: LoadImage filename visible to Comfy (live fail-closed if missing). */
  readonly referenceImageName?: string;
  readonly seed?: string;
  readonly createdAt?: string;
  readonly positivePrompt?: string;
  readonly fixtureScenario?: StartLocalComfyTakesInput['fixtureScenario'];
  readonly usePollUntil?: boolean;
  readonly pollIntervalMs?: number;
  readonly pollTimeoutMs?: number;
  readonly artifactOutDir?: string;
  /**
   * When true (default for unit/CTR), use runComfyFixtureTakes (no live HTTP).
   * Live path: set false and inject comfy / env flags after tunnel is open.
   */
  readonly useFixture?: boolean;
  /**
   * Override generatorKey — must be local.comfy.minimax_h3 or refuse (W11A-08).
   * Default: H3_GENERATOR_KEY.
   */
  readonly generatorKey?: string;
}

export interface EnqueueH3TakeDeps {
  readonly store: TakeStore;
  readonly humanLockService: GeneratePreflightDeps['humanLockService'];
  readonly comfy?: ComfyRenderPort | ComfyRenderPortEx;
  readonly now?: () => string;
  readonly skipLiveReadyAssert?: boolean;
  /** Injectable for tests (default: continuity assertGenerateAllowed). */
  readonly assertGenerateAllowedFn?: (
    input: GeneratePreflightInput,
    deps: GeneratePreflightDeps,
  ) => Promise<GeneratePreflightResult>;
  /** Injectable runners — default production imports (spy in tests). */
  readonly startLocalComfyTakesFn?: typeof startLocalComfyTakes;
  readonly runComfyFixtureTakesFn?: typeof runComfyFixtureTakes;
}

export type EnqueueH3TakeValue = RunLocalComfyTakesResult & {
  readonly continuityLock: ShotContinuityLock;
};

export type EnqueueH3TakeResult = GenerationResult<EnqueueH3TakeValue>;

function refuseNonH3(generatorKey: string): GenerationResult<never> | null {
  if (generatorKey !== H3_GENERATOR_KEY) {
    if (
      generatorKey.startsWith('cn.ark.') ||
      generatorKey.startsWith('cn.kling.') ||
      generatorKey.startsWith('global.')
    ) {
      return {
        ok: false,
        code: 'PAID_TIER_REFUSED',
        message: `enqueueH3Take refuses paid/cloud tier: ${generatorKey}`,
      };
    }
    return {
      ok: false,
      code: 'UNKNOWN_GENERATOR',
      message: `enqueueH3Take requires ${H3_GENERATOR_KEY}; got ${generatorKey}`,
    };
  }
  return null;
}

/**
 * Assemble Continuity preflight + H3 params, then enqueue local Comfy take.
 * Preflight red → failed result; Comfy Port is never touched.
 */
export async function enqueueH3Take(
  input: EnqueueH3TakeInput,
  deps: EnqueueH3TakeDeps,
  priorAttempts: readonly TakeAttemptRecord[] = [],
): Promise<EnqueueH3TakeResult> {
  const generatorKey = input.generatorKey ?? H3_GENERATOR_KEY;
  const tierRefuse = refuseNonH3(generatorKey);
  if (tierRefuse) return tierRefuse;

  const assertFn = deps.assertGenerateAllowedFn ?? assertGenerateAllowed;
  const preflightResult = await assertFn(input.preflight, {
    humanLockService: deps.humanLockService,
  });

  if (!preflightResult.ok) {
    // W11A-01: fail closed — zero Comfy submit / Port calls
    return {
      ok: false,
      code: 'PREFLIGHT_REQUIRED',
      message: `GENERATE_PREFLIGHT_REJECTED:${preflightResult.code}`,
    };
  }

  const comfyInput: StartLocalComfyTakesInput = {
    shotSpec: input.shotSpec,
    takeManifestId: input.takeManifestId,
    generatorKey,
    preflightOk: true,
    seed: input.seed,
    createdAt: input.createdAt,
    positivePrompt: input.positivePrompt,
    referenceImageName: input.referenceImageName,
    fixtureScenario: input.fixtureScenario,
    usePollUntil: input.usePollUntil,
    pollIntervalMs: input.pollIntervalMs,
    pollTimeoutMs: input.pollTimeoutMs,
    artifactOutDir: input.artifactOutDir,
  };

  const runDeps: RunLocalComfyTakesDeps = {
    store: deps.store,
    comfy: deps.comfy,
    now: deps.now,
    skipLiveReadyAssert: deps.skipLiveReadyAssert,
  };

  const useFixture = input.useFixture !== false && !deps.comfy;
  const startFn = deps.startLocalComfyTakesFn ?? startLocalComfyTakes;
  const fixtureFn = deps.runComfyFixtureTakesFn ?? runComfyFixtureTakes;

  const runResult = useFixture
    ? await fixtureFn(comfyInput, { store: deps.store, now: deps.now }, priorAttempts)
    : await startFn(comfyInput, runDeps, priorAttempts);

  if (!runResult.ok) return runResult;

  return {
    ok: true,
    value: {
      ...runResult.value,
      continuityLock: preflightResult.continuityLock,
    },
  };
}

/**
 * Convenience: always fixture runner (unit/CTR, no network).
 * Still runs Continuity preflight first — never skips the gate.
 */
export async function enqueueH3TakeFixture(
  input: Omit<EnqueueH3TakeInput, 'useFixture'>,
  deps: EnqueueH3TakeDeps,
  priorAttempts: readonly TakeAttemptRecord[] = [],
): Promise<EnqueueH3TakeResult> {
  return enqueueH3Take({ ...input, useFixture: true }, deps, priorAttempts);
}
