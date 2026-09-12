/**
 * Wave11-A · H3 enqueue preflight gate (no network / no AutoDL).
 * W11A-01: preflight red → zero Comfy submit
 * W11A-02: preflight green + mock Port → Take + contentSha256
 * W11A-08: default generatorKey only local.comfy.minimax_h3
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  createHumanLockService,
  MemoryHumanLockStore,
  type HumanLockService,
  type LockActor,
} from '@/core/lock';
import { createTakeManifest } from '@/agents/generation/run-mock-takes';
import { MemoryTakeStore } from '@/agents/generation/memory-take-store';
import {
  enqueueH3Take,
  H3_GENERATOR_KEY,
} from '@/agents/generation/enqueue-h3-take';
import type { ComfyJob, ComfyRenderPort } from '@/providers/comfy';
import type { ShotSpec } from '@/schemas/shot-spec';
import type { SceneState } from '@/schemas/scene-state';

const NOW = '2026-09-12T12:00:00.000Z';
const shaA = 'a'.repeat(64);
const shaFake = 'f'.repeat(64);

const human: LockActor = { kind: 'human', id: 'user-1', trusted: true };
const agent: LockActor = { kind: 'agent', id: 'agent-w11a' };

function validShotSpec(): ShotSpec {
  return {
    id: 'shot-spec-w11a-1',
    projectId: 'proj-1',
    episodeManifestId: 'ep-1',
    shotKey: 'S01',
    revisionNo: 1,
    tier: 'A',
    durationSec: 5,
    characterIds: ['char-1'],
    sceneBibleRevisionId: 'scene-rev-1',
    camera: { framing: 'MCU' },
    blocking: 'stand',
    continuityConstraints: ['x'],
    humanReviewRequired: false,
    contentSha256: shaA,
    createdAt: NOW,
  };
}

function continuityLock(overrides: Record<string, unknown> = {}) {
  return {
    id: 'scl-w11a-1',
    shotSpecId: 'shot-spec-w11a-1',
    storyBibleRevisionId: 'sb-1',
    storyBibleContentSha256: shaA,
    appearanceRevisionId: 'app-1',
    appearanceContentSha256: shaA,
    sceneBibleRevisionId: 'scene-1',
    sceneBibleContentSha256: shaA,
    voiceRevisionId: 'voice-1',
    voiceContentSha256: shaA,
    priorSceneStateId: 'ss-prior-1',
    priorSceneStateContentSha256: shaA,
    contentSha256: shaA,
    createdAt: NOW,
    ...overrides,
  };
}

function priorState(overrides: Partial<SceneState> = {}): SceneState {
  return {
    id: 'ss-prior-1',
    projectId: 'proj-1',
    shotId: 'shot-0',
    version: 1,
    camera: '35mm',
    pose: 'stand',
    gaze: 'cam',
    wardrobe: 'w1',
    props: 'p1',
    location: 'loc1',
    timeOfDay: 'dusk',
    lighting: 'soft',
    emotion: 'calm',
    spatialRelations: 'A-B',
    sourceArtifactRevisionId: 'art-1',
    sourceCandidateSelectionId: 'sel-1',
    transitionReason: 'from-prev',
    contentSha256: shaA,
    createdAt: NOW,
    ...overrides,
  };
}

const requiredLocks = [
  {
    subjectType: 'shot_spec' as const,
    subjectId: 'shot-spec-w11a-1',
    revisionId: 'ssr-1',
    contentSha256: shaA,
  },
  {
    subjectType: 'story_bible' as const,
    subjectId: 'proj-1',
    revisionId: 'sb-1',
    contentSha256: shaA,
  },
  {
    subjectType: 'visual_bible' as const,
    subjectId: 'proj-1',
    revisionId: 'vb-1',
    contentSha256: shaA,
  },
  {
    subjectType: 'character_dna' as const,
    subjectId: 'char-1',
    revisionId: 'dna-1',
    contentSha256: shaA,
  },
];

function createMockComfyPort(opts?: { readonly contentSha256?: string }): {
  readonly port: ComfyRenderPort;
  readonly state: { submitCalls: number; submittedJobs: ComfyJob[] };
} {
  const state = { submitCalls: 0, submittedJobs: [] as ComfyJob[] };
  const sha = opts?.contentSha256 ?? shaFake;
  const port: ComfyRenderPort = {
    async health() {
      return { ok: true, canSmoke: true };
    },
    async submit(job: ComfyJob) {
      state.submitCalls += 1;
      state.submittedJobs.push(job);
      return { promptId: 'prompt-w11a-mock-1' };
    },
    async poll() {
      return {
        status: 'SUCCEEDED' as const,
        artifacts: [
          {
            filename: 'h3_mock_out.mp4',
            subfolder: '',
            type: 'output',
            contentSha256: sha,
          },
        ],
      };
    },
  };
  return { port, state };
}

describe('v11-h3-enqueue-preflight (Wave11-A)', () => {
  let lockStore: MemoryHumanLockStore;
  let humanLockService: HumanLockService;
  let takeStore: MemoryTakeStore;

  beforeEach(async () => {
    lockStore = new MemoryHumanLockStore();
    humanLockService = createHumanLockService(lockStore);
    takeStore = new MemoryTakeStore();
    for (const lock of requiredLocks) {
      await humanLockService.commitLock(lock, human);
    }
    await createTakeManifest(
      {
        id: 'tm-w11a-1',
        projectId: 'proj-1',
        subjectKind: 'shot',
        subjectId: 'shot-spec-w11a-1',
        purpose: 'select',
        policyId: 'pol-1',
        policyVersion: '1',
        createdAt: NOW,
      },
      takeStore,
    );
  });

  it('W11A-01: preflight red → zero Comfy submit (mock Port)', async () => {
    const mock = createMockComfyPort();
    const startSpy = vi.fn();
    const fixtureSpy = vi.fn();

    const denied = await enqueueH3Take(
      {
        shotSpec: validShotSpec(),
        takeManifestId: 'tm-w11a-1',
        referenceImageName: 'hero_frame.png',
        useFixture: false,
        preflight: {
          // non-firstShot missing prior → PRIOR_SCENE_STATE_REQUIRED
          continuityLock: continuityLock({
            priorSceneStateId: null,
            priorSceneStateContentSha256: null,
          }),
          priorState: null,
          requiredLocks,
          actor: agent,
        },
      },
      {
        store: takeStore,
        humanLockService,
        comfy: mock.port,
        skipLiveReadyAssert: true,
        now: () => NOW,
        startLocalComfyTakesFn: startSpy as never,
        runComfyFixtureTakesFn: fixtureSpy as never,
      },
    );

    expect(denied).toMatchObject({
      ok: false,
      code: 'PREFLIGHT_REQUIRED',
    });
    expect(String((denied as { message?: string }).message)).toMatch(
      /GENERATE_PREFLIGHT_REJECTED:PRIOR_SCENE_STATE_REQUIRED/,
    );
    expect(mock.state.submitCalls).toBe(0);
    expect(startSpy).not.toHaveBeenCalled();
    expect(fixtureSpy).not.toHaveBeenCalled();
  });

  it('W11A-01b: lock missing → zero submit even with injected Port', async () => {
    const mock = createMockComfyPort();
    const denied = await enqueueH3Take(
      {
        shotSpec: validShotSpec(),
        takeManifestId: 'tm-w11a-1',
        useFixture: false,
        preflight: {
          continuityLock: continuityLock(),
          priorState: priorState(),
          requiredLocks: [
            ...requiredLocks,
            {
              subjectType: 'shot_spec' as const,
              subjectId: 'shot-missing',
              revisionId: 'ssr-x',
              contentSha256: shaA,
            },
          ],
          actor: agent,
        },
      },
      {
        store: takeStore,
        humanLockService,
        comfy: mock.port,
        skipLiveReadyAssert: true,
        now: () => NOW,
      },
    );

    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.code).toBe('PREFLIGHT_REQUIRED');
    }
    expect(mock.state.submitCalls).toBe(0);
  });

  it('W11A-02: preflight green + mock Port SUCCESS → Take + contentSha256', async () => {
    const mock = createMockComfyPort({ contentSha256: shaFake });

    const ok = await enqueueH3Take(
      {
        shotSpec: validShotSpec(),
        takeManifestId: 'tm-w11a-1',
        referenceImageName: 'hero_frame.png',
        useFixture: false,
        seed: 'w11a-seed-ok',
        createdAt: NOW,
        preflight: {
          continuityLock: continuityLock(),
          priorState: priorState(),
          requiredLocks,
          actor: agent,
        },
      },
      {
        store: takeStore,
        humanLockService,
        comfy: mock.port,
        skipLiveReadyAssert: true,
        now: () => NOW,
      },
    );

    expect(ok.ok).toBe(true);
    if (!ok.ok) return;

    expect(mock.state.submitCalls).toBe(1);
    expect(ok.value.artifacts.length).toBeGreaterThanOrEqual(1);
    expect(ok.value.artifacts[0]?.contentSha256).toBe(shaFake);
    expect(ok.value.continuityLock.shotSpecId).toBe('shot-spec-w11a-1');

    const succeeded = ok.value.attempts.find((a) => a.status === 'SUCCEEDED');
    expect(succeeded).toBeTruthy();
    // Prefer attempt sha when present; events/artifacts remain SoT if shape drifts
    const attemptSha = (succeeded as { contentSha256?: string } | undefined)?.contentSha256;
    if (attemptSha !== undefined) {
      expect(attemptSha).toBe(shaFake);
    }
    const succEvent = ok.value.events.find((e) => e.status === 'SUCCEEDED');
    expect(succEvent).toBeTruthy();
    expect((succEvent as { contentSha256?: string } | undefined)?.contentSha256).toBe(shaFake);

    const takes = await takeStore.listTakes('tm-w11a-1');
    expect(takes.length).toBe(1);
  });

  it('W11A-08: refuses non-H3 / paid generatorKey before Comfy', async () => {
    const mock = createMockComfyPort();

    const paid = await enqueueH3Take(
      {
        shotSpec: validShotSpec(),
        takeManifestId: 'tm-w11a-1',
        generatorKey: 'cn.ark.seedance_mini',
        useFixture: false,
        preflight: {
          continuityLock: continuityLock(),
          priorState: priorState(),
          requiredLocks,
          actor: agent,
        },
      },
      {
        store: takeStore,
        humanLockService,
        comfy: mock.port,
        skipLiveReadyAssert: true,
      },
    );
    expect(paid).toMatchObject({ ok: false, code: 'PAID_TIER_REFUSED' });
    expect(mock.state.submitCalls).toBe(0);

    const wan = await enqueueH3Take(
      {
        shotSpec: validShotSpec(),
        takeManifestId: 'tm-w11a-1',
        generatorKey: 'local.comfy.wan22_5b',
        useFixture: false,
        preflight: {
          continuityLock: continuityLock(),
          priorState: priorState(),
          requiredLocks,
          actor: agent,
        },
      },
      {
        store: takeStore,
        humanLockService,
        comfy: mock.port,
        skipLiveReadyAssert: true,
      },
    );
    expect(wan).toMatchObject({ ok: false, code: 'UNKNOWN_GENERATOR' });
    expect(mock.state.submitCalls).toBe(0);

    expect(H3_GENERATOR_KEY).toBe('local.comfy.minimax_h3');
  });
});
