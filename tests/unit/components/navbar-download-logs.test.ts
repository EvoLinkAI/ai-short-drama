import * as React from 'react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import Navbar from '@/components/Navbar'

const useSessionMock = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}))

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string } & Record<string, unknown>) => createElement('img', { alt, ...props }),
}))

vi.mock('@/components/LanguageSwitcher', () => ({
  default: () => createElement('div', null, 'LanguageSwitcher'),
}))

vi.mock('@/hooks/common/useGithubReleaseUpdate', () => ({
  useGithubReleaseUpdate: () => ({
    currentVersion: '0.3.0',
    update: null,
    shouldPulse: false,
    showModal: false,
    openModal: () => undefined,
    closeModal: () => undefined,
  }),
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: { pathname: string } | string; children: React.ReactNode } & Record<string, unknown>) => {
    const hrefStr = typeof href === 'object' ? href.pathname : href
    return createElement('a', { href: hrefStr, ...rest }, children)
  },
}))

const messages: AbstractIntlMessages = {
  nav: { workspace: '工作区', assetHub: '资产中心', signin: '登录', signup: '注册' },
  common: {},
}

function renderWithIntl(element: React.ReactElement): string {
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, { locale: 'zh', messages } as never, element),
  )
}

describe('Navbar AiDrama branding', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Reflect.set(globalThis, 'React', React)
  })

  it('renders AiDrama brand text and workspace links for signed-in users', () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Earth' } },
      status: 'authenticated',
    })

    const html = renderWithIntl(createElement(Navbar))

    expect(html).toContain('AiDrama')
    expect(html).toContain('href="/workspace"')
    expect(html).toContain('工作区')
    expect(html).toContain('资产中心')
  })

  it('renders sign-in / sign-up for signed-out users', () => {
    useSessionMock.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const html = renderWithIntl(createElement(Navbar))

    expect(html).toContain('AiDrama')
    expect(html).toContain('登录')
    expect(html).toContain('注册')
    expect(html).not.toContain('工作区')
  })
})
