'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'
import type { VariantKey } from './shared'
import { createMockProjects } from './shared'
import VariantClearBreath from './VariantClearBreath'
import { LayoutGrid, LayoutScroll, LayoutList, LayoutFeatured, LayoutMinimalList } from './ProjectLayouts'

const LAYOUTS: { key: VariantKey; nameKey: string; descKey: string }[] = [
  { key: 'v1', nameKey: 'variantNames.v1', descKey: 'variantDescs.v1' },
  { key: 'v2', nameKey: 'variantNames.v2', descKey: 'variantDescs.v2' },
  { key: 'v3', nameKey: 'variantNames.v3', descKey: 'variantDescs.v3' },
  { key: 'v4', nameKey: 'variantNames.v4', descKey: 'variantDescs.v4' },
  { key: 'v5', nameKey: 'variantNames.v5', descKey: 'variantDescs.v5' },
]

export default function WorkspaceRedesignPage() {
  const t = useTranslations('workspaceRedesign')
  const [currentLayout, setCurrentLayout] = useState<VariantKey>('v1')
  const mockProjects = useMemo(() => createMockProjects(t), [t])

  if (process.env.NODE_ENV !== 'development') return null

  const currentInfo = LAYOUTS.find((l) => l.key === currentLayout)

  const renderLayout = () => {
    switch (currentLayout) {
      case 'v1': return <LayoutGrid projects={mockProjects} t={t} />
      case 'v2': return <LayoutScroll projects={mockProjects} t={t} />
      case 'v3': return <LayoutList projects={mockProjects} t={t} />
      case 'v4': return <LayoutFeatured projects={mockProjects} t={t} />
      case 'v5': return <LayoutMinimalList projects={mockProjects} t={t} />
    }
  }

  return (
    <div className="glass-page min-h-screen">
      {/* 排版切换器 */}
      <div className="sticky top-16 z-40 border-b border-[var(--glass-stroke-base)] bg-[var(--glass-bg-canvas)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-sm font-bold text-[var(--glass-text-primary)] flex-shrink-0">
                {t('pageTitle')}
              </h1>
              {currentInfo && (
                <span className="glass-chip glass-chip-info text-[10px] hidden sm:inline-flex">
                  {t(currentInfo.nameKey)} — {t(currentInfo.descKey)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {LAYOUTS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setCurrentLayout(l.key)}
                  title={`${t(l.nameKey)}: ${t(l.descKey)}`}
                  className={`glass-btn-base px-2.5 py-1.5 text-[11px] transition-all duration-200 whitespace-nowrap ${
                    currentLayout === l.key
                      ? 'glass-btn-primary'
                      : 'glass-btn-ghost hover:bg-[var(--glass-bg-muted)]'
                  }`}
                >
                  {t(l.nameKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 共用的输入框 + 可切换的底部排版 */}
      <VariantClearBreath key={currentLayout}>
        {renderLayout()}
      </VariantClearBreath>

      {/* 翻页按钮 */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={() => {
            const idx = LAYOUTS.findIndex((l) => l.key === currentLayout)
            if (idx > 0) setCurrentLayout(LAYOUTS[idx - 1].key)
          }}
          disabled={currentLayout === 'v1'}
          className="glass-btn-base glass-btn-secondary p-2 disabled:opacity-30"
        >
          <AppIcon name="chevronLeft" className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-[var(--glass-text-tertiary)]">
          {LAYOUTS.findIndex((l) => l.key === currentLayout) + 1}/{LAYOUTS.length}
        </span>
        <button
          onClick={() => {
            const idx = LAYOUTS.findIndex((l) => l.key === currentLayout)
            if (idx < LAYOUTS.length - 1) setCurrentLayout(LAYOUTS[idx + 1].key)
          }}
          disabled={currentLayout === 'v5'}
          className="glass-btn-base glass-btn-secondary p-2 disabled:opacity-30"
        >
          <AppIcon name="chevronRight" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
