import { describe, expect, it } from 'vitest'

/**
 * Regression: EvoLink audio APIs must use /v1/audios/generations (async task model),
 * not the old /v1/audio/speech or /v1/audio/voices endpoints.
 *
 * Covers: src/app/api/user/api-config/route.ts (default model ID change)
 *         src/lib/workers/handlers/voice-design.ts (dual provider support)
 *         src/lib/providers/evolink/ (audio modules)
 */
describe('regression - EvoLink audio API alignment', () => {
  it('EvolinkAudioGenerator should be constructable', async () => {
    const { EvolinkAudioGenerator } = await import('@/lib/generators/evolink')
    const gen = new EvolinkAudioGenerator()
    expect(gen).toBeDefined()
  })

  it('TTS model ID constant maintained for backward compat', async () => {
    const { EVOLINK_TTS_MODEL_ID } = await import('@/lib/providers/evolink/tts')
    // Legacy full version ID kept for callers
    expect(EVOLINK_TTS_MODEL_ID).toBe('qwen3-tts-vd-2026-01-26')
  })

  it('Suno modules export expected functions', async () => {
    const { generateSunoMusic, validateSunoMusicParams } = await import('@/lib/providers/evolink/suno-music')
    const { createSunoPersona, validateSunoPersonaParams } = await import('@/lib/providers/evolink/suno-persona')
    expect(typeof generateSunoMusic).toBe('function')
    expect(typeof validateSunoMusicParams).toBe('function')
    expect(typeof createSunoPersona).toBe('function')
    expect(typeof validateSunoPersonaParams).toBe('function')
  })

  it('audio-task exports submit/poll/extract helpers', async () => {
    const { submitAudioTask, pollAudioTaskUntilDone, extractAudioUrl, extractVoiceId, extractPersonaId } =
      await import('@/lib/providers/evolink/audio-task')
    expect(typeof submitAudioTask).toBe('function')
    expect(typeof pollAudioTaskUntilDone).toBe('function')
    expect(typeof extractAudioUrl).toBe('function')
    expect(typeof extractVoiceId).toBe('function')
    expect(typeof extractPersonaId).toBe('function')
  })

  it('evolink catalog registers Suno and Qwen audio models', async () => {
    const { listEvolinkCatalogModels } = await import('@/lib/providers/evolink/catalog')
    const audioModels = listEvolinkCatalogModels('audio')
    expect(audioModels).toContain('qwen3-tts-vd')
    expect(audioModels).toContain('suno-v5-beta')
    expect(audioModels).toContain('suno-persona')
    // Legacy compat
    expect(audioModels).toContain('qwen3-tts-vd-2026-01-26')
  })

  it('voice design handler supports dual provider routing', async () => {
    // Just verify the module imports without error — logic tested in unit/worker
    const mod = await import('@/lib/workers/handlers/voice-design')
    expect(typeof mod.handleVoiceDesignTask).toBe('function')
  })
})
