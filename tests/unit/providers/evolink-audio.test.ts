import { describe, expect, it } from 'vitest'
import { validateSunoMusicParams, type SunoMusicParams } from '@/lib/providers/evolink/suno-music'
import { validateSunoPersonaParams, type SunoPersonaParams } from '@/lib/providers/evolink/suno-persona'
import { validateVoicePrompt, validatePreviewText } from '@/lib/providers/evolink/voice-design'
import { extractAudioUrl, extractVoiceId, extractPersonaId, type AudioTaskResult } from '@/lib/providers/evolink/audio-task'

// ---- Suno Music Validation ----

describe('validateSunoMusicParams', () => {
  const base: SunoMusicParams = { model: 'suno-v5-beta', custom_mode: false, instrumental: false }

  it('simple mode requires prompt', () => {
    expect(validateSunoMusicParams({ ...base })).toMatch(/prompt.*required/)
  })

  it('simple mode prompt max 500', () => {
    expect(validateSunoMusicParams({ ...base, prompt: 'a'.repeat(501) })).toMatch(/500/)
  })

  it('simple mode valid', () => {
    expect(validateSunoMusicParams({ ...base, prompt: 'happy summer song' })).toBeNull()
  })

  it('custom mode requires style + title', () => {
    const p: SunoMusicParams = { ...base, custom_mode: true, prompt: 'lyrics' }
    expect(validateSunoMusicParams(p)).toMatch(/style.*required/)
  })

  it('custom mode requires title', () => {
    const p: SunoMusicParams = { ...base, custom_mode: true, prompt: 'lyrics', style: 'pop' }
    expect(validateSunoMusicParams(p)).toMatch(/title.*required/)
  })

  it('custom mode vocal requires prompt (lyrics)', () => {
    const p: SunoMusicParams = { ...base, custom_mode: true, style: 'pop', title: 'Title' }
    expect(validateSunoMusicParams(p)).toMatch(/prompt.*lyrics/)
  })

  it('custom mode instrumental skips prompt requirement', () => {
    const p: SunoMusicParams = { ...base, custom_mode: true, instrumental: true, style: 'pop', title: 'Title' }
    expect(validateSunoMusicParams(p)).toBeNull()
  })

  it('voice_persona requires v5', () => {
    const p: SunoMusicParams = {
      ...base, model: 'suno-v4.5-beta', custom_mode: false, prompt: 'test',
      persona_model: 'voice_persona', persona_id: 'abc',
    }
    expect(validateSunoMusicParams(p)).toMatch(/v5/)
  })

  it('persona_model requires persona_id', () => {
    const p: SunoMusicParams = {
      ...base, prompt: 'test', persona_model: 'style_persona',
    }
    expect(validateSunoMusicParams(p)).toMatch(/persona_id.*required/)
  })

  it('v4 lyrics max 3000', () => {
    const p: SunoMusicParams = {
      model: 'suno-v4-beta', custom_mode: true, instrumental: false,
      style: 'pop', title: 'T', prompt: 'a'.repeat(3001),
    }
    expect(validateSunoMusicParams(p)).toMatch(/3000/)
  })

  it('v4 style max 200', () => {
    const p: SunoMusicParams = {
      model: 'suno-v4-beta', custom_mode: true, instrumental: true,
      style: 'a'.repeat(201), title: 'T',
    }
    expect(validateSunoMusicParams(p)).toMatch(/200/)
  })

  it('title max 80', () => {
    const p: SunoMusicParams = {
      ...base, custom_mode: true, instrumental: true,
      style: 'pop', title: 'a'.repeat(81),
    }
    expect(validateSunoMusicParams(p)).toMatch(/80/)
  })

  it('range fields reject out of bounds', () => {
    expect(validateSunoMusicParams({ ...base, prompt: 'test', style_weight: 1.5 })).toMatch(/style_weight/)
    expect(validateSunoMusicParams({ ...base, prompt: 'test', weirdness_constraint: -0.1 })).toMatch(/weirdness/)
  })
})

