/**
 * Wave10 local Comfy takes: domain preflight → ComfyRenderPort → Take / Attempt.
 * Phase A: fixture client (no network). Phase B / H3: live when flags + assert-ready.
 * H3: pollUntil + /view 回流 → artifacts/comfy-h3-smoke/
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertLocalComfyReady,
  buildLtxSmokeJob,
  buildMinimaxH3SmokeJob,
  buildWan22SmokeJob,
  createComfyHttpClient,
  isLocalComfyTierPrefix,
  isMinimaxH3Tier,
  isRefusedDefaultComfyTier,
  type ComfyHttpClient,
  type ComfyRenderPort,
  type ComfyRenderPortEx,
} from '@/providers/comfy';
import {
  isV11ComfyUseFixture,
  isV11LocalComfyRender,
} from '@/core/config/v11-flags';
import { ShotSpecSchema, type ShotSpec } from '@/schemas/shot-spec';
import { TakeSchema, type Take } from '@/schemas/take-manifest';
import {
  canDispatchProviderRequestKey,
  createTakeAttempt,
  reduceTakeAttempt,
} from './attempt-service';
import type { TakeStore } from './take-store';
import type {
  GenerationResult,
  TakeAttemptEvent,
  TakeAttemptRecord,
} from './types';

const PAID_PREFIXES = ['cn.ark.', 'cn.kling.', 'global.'] as const;

export interface StartLocalComfyTakesInput {
  readonly shotSpec: ShotSpec | unknown;
  readonly takeManifestId: string;
  readonly generatorKey: string;
  /**
   * Fail-closed: continuity / previs preflight must already have passed.
   */
  readonly preflightOk: boolean;
  readonly seed?: string;
  readonly createdAt?: string;
  readonly fixtureScenario?: 'success' | 'failed' | 'pending' | 'timeout';
  readonly positivePrompt?: string;
  /** H3 I2V: LoadImage filename visible to Comfy. */
  readonly referenceImageName?: string;
  /** Use multi-poll (default true for H3 live; false keeps Phase A single poll). */
  readonly usePollUntil?: boolean;
  readonly pollIntervalMs?: number;
  readonly pollTimeoutMs?: number;
  /** Directory for /view 回流 (default artifacts/comfy-h3-smoke/<shotKey>). */
  readonly artifactOutDir?: string;
}

export interface RunLocalComfyTakesDeps {
  readonly store: TakeStore;
  readonly comfy?: ComfyRenderPort | ComfyRenderPortEx;
  readonly now?: () => string;
  /** When true, skip live assertLocalComfyReady (fixtures). Default: detect fixture client. */
  readonly skipLiveReadyAssert?: boolean;
}

export interface RunLocalComfyTakesResult {
  readonly events: readonly TakeAttemptEvent[];
  readonly attempts: readonly TakeAttemptRecord[];
  readonly artifacts: readonly {
    readonly localPath?: string;
    readonly contentSha256: string;
    readonly filename: string;
  }[];
}

function defaultNow(): string {
  return new Date().toISOString();
}

function isPaidTierId(value: string): boolean {
  return PAID_PREFIXES.some((p) => value.startsWith(p));
}

function providerRequestKey(
  manifestId: string,
  generatorKey: string,
  seed: string,
  scenario: string,
): string {
  const digest = createHash('sha256')
    .update([manifestId, generatorKey, seed, scenario, 'comfy'].join('|'), 'utf8')
    .digest('hex')
    .slice(0, 20);
  return `prk-${digest}`;
}

function deterministicId(prefix: string, parts: readonly string[]): string {
  const digest = createHash('sha256').update(parts.join('|'), 'utf8').digest('hex').slice(0, 16);
  return `${prefix}-${digest}`;
}

function refuseTier(generatorKey: string): GenerationResult<never> | null {
  if (isPaidTierId(generatorKey)) {
    return { ok: false, code: 'PAID_TIER_REFUSED', message: `refused paid tier: ${generatorKey}` };
  }
  if (!isLocalComfyTierPrefix(generatorKey)) {
    return {
      ok: false,
      code: 'UNKNOWN_GENERATOR',
      message: `expected local.comfy.*; got ${generatorKey}`,
    };
  }
  if (isRefusedDefaultComfyTier(generatorKey)) {
    return {
      ok: false,
      code: 'UNKNOWN_GENERATOR',
      message: `refused 14B default submit on 8GB: ${generatorKey}`,
    };
  }
  if (
    generatorKey !== 'local.comfy.wan22_5b' &&
    generatorKey !== 'local.comfy.ltx' &&
    generatorKey !== 'local.comfy.minimax_h3'
  ) {
    return {
      ok: false,
      code: 'UNKNOWN_GENERATOR',
      message: `unsupported local.comfy tier: ${generatorKey}`,
    };
  }
  return null;
}

/**
 * Run one Comfy fixture/live job and append a single Take on SUCCESS.
 * FAILED → Attempt FAILED; UNKNOWN → Attempt UNKNOWN (no auto-retry same PRK).
 */
