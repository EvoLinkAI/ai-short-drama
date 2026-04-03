import * as React from 'react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

describe('SegmentedControl', () => {
  it('compact 布局 -> 输出左对齐的非拉伸结构', () => {
    Reflect.set(globalThis, 'React', React)

    const html = renderToStaticMarkup(
      createElement(SegmentedControl, {
        options: [
          { value: 'all', label: '全部 (24)' },
          { value: 'character', label: '角色 (11)' },
          { value: 'location', label: '场景 (13)' },
          { value: 'prop', label: '道具 (0)' },
        ],
        value: 'all',
        onChange: () => undefined,
        layout: 'compact',
      }),
    )

    expect(html).toContain('inline-block max-w-full')
    expect(html).toContain('inline-grid grid-flow-col auto-cols-[minmax(96px,max-content)]')
    expect(html).not.toContain('grid-template-columns:repeat(4,minmax(0,1fr))')
  })
})
