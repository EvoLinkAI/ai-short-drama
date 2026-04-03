export type ImageSlotLike = {
  imageUrl: string | null
}

export type DisplayableImageSlotLike = ImageSlotLike & {
  lastError?: { code: string; message: string } | null
  imageErrorMessage?: string | null
}

export type ImageSlotPhase =
  | 'idle-empty'
  | 'idle-filled'
  | 'generating'
  | 'regenerating'

export function countGeneratedImageSlots<T extends ImageSlotLike>(slots: readonly T[]): number {
  return slots.reduce((count, slot) => (slot.imageUrl ? count + 1 : count), 0)
}

function hasImageSlotError(slot: DisplayableImageSlotLike): boolean {
  return Boolean(slot.lastError || slot.imageErrorMessage)
}

export function resolveDisplayImageSlots<T extends DisplayableImageSlotLike>(
  slots: readonly T[],
  input: {
    hasRunningTask: boolean
    requestedCount: number
  },
): T[] {
  if (input.hasRunningTask) {
    const visibleCount = Math.min(slots.length, Math.max(countGeneratedImageSlots(slots), input.requestedCount))
    return slots.slice(0, visibleCount)
  }

  return slots.filter((slot) => slot.imageUrl || hasImageSlotError(slot))
}

export function resolveImageSlotPhase(slot: ImageSlotLike, isRunning: boolean): ImageSlotPhase {
  if (isRunning) {
    return slot.imageUrl ? 'regenerating' : 'generating'
  }
  return slot.imageUrl ? 'idle-filled' : 'idle-empty'
}

export function resolveGroupedImageSlotPhase(
  slot: ImageSlotLike,
  input: {
    isGroupRunning: boolean
    isSlotRunning: boolean
    hasPendingEmptySlots: boolean
  },
): ImageSlotPhase {
  if (input.isSlotRunning) {
    return slot.imageUrl ? 'regenerating' : 'generating'
  }
  if (input.isGroupRunning) {
    if (!slot.imageUrl) return 'generating'
    if (input.hasPendingEmptySlots) return 'idle-filled'
    return 'regenerating'
  }
  return slot.imageUrl ? 'idle-filled' : 'idle-empty'
}

interface ShowSlotGridInput {
  totalSlotCount: number
  generatedCount: number
  hasRunningTask: boolean
  hasAnyError: boolean
}

export function shouldShowImageSlotGrid(input: ShowSlotGridInput): boolean {
  if (input.totalSlotCount <= 1) return false
  if (input.hasRunningTask) return true
  if (input.generatedCount > 0) return true
  if (input.hasAnyError) return true
  return false
}
