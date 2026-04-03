[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **assets**

# Assets Module

Asset registry, grouping, mappers, and service layer for character/location/prop management.

## Module Purpose

Provides the data abstraction layer for assets (characters, locations, props) used in the studio pipeline. Handles asset kind registration, grouping by type, mapping between DB models and API contracts, and prompt context generation.

## Key Files

| File | Purpose |
|------|---------|
| `contracts.ts` | Asset type contracts and interfaces |
| `kinds/registry.ts` | Asset kind registry (character, location, prop) |
| `grouping.ts` | Asset grouping by type for UI display |
| `mappers.ts` | DB model to API response mappers |
| `description-fields.ts` | Description field extraction utilities |
| `services/asset-actions.ts` | Asset CRUD action handlers |
| `services/asset-label.ts` | Asset label management |
| `services/asset-prompt-context.ts` | Generate prompt context from assets |
| `services/location-backed-assets.ts` | Location-backed asset operations |
| `services/read-assets.ts` | Asset read/query operations |

## Data Model

- **Project-scoped**: `StudioCharacter`, `StudioLocation` (with appearances/images)
- **Global (Asset Hub)**: `GlobalCharacter`, `GlobalLocation`, `GlobalVoice`, `GlobalAssetFolder`
- Assets can be copied from global to project scope via `copy-from-global` API

## Testing

- Unit: `tests/unit/assets/` (location-backed-assets, location-backed-generation, mappers, prompt-context, registry)

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
