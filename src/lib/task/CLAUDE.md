[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **task**

# Task System Module

Task lifecycle management, BullMQ queue integration, and SSE event publishing.

## Module Purpose

Manages the complete lifecycle of asynchronous AI generation tasks: creation with deduplication, queue submission, progress tracking via SSE, and status transitions (queued -> processing -> completed/failed/canceled).

## Key Files

| File | Purpose |
|------|---------|
| `types.ts` | Core type definitions: `TASK_TYPE` (35+ types), `TASK_STATUS`, `TaskJobData`, `SSEEvent`, `CreateTaskInput` |
| `service.ts` | Task creation, status updates, query operations |
| `submitter.ts` | BullMQ job submission with billing integration |
| `queues.ts` | Queue definitions and Redis connection |
| `publisher.ts` | SSE event publishing to connected clients |
| `state-service.ts` | Task state machine transitions |
| `client.ts` | Client-side task polling and subscription |
| `intent.ts` | Task intent resolution |
| `reconcile.ts` | Stale task reconciliation |
| `progress-message.ts` | Progress message formatting |
| `error-message.ts` | Error message formatting |
| `errors.ts` | Task-specific error types |
| `has-output.ts` | Output detection helpers |
| `presentation.ts` | Task display formatting |
| `ui-payload.ts` | Frontend payload extraction |
| `resolve-locale.ts` | Locale resolution for task messages |

## Task Types (35+)

Defined in `types.ts` as `TASK_TYPE` enum. Key categories:
- **Image**: `image_panel`, `image_character`, `image_location`, `asset_hub_image`, `modify_asset_image`
- **Video**: `video_panel`, `lip_sync`
- **Voice**: `voice_line`, `voice_design`, `voice_analyze`, `asset_hub_voice_design`
- **Text/LLM**: `analyze_novel`, `story_to_script_run`, `script_to_storyboard_run`, `screenplay_convert`, `clips_build`, `episode_split_llm`, `ai_create_character`, `ai_modify_*`, `character_profile_*`, `reference_to_character`, `analyze_global`, `analyze_shot_variants`

## Queue Types

4 queues mapped to worker pools: `image`, `video`, `voice`, `text`

## SSE Integration

- Tasks publish lifecycle events via `publisher.ts`
- Client subscribes at `GET /api/sse` for real-time updates
- Event types: `task.lifecycle`, `task.stream`

## Testing

- Unit: `tests/unit/helpers/task-state-service.test.ts`, `tests/unit/helpers/task-submitter-helpers.test.ts`
- Integration: `tests/integration/task/`
- Guards: `scripts/guards/task-loading-guard.mjs`, `scripts/guards/task-target-states-no-polling-guard.mjs`

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
