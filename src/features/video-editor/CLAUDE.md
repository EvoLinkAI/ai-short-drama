[Root](../../../CLAUDE.md) > [src](../../) > [features](../) > **video-editor**

# Video Editor Module

Remotion-based timeline video editor for composing final promotional videos from generated storyboard assets.

## Module Purpose

Provides an in-browser video editing experience using Remotion. Users arrange generated panels (images), videos, voice lines, and transitions on a timeline to produce the final promotional video.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Module exports |
| `types/editor.types.ts` | Editor state and track type definitions |
| `hooks/useEditorState.ts` | Editor state management hook |
| `hooks/useEditorActions.ts` | Editor action dispatchers |
| `components/VideoEditorStage.tsx` | Main editor stage component |
| `components/Timeline/Timeline.tsx` | Timeline track component |
| `components/Preview/RemotionPreview.tsx` | Remotion-based video preview |
| `components/TransitionPicker.tsx` | Transition effect selector |
| `remotion/VideoComposition.tsx` | Remotion composition definition |
| `remotion/transitions/index.tsx` | Transition effect implementations |
| `utils/migration.ts` | Editor data migration utilities |
| `utils/time-utils.ts` | Time calculation helpers |

## Key Dependencies

- **Remotion**: `remotion`, `@remotion/cli`, `@remotion/player` for video composition and playback
- **Database**: `VideoEditorProject` model stores project data as JSON

## Data Model

- `VideoEditorProject` -- Stores editor project data (JSON), render status, output URL
- Linked to `StudioEpisode` via `episodeId`

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
