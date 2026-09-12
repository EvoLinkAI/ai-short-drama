/**
 * pollUntil behaviour — fake clock via injected sleep + stub port methods.
 */
import { describe, expect, it, vi } from 'vitest';
import { ComfyHttpClient } from '@/providers/comfy/comfy-http-client';
import type { ComfyJobStatus } from '@/providers/comfy/types';

describe('ComfyHttpClient.pollUntil', () => {
  it('returns SUCCEEDED after PENDING then SUCCESS (fixture)', async () => {
    const client = new ComfyHttpClient({ useFixture: true });
    // fixture timeout id path → UNKNOWN immediately; use success prompt via submit
    const { promptId } = await client.submit({
      prompt: { '1': { class_type: 'x', inputs: {} } },
      fixtureScenario: 'success',
    });
    const status = await client.pollUntil(promptId, {
      intervalMs: 1,
      timeoutMs: 1000,
      sleep: async () => undefined,
    });
    expect(status.status).toBe('SUCCEEDED');
    if (status.status === 'SUCCEEDED') {
      expect(status.artifacts.length).toBeGreaterThan(0);
    }
  });

  it('times out to UNKNOWN when always PENDING', async () => {
    const client = new ComfyHttpClient({ useFixture: true });
    const polls: ComfyJobStatus[] = [
      { status: 'PENDING' },
      { status: 'PENDING' },
      { status: 'PENDING' },
    ];
    let i = 0;
    vi.spyOn(client, 'poll').mockImplementation(async () => polls[Math.min(i++, polls.length - 1)]!);
    const status = await client.pollUntil('x', {
      intervalMs: 1,
      timeoutMs: 5,
      sleep: async () => undefined,
    });
    expect(status.status).toBe('UNKNOWN');
  });
});