export async function startLocalComfyTakes(
  input: StartLocalComfyTakesInput,
  deps: RunLocalComfyTakesDeps,
  priorAttempts: readonly TakeAttemptRecord[] = [],
): Promise<GenerationResult<RunLocalComfyTakesResult>> {
  if (input.preflightOk !== true) {
    return { ok: false, code: 'PREFLIGHT_REQUIRED', message: 'preflightOk must be true' };
  }

  const tierRefuse = refuseTier(input.generatorKey);
  if (tierRefuse) return tierRefuse;

  const parsed = ShotSpecSchema.safeParse(input.shotSpec);
  if (!parsed.success) {
    return { ok: false, code: 'INVALID_SHOT_SPEC', message: parsed.error.message };
  }
  const shotSpec = parsed.data;

  const manifest = await deps.store.getManifest(input.takeManifestId);
  if (!manifest) {
    return { ok: false, code: 'MANIFEST_NOT_FOUND' };
  }

  const wantLive = isV11LocalComfyRender() && !isV11ComfyUseFixture();
  const comfy: ComfyRenderPort | ComfyRenderPortEx =
    deps.comfy ??
    createComfyHttpClient({
      useFixture: !wantLive,
      localComfyRender: wantLive,
    });
  const isFixtureClient =
    typeof (comfy as ComfyHttpClient).isFixtureMode === 'function'
      ? (comfy as ComfyHttpClient).isFixtureMode()
      : !wantLive;
  const skipReady = deps.skipLiveReadyAssert ?? isFixtureClient;
  if (!skipReady) {
    const ready = await assertLocalComfyReady(comfy);
    if (!ready.ok) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        message: `COMFY_UNAVAILABLE:can_smoke=${ready.canSmoke}`,
      };
    }
  }

  const scenario = input.fixtureScenario ?? 'success';
  let built:
    | { ok: true; job: import('@/providers/comfy').ComfyJob; tierId: string }
    | { ok: false; code: string; message: string };

  if (input.generatorKey === 'local.comfy.ltx') {
    built = buildLtxSmokeJob({
      shotSpec,
      tierId: input.generatorKey,
      fixtureScenario: scenario,
      positivePrompt: input.positivePrompt,
    });
  } else if (isMinimaxH3Tier(input.generatorKey)) {
    built = buildMinimaxH3SmokeJob({
      shotSpec,
      tierId: input.generatorKey,
      fixtureScenario: isFixtureClient ? scenario : undefined,
      positivePrompt: input.positivePrompt,
      referenceImageName: input.referenceImageName,
      allowMissingRefForFixture: isFixtureClient,
    });
  } else {
    built = buildWan22SmokeJob({
      shotSpec,
      tierId: input.generatorKey,
      fixtureScenario: scenario,
      positivePrompt: input.positivePrompt,
    });
  }

  if (!built.ok) {
    const code =
      built.code === 'COMFY_I2V_REF_MISSING' ? 'INVALID_INPUT' : 'UNKNOWN_GENERATOR';
    return { ok: false, code, message: built.message };
  }

  const seed = input.seed ?? 'comfy-seed-0';
  const createdAt = input.createdAt ?? (deps.now ?? defaultNow)();
  const existing = await deps.store.listTakes(input.takeManifestId);
  const ordinal = existing.length;
  const prk = providerRequestKey(input.takeManifestId, input.generatorKey, seed, scenario);

  const knownAttempts: TakeAttemptRecord[] = [...priorAttempts];
  if (!canDispatchProviderRequestKey(prk, knownAttempts)) {
    return {
      ok: false,
      code: 'UNKNOWN_NO_AUTO_RETRY',
      message: `cannot dispatch providerRequestKey=${prk}`,
    };
  }

  const attemptId = deterministicId('atm', [prk, 'attempt']);
  const created = createTakeAttempt({
    attemptId,
    takeManifestId: input.takeManifestId,
    providerRequestKey: prk,
    generatorKey: input.generatorKey,
    outputSlot: ordinal,
    createdAt,
  });
  if (!created.ok) return created;

  const events: TakeAttemptEvent[] = [
    {
      attemptId,
      providerRequestKey: prk,
      status: 'PENDING',
      outputSlot: ordinal,
    },
  ];

  let submitResult: { promptId: string };
  try {
    submitResult = await comfy.submit(built.job);
  } catch (err) {
    const failed = reduceTakeAttempt(created.value, {
      type: 'MARK_FAILED',
      at: createdAt,
      error: err instanceof Error ? err.message : 'submit failed',
    });
    if (!failed.ok) return failed;
    events.push({
      attemptId,
      providerRequestKey: prk,
      status: 'FAILED',
      outputSlot: ordinal,
      error: failed.value.error,
      code: 'INVALID_INPUT',
    });
    return { ok: true, value: { events, attempts: [failed.value], artifacts: [] } };
  }

  const usePollUntil =
    input.usePollUntil ?? (isMinimaxH3Tier(input.generatorKey) && !isFixtureClient);
  const ex = comfy as ComfyRenderPortEx;
  let status =
    usePollUntil && typeof ex.pollUntil === 'function'
      ? await ex.pollUntil(submitResult.promptId, {
          intervalMs: input.pollIntervalMs ?? 2000,
          timeoutMs: input.pollTimeoutMs ?? 30 * 60 * 1000,
        })
      : await comfy.poll(submitResult.promptId);

  if (status.status === 'FAILED') {
    const failed = reduceTakeAttempt(created.value, {
      type: 'MARK_FAILED',
      at: createdAt,
      error: status.error,
    });
    if (!failed.ok) return failed;
    events.push({
      attemptId,
      providerRequestKey: prk,
      status: 'FAILED',
      outputSlot: ordinal,
      error: status.error,
    });
    return { ok: true, value: { events, attempts: [failed.value], artifacts: [] } };
  }

  if (status.status === 'UNKNOWN' || status.status === 'PENDING') {
    // Phase A: pending-after-single-poll treated as UNKNOWN (timeout / ambiguous).
    const unknown = reduceTakeAttempt(created.value, {
      type: 'MARK_UNKNOWN',
      at: createdAt,
      error: status.status === 'PENDING' ? 'still pending after poll' : status.error,
    });
    if (!unknown.ok) return unknown;
    events.push({
      attemptId,
      providerRequestKey: prk,
      status: 'UNKNOWN',
      outputSlot: ordinal,
      error: unknown.value.error,
      code: 'UNKNOWN_NO_AUTO_RETRY',
    });
    return { ok: true, value: { events, attempts: [unknown.value], artifacts: [] } };
  }

  let artifact = status.artifacts[0]!;
  let contentSha256 = artifact.contentSha256;

  // H3 / live: materialize /view → disk and recompute sha
  if (!isFixtureClient && typeof (comfy as ComfyRenderPortEx).fetchViewToFile === 'function') {
    const outDir =
      input.artifactOutDir ??
      path.join('artifacts', 'comfy-h3-smoke', shotSpec.shotKey);
    fs.mkdirSync(outDir, { recursive: true });
    const dest = path.join(outDir, artifact.filename || 'h3_out.bin');
    try {
      const saved = await (comfy as ComfyRenderPortEx).fetchViewToFile!(
        {
          filename: artifact.filename,
          subfolder: artifact.subfolder,
          type: artifact.type,
        },
        dest,
      );
      contentSha256 = saved.contentSha256;
      artifact = {
        ...artifact,
        localPath: dest,
        contentSha256,
      };
    } catch (err) {
      const failed = reduceTakeAttempt(created.value, {
        type: 'MARK_FAILED',
        at: createdAt,
        error: err instanceof Error ? err.message : 'view fetch failed',
      });
      if (!failed.ok) return failed;
      events.push({
        attemptId,
        providerRequestKey: prk,
        status: 'FAILED',
        outputSlot: ordinal,
        error: failed.value.error,
      });
      return { ok: true, value: { events, attempts: [failed.value], artifacts: [] } };
    }
  }

  const artifactRevisionId = deterministicId('art', [
    seed,
    shotSpec.id,
    input.generatorKey,
    artifact.filename,
    contentSha256,
  ]);
  const takeId = deterministicId('take', [seed, input.takeManifestId, String(ordinal), 'comfy']);

  const takeParsed = TakeSchema.safeParse({
    id: takeId,
    takeManifestId: input.takeManifestId,
    ordinal,
    artifactRevisionId,
    createdAt,
  });
  if (!takeParsed.success) {
    return { ok: false, code: 'INVALID_INPUT', message: takeParsed.error.message };
  }
  const take: Take = Object.freeze({ ...takeParsed.data });

  const appended = await deps.store.appendTake(take);
  if (!appended.ok) return appended;

  const succeeded = reduceTakeAttempt(created.value, {
    type: 'MARK_SUCCEEDED',
    at: createdAt,
    takeId: take.id,
    contentSha256,
  });
  if (!succeeded.ok) return succeeded;

  events.push({
    attemptId,
    providerRequestKey: prk,
    status: 'SUCCEEDED',
    take: appended.value,
    outputSlot: ordinal,
    contentSha256,
  });

  return {
    ok: true,
    value: {
      events,
      attempts: [succeeded.value],
      artifacts: [
        {
          localPath: artifact.localPath,
          contentSha256,
          filename: artifact.filename,
        },
      ],
    },
  };
}

/**
 * Convenience: always fixture client — for unit/CTR without live Comfy.
 */
export async function runComfyFixtureTakes(
  input: StartLocalComfyTakesInput,
  deps: Omit<RunLocalComfyTakesDeps, 'comfy' | 'skipLiveReadyAssert'> & {
    readonly store: TakeStore;
  },
  priorAttempts: readonly TakeAttemptRecord[] = [],
): Promise<GenerationResult<RunLocalComfyTakesResult>> {
  return startLocalComfyTakes(
    input,
    {
      ...deps,
      comfy: createComfyHttpClient({ useFixture: true }),
      skipLiveReadyAssert: true,
    },
    priorAttempts,
  );
}
