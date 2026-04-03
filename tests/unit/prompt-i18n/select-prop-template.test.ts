import { describe, expect, it } from 'vitest'
import { getPromptTemplate, PROMPT_IDS } from '@/lib/prompt-i18n'

describe('select prop prompt template', () => {
  it('zh template restricts extraction to key story props and prefers omission when uncertain', () => {
    const template = getPromptTemplate(PROMPT_IDS.NP_SELECT_PROP, 'zh')

    expect(template).toContain('关键剧情道具资产分析师')
    expect(template).toContain('宁缺毋滥')
    expect(template).toContain('必须有明确剧情作用')
    expect(template).toContain('如果不确定它是否值得进入资产库，直接不输出')
    expect(template).toContain('仅因外观具体、名词明确，不足以成为关键道具')
  })

  it('en template restricts extraction to key story props and prefers omission when uncertain', () => {
    const template = getPromptTemplate(PROMPT_IDS.NP_SELECT_PROP, 'en')

    expect(template).toContain('key story prop extractor')
    expect(template).toContain('Be conservative')
    expect(template).toContain('explicit story function')
    expect(template).toContain('If you are unsure whether it deserves an asset entry, do not output it')
    expect(template).toContain('A specific-looking noun is not enough')
  })
})
