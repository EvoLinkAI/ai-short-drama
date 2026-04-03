import { describe, expect, it } from 'vitest'
import { parseVoiceLinesJson as parseStoryboardVoiceLinesJson } from '@/lib/workers/handlers/script-to-storyboard-helpers'
import { parseVoiceLinesJson as parseStandaloneVoiceLinesJson } from '@/lib/workers/handlers/voice-analyze-helpers'

describe('voice line parse helpers', () => {
  it('script-to-storyboard parser accepts explicit empty array', () => {
    expect(parseStoryboardVoiceLinesJson('[]')).toEqual([])
  })

  it('script-to-storyboard parser rejects non-object array payload', () => {
    expect(() => parseStoryboardVoiceLinesJson('[1,2]')).toThrow('voice_analyze: invalid payload')
  })

  it('voice-analyze parser accepts explicit empty array', () => {
    expect(parseStandaloneVoiceLinesJson('[]')).toEqual([])
  })

  it('voice-analyze parser rejects non-object array payload', () => {
    expect(() => parseStandaloneVoiceLinesJson('[1,2]')).toThrow('Invalid voice lines data structure')
  })
})