// ---- Suno Persona Validation ----

describe('validateSunoPersonaParams', () => {
  const base: SunoPersonaParams = {
    source_task_id: 'task-unified-123',
    result_id: '4fcc4507-a7ae-4441-ad8a-465c2f61d5bb',
    name: 'Test',
    description: 'Test persona',
  }

  it('valid base params', () => {
    expect(validateSunoPersonaParams(base)).toBeNull()
  })

  it('missing source_task_id', () => {
    expect(validateSunoPersonaParams({ ...base, source_task_id: '' })).toMatch(/source_task_id/)
  })

  it('invalid result_id UUID', () => {
    expect(validateSunoPersonaParams({ ...base, result_id: 'not-a-uuid' })).toMatch(/UUID/)
  })

  it('vocal window must be paired', () => {
    expect(validateSunoPersonaParams({ ...base, vocal_start: 10 })).toMatch(/both/)
  })

  it('vocal window 10-30s', () => {
    expect(validateSunoPersonaParams({ ...base, vocal_start: 0, vocal_end: 5 })).toMatch(/10–30/)
    expect(validateSunoPersonaParams({ ...base, vocal_start: 0, vocal_end: 35 })).toMatch(/10–30/)
  })

  it('valid vocal window', () => {
    expect(validateSunoPersonaParams({ ...base, vocal_start: 10, vocal_end: 30 })).toBeNull()
  })
})

// ---- EvoLink Voice Design Validation ----

describe('evolink voice design validation', () => {
  it('voicePrompt max 2048', () => {
    expect(validateVoicePrompt('a'.repeat(2049)).valid).toBe(false)
    expect(validateVoicePrompt('a'.repeat(2048)).valid).toBe(true)
  })

  it('previewText max 1024, min 5', () => {
    expect(validatePreviewText('ab').valid).toBe(false)
    expect(validatePreviewText('a'.repeat(1025)).valid).toBe(false)
    expect(validatePreviewText('Hello world').valid).toBe(true)
  })
})

// ---- Result extraction helpers ----

describe('audio task result extraction', () => {
  it('extractAudioUrl from result_data.audio_url', () => {
    const r: AudioTaskResult = { id: 't1', status: 'completed', progress: 100, result_data: { audio_url: 'https://x/a.wav' } }
    expect(extractAudioUrl(r)).toBe('https://x/a.wav')
  })

  it('extractAudioUrl from songs array', () => {
    const r: AudioTaskResult = { id: 't1', status: 'completed', progress: 100, result_data: { songs: [{ audio_url: 'https://x/s.mp3' }] } }
    expect(extractAudioUrl(r)).toBe('https://x/s.mp3')
  })

  it('extractAudioUrl from results fallback', () => {
    const r: AudioTaskResult = { id: 't1', status: 'completed', progress: 100, results: ['https://x/f.wav'] }
    expect(extractAudioUrl(r)).toBe('https://x/f.wav')
  })

  it('extractAudioUrl returns undefined on empty', () => {
    const r: AudioTaskResult = { id: 't1', status: 'completed', progress: 100 }
    expect(extractAudioUrl(r)).toBeUndefined()
  })

  it('extractAudioUrl handles null song in array', () => {
    const r: AudioTaskResult = { id: 't1', status: 'completed', progress: 100, result_data: { songs: [null, { audio_url: 'https://x/s2.mp3' }] } }
    // First item is null, should not crash — but extractAudioUrl only checks [0]
    expect(extractAudioUrl(r)).toBeUndefined()
  })

  it('extractVoiceId from result_data.voice', () => {
    const r: AudioTaskResult = { id: 't1', status: 'completed', progress: 100, result_data: { voice: 'voice-123' } }
    expect(extractVoiceId(r)).toBe('voice-123')
  })

  it('extractPersonaId from result_data.persona_id', () => {
    const r: AudioTaskResult = { id: 't1', status: 'completed', progress: 100, result_data: { persona_id: 'p-123' } }
    expect(extractPersonaId(r)).toBe('p-123')
  })
})
