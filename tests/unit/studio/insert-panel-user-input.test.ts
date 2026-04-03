import { describe, expect, it } from 'vitest'
import { resolveInsertPanelUserInput } from '@/lib/studio/insert-panel'

describe('insert panel user input normalization', () => {
  it('uses localized default instruction when AI analyze sends empty input', () => {
    expect(resolveInsertPanelUserInput({ userInput: '' }, 'zh')).toBe(
      '请根据前后镜头自动分析并插入一个自然衔接的新分镜。',
    )
    expect(resolveInsertPanelUserInput({ userInput: '   ' }, 'en')).toBe(
      'Automatically analyze the surrounding panels and insert a naturally connected new panel.',
    )
  })

  it('prefers explicit user input over fallback prompt or default', () => {
    expect(resolveInsertPanelUserInput({
      userInput: '  添加一个特写反应镜头  ',
      prompt: 'unused prompt',
    }, 'zh')).toBe('添加一个特写反应镜头')
  })

  it('falls back to prompt when userInput is missing', () => {
    expect(resolveInsertPanelUserInput({
      prompt: '  Insert a pause beat between these panels.  ',
    }, 'en')).toBe('Insert a pause beat between these panels.')
  })
})
