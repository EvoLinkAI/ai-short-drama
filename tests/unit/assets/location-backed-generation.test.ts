import { describe, expect, it } from 'vitest'
import { canGenerateLocationBackedAsset, resolveLocationBackedGenerateType } from '@/app/[locale]/workspace/[projectId]/modes/studio/components/assets/location-backed-asset'

describe('location-backed asset generation rules', () => {
  it('allows props to generate from summary even before any image slot exists', () => {
    expect(canGenerateLocationBackedAsset({
      id: 'prop-1',
      name: '金箍棒',
      summary: '一根两头包裹金片的黑铁长棍',
      images: [],
    })).toBe(true)
  })

  it('allows locations to generate from seeded image descriptions', () => {
    expect(canGenerateLocationBackedAsset({
      id: 'location-1',
      name: '雨夜街道',
      summary: null,
      images: [
        {
          id: 'image-1',
          imageIndex: 0,
          description: '潮湿反光的老街',
          imageUrl: null,
          previousImageUrl: null,
          previousDescription: null,
          isSelected: false,
        },
      ],
    })).toBe(true)
  })

  it('routes prop generation through the prop branch', () => {
    expect(resolveLocationBackedGenerateType('prop')).toBe('prop')
    expect(resolveLocationBackedGenerateType('location')).toBe('location')
  })
})
