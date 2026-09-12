/**
 * Wave6 mock/local Take generation pipeline (memory only).
 * Entry: createTakeManifest + startMockTakes with preflightOk: true.
 * Wave10: startLocalComfyTakes / runComfyFixtureTakes (local.comfy.*).
 */
export { MOCK_GENERATOR_KEYS, TAKE_ATTEMPT_STATUSES } from './types';
export type {
  CreateTakeManifestCommand,
  GenerationFailureCode,
  GenerationResult,
  MockGeneratorKey,
  SelectTakeCommand,
  StartMockTakesInput,
  TakeAttemptEvent,
  TakeAttemptRecord,
  TakeAttemptStatus,
} from './types';

export type { TakeStore } from './take-store';
export { MemoryTakeStore } from './memory-take-store';

export {
  canAutoRetry,
  canDispatchProviderRequestKey,
  createTakeAttempt,
  reduceTakeAttempt,
} from './attempt-service';
export type { AttemptEvent, CreateTakeAttemptCommand } from './attempt-service';

export { generateTakes } from './mock-take-generator';
export type { GenerateTakesCommand, GeneratedTakeBundle } from './mock-take-generator';

export {
  createTakeManifest,
  markAttemptUnknown,
  startMockTakes,
} from './run-mock-takes';
export type { RunMockTakesDeps, RunMockTakesResult } from './run-mock-takes';

export {
  runComfyFixtureTakes,
  startLocalComfyTakes,
} from './run-local-comfy-takes';
export type {
  RunLocalComfyTakesDeps,
  RunLocalComfyTakesResult,
  StartLocalComfyTakesInput,
} from './run-local-comfy-takes';

/**
 * INTEGRATION: append these exports to worktree
 * `src/agents/generation/index.ts` (Wave10 barrel).
 * Do not replace the whole file — merge only.
 */
export {
  enqueueH3Take,
  enqueueH3TakeFixture,
  H3_GENERATOR_KEY,
} from './enqueue-h3-take';
export type {
  EnqueueH3TakeDeps,
  EnqueueH3TakeInput,
  EnqueueH3TakeResult,
  EnqueueH3TakeValue,
} from './enqueue-h3-take';
