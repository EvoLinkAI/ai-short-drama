import * as React from 'react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import HomePage from '@/app/[locale]/home/page'
import {
  HOME_QUICK_START_MIN_ROWS,
  resolveTextareaTargetHeight,
} from '@/lib/home/quick-start-textarea'

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Earth' } },
    status: 'authenticated',
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}))

vi.mock('@/components/Navbar', () => ({
  default: () => createElement('nav', null, 'Navbar'),
}))

vi.mock('@/components/ui/icons', () => ({
  AppIcon: ({ name, ...props }: { name: string } & Record<string, unknown>) =>
    createElement('span', { ...props, 'data-icon': name }),
  IconGradientDefs: (props: Record<string, unknown>) => createElement('span', props),
}))

vi.mock('@/components/selectors/RatioStyleSelectors', () => ({
  RatioSelector: (props: Record<string, unknown>) => createElement('div', props, 'RatioSelector'),
  StyleSelector: (props: Record<string, unknown>) => createElement('div', props, 'StyleSelector'),
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string }
    children: React.ReactNode
  } & Record<string, unknown>) => {
    const resolvedHref = typeof href === 'string' ? href : href.pathname
    return createElement('a', { href: resolvedHref, ...props }, children)
  },
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/lib/api-fetch', () => ({
  apiFetch: vi.fn(),
}))

vi.mock('@/lib/home/create-project-launch', () => ({
  createHomeProjectLaunch: vi.fn(),
}))

describe('resolveTextareaTargetHeight', () => {
  it('keeps the home quick-start input at least three rows tall', () => {
    expect(resolveTextareaTargetHeight({
      minHeight: 96,
      maxHeight: 320,
      scrollHeight: 54,
    })).toBe(96)
  })

  it('caps the auto-resized height to the viewport ceiling', () => {
    expect(resolveTextareaTargetHeight({
      minHeight: 96,
      maxHeight: 180,
      scrollHeight: 240,
    })).toBe(180)
  })
})

describe('HomePage quick-start input', () => {
  it('renders the homepage textarea with a default three-row height baseline', () => {
    Reflect.set(globalThis, 'React', React)

    const html = renderToStaticMarkup(createElement(HomePage))

    expect(HOME_QUICK_START_MIN_ROWS).toBe(3)
    expect(html).toContain('rows="3"')
  })
})
