/**
 * CTR-03 extension: minimax_h3 accepted; non-local still refused.
 */
import { describe, expect, it } from 'vitest';
import { runComfyFixtureTakes } from '@/agents/generation/run-local-comfy-takes';
import { createTakeManifest } from '@/agents/generation/run-mock-takes';
import { MemoryTakeStore } from '@/agents/generation/memory-take-store';
import { isLocalComfySubmitTier } from '@/providers/comfy';
import type { ShotSpec } from '@/schemas/shot-spec';

const NOW = '2026-09-12T11:05:00.000Z';
const shaA = 'b'.repeat(64);

function validShotSpec(): ShotSpec {
  return {
    id: 'shot-spec-h3-ctr',
    projectId: 'proj-1',
    episodeManifestId: 'ep-1',
    shotKey: 'S02',
    revisionNo: 1,
    tier: 'B',
    durationSec: 4,
    characterIds: ['char-1'],
    sceneBibleRevisionId: 'scene-rev-1',
    camera: { framing: 'WS' },
    blocking: 'walk',
    continuityConstraints: ['y'],
    humanReviewRequired: false,
    contentSha256: shaA,
    createdAt: NOW,
  };
}

describe('H3 tier accept (CTR-03 ext)', () => {
  it('lists minimax_h3 as submit tier', () => {
    expect(isLocalComfySubmitTier('local.comfy.minimax_h3')).toBe(true);
  });

  it('fixture path accepts H3 generatorKey with preflight', async () => {
    const store = new MemoryTakeStore();
    await createTakeManifest(
      {
        id: 'tm-h3-ctr',
        projectId: 'proj-1',
        subjectKind: 'shot',
        subjectId: 'shot-spec-h3-ctr',
        purpose: 'select',
        policyId: 'pol-1',
        policyVersion: '1',
        createdAt: NOW,
      },
      store,
    );
    const result = await runComfyFixtureTakes(
      {
        shotSpec: validShotSpec(),
        takeManifestId: 'tm-h3-ctr',
        generatorKey: 'local.comfy.minimax_h3',
        preflightOk: true,
        createdAt: NOW,
        fixtureScenario: 'success',
        referenceImageName: 'h3_ref_fixture.png',
      },
      { store },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.attempts[0]?.status).toBe('SUCCEEDED');
  });
});
