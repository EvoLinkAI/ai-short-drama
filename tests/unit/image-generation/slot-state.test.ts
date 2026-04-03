import { describe, expect, it } from 'vitest'
import {
  countGeneratedImageSlots,
  resolveDisplayImageSlots,
  resolveGroupedImageSlotPhase,
  resolveImageSlotPhase,
  shouldShowImageSlotGrid,
} from '@/lib/image-generation/slot-state'

describe('image slot state', () => {
  it('counts only slots with image urls', () => {
    expect(countGeneratedImageSlots([
      { imageUrl: 'a.png' },
      { imageUrl: null },
      { imageUrl: 'b.png' },
    ])).toBe(2)
  })

  it('distinguishes generate and regenerate phases', () => {
    expect(resolveImageSlotPhase({ imageUrl: null }, true)).toBe('generating')
    expect(resolveImageSlotPhase({ imageUrl: 'a.png' }, true)).toBe('regenerating')
    expect(resolveImageSlotPhase({ imageUrl: null }, false)).toBe('idle-empty')
    expect(resolveImageSlotPhase({ imageUrl: 'a.png' }, false)).toBe('idle-filled')
  })

  it('keeps completed filled slots idle while the group still has empty pending slots', () => {
    expect(resolveGroupedImageSlotPhase(
      { imageUrl: 'a.png' },
      { isGroupRunning: true, isSlotRunning: false, hasPendingEmptySlots: true },
    )).toBe('idle-filled')

    expect(resolveGroupedImageSlotPhase(
      { imageUrl: null },
      { isGroupRunning: true, isSlotRunning: true, hasPendingEmptySlots: true },
    )).toBe('generating')
  })

  it('hides legacy empty slots when the location is idle', () => {
    const displaySlots = resolveDisplayImageSlots([
      { imageUrl: 'a.png' },
      { imageUrl: null },
      { imageUrl: null },
    ], {
      hasRunningTask: false,
      requestedCount: 1,
    })

    expect(displaySlots).toHaveLength(1)
    expect(displaySlots[0]?.imageUrl).toBe('a.png')
  })

  it('shows only one slot while running a single-image location generation', () => {
    const displaySlots = resolveDisplayImageSlots([
      { imageUrl: null },
      { imageUrl: null },
      { imageUrl: null },
    ], {
      hasRunningTask: true,
      requestedCount: 1,
    })

    expect(displaySlots).toHaveLength(1)
  })

  it('shows requested placeholders while running a multi-image location generation', () => {
    const displaySlots = resolveDisplayImageSlots([
      { imageUrl: 'a.png' },
      { imageUrl: null },
      { imageUrl: null },
      { imageUrl: null },
    ], {
      hasRunningTask: true,
      requestedCount: 4,
    })

    expect(displaySlots).toHaveLength(4)
  })

  it('shows slot grid only after generation is active or meaningful', () => {
    expect(shouldShowImageSlotGrid({
      totalSlotCount: 3,
      generatedCount: 0,
      hasRunningTask: false,
      hasAnyError: false,
    })).toBe(false)

    expect(shouldShowImageSlotGrid({
      totalSlotCount: 3,
      generatedCount: 0,
      hasRunningTask: true,
      hasAnyError: false,
    })).toBe(true)

    expect(shouldShowImageSlotGrid({
      totalSlotCount: 3,
      generatedCount: 1,
      hasRunningTask: false,
      hasAnyError: false,
    })).toBe(true)
  })
})
