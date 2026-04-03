import * as React from 'react'
import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import LLMStageStreamCard from '@/components/llm-console/LLMStageStreamCard'

const messages = {
  progress: {
    status: {
      completed: '已完成',
      failed: '失败',
      processing: '进行中',
      queued: '排队中',
      pending: '未开始',
    },
    stageCard: {
      stage: '阶段',
      realtimeStream: '实时流',
      currentStage: '当前阶段',
      outputTitle: 'AI 实时输出 · {stage}',
      waitingModelOutput: '等待模型输出...',
      reasoningNotProvided: '该步骤未返回思考过程',
    },
    streamStep: {
      analyzeProps: '道具分析',
    },
    runtime: {
      llm: {
        processing: '模型处理中...',
      },
    },
  },
} as const

const renderWithIntl = (node: ReactElement) => {
  const providerProps: ComponentProps<typeof NextIntlClientProvider> = {
    locale: 'zh',
    messages: messages as unknown as AbstractIntlMessages,
    timeZone: 'Asia/Shanghai',
    children: node,
  }

  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, providerProps),
  )
}

describe('LLMStageStreamCard error rendering', () => {
  it('renders the error without any feedback action entry', () => {
    Reflect.set(globalThis, 'React', React)
    const html = renderWithIntl(
      createElement(LLMStageStreamCard, {
        title: '内容到剧本',
        stages: [{
          id: 'story_to_script',
          title: '内容到剧本',
          status: 'failed',
          progress: 0,
        }],
        activeStageId: 'story_to_script',
        outputText: '',
        errorMessage: 'Failed to fetch',
      }),
    )

    expect(html).toContain('Failed to fetch')
    expect(html).not.toContain('复制错误详情')
    expect(html).not.toContain('打开问题反馈表单')
    expect(html).not.toContain('Copy error detail')
    expect(html).not.toContain('Open feedback form')
  })

  it('resolves analyze props progress keys without missing message errors', () => {
    Reflect.set(globalThis, 'React', React)
    const html = renderWithIntl(
      createElement(LLMStageStreamCard, {
        title: 'progress.streamStep.analyzeProps',
        stages: [{
          id: 'analyze_props',
          title: 'progress.streamStep.analyzeProps',
          subtitle: 'progress.streamStep.analyzeProps',
          status: 'processing',
          progress: 35,
        }],
        activeStageId: 'analyze_props',
        activeMessage: 'progress.streamStep.analyzeProps',
        outputText: '',
      }),
    )

    expect(html).toContain('道具分析')
    expect(html).not.toContain('progress.streamStep.analyzeProps')
    expect(html).not.toContain('MISSING_MESSAGE')
  })
})
