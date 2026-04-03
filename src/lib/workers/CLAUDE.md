[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **workers**

# Workers Module

BullMQ-based background job processing system with 4 specialized worker pools and 50+ task handlers.

## Module Purpose

Processes all asynchronous AI generation tasks: image synthesis, video generation, voice synthesis, text analysis (LLM). Each worker pool reads from a dedicated Redis queue and dispatches to type-specific handlers.

## Entry & Startup

- **Entry**: `src/lib/workers/index.ts` -- starts all 4 workers, registers signal handlers for graceful shutdown
- **Started by**: `npm run dev:worker` (development) or `npm run start:worker` (production)
- **Concurrency config**: Environment variables `QUEUE_CONCURRENCY_IMAGE`, `QUEUE_CONCURRENCY_VIDEO`, `QUEUE_CONCURRENCY_VOICE`, `QUEUE_CONCURRENCY_TEXT`

## Worker Pools

| Worker | File | Queue Types |
|--------|------|-------------|
| Image | `image.worker.ts` | image_panel, image_character, image_location, asset_hub_image, modify_*, regenerate_* |
| Video | `video.worker.ts` | video_panel, lip_sync |
| Voice | `voice.worker.ts` | voice_line, voice_design, voice_analyze, asset_hub_voice_design |
| Text | `text.worker.ts` | analyze_novel, story_to_script_run, script_to_storyboard_run, screenplay_convert, clips_build, episode_split_llm, ai_create_*, ai_modify_*, character_profile_*, reference_to_character |

## Handler Files

- `handlers/analyze-novel.ts` -- Novel text analysis
- `handlers/story-to-script.ts` + helpers -- Story-to-screenplay LLM pipeline
- `handlers/screenplay-convert.ts` + helpers -- Screenplay format conversion
- `handlers/script-to-storyboard.ts` + helpers -- Script-to-storyboard with atomic retry
- `handlers/clips-build.ts` -- Clip segmentation
- `handlers/episode-split.ts` -- Episode splitting via LLM
- `handlers/shot-ai-*.ts` (7 files) -- Shot-level AI prompt generation, variant analysis, persistence
- `handlers/image-task-handlers*.ts` -- Image generation dispatchers
- `handlers/panel-*-task-handler.ts` -- Panel image/variant generation
- `handlers/character-image-task-handler.ts` -- Character image generation
- `handlers/location-image-task-handler.ts` -- Location image generation
- `handlers/modify-*-task-handler.ts` -- Image modification handlers
- `handlers/voice-analyze.ts` + helpers -- Voice analysis pipeline
- `handlers/voice-design.ts` -- Voice design generation
- `handlers/llm-proxy.ts` / `llm-stream.ts` -- LLM proxy and streaming
- `handlers/reference-to-character.ts` + helpers -- Image-to-character extraction
- `handlers/character-profile.ts` + helpers -- Character profile generation
- `handlers/analyze-global*.ts` (3 files) -- Global analysis (parse, prompt, persist)
- `handlers/asset-hub-*.ts` -- Asset hub specific handlers

## Key Dependencies & Config

- **BullMQ**: `src/lib/task/queues.ts` defines queue names and connections
- **Task types**: `src/lib/task/types.ts` -- `TASK_TYPE` enum (35+ types)
- **Billing integration**: Each handler calls billing service for cost tracking
- **Storage**: Handlers download/upload media via `src/lib/storage/`
- **LLM**: Handlers use `src/lib/llm/` for text generation and `src/lib/generators/` for media generation
- **User concurrency gate**: `user-concurrency-gate.ts` limits per-user parallel jobs

## Data Model

Workers operate on tasks stored in the `Task` table (and `GraphRun` for workflow runs). Job data follows the `TaskJobData` type from `src/lib/task/types.ts`.

## Testing

- Unit tests: `tests/unit/worker/`
- Integration tests: `tests/integration/chain/` (end-to-end generation chains)
- System tests: `tests/system/` (full generation workflows)

## Related Files

- `scripts/watchdog.ts` -- Monitors worker health, restarts stalled tasks
- `scripts/bull-board.ts` -- Bull Board admin panel for queue inspection
- `src/lib/task/service.ts` -- Task creation and lifecycle management
- `src/lib/task/submitter.ts` -- Task submission to BullMQ queues

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
