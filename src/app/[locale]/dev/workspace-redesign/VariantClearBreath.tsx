'use client'

/**
 * 清澈呼吸 — 输入区域
 * Apple 风格呼吸光晕 + 下拉标签选项
 * 底部排版由 page.tsx 注入
 */
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'
import { InlineSelector } from './InlineSelector'
import {
  STYLE_OPTIONS,
  RATIO_OPTIONS,
  QUALITY_OPTIONS,
} from './shared'

export default function VariantClearBreath({ children }: { children?: React.ReactNode }) {
  const t = useTranslations('workspaceRedesign')
  const [selectedStyle, setSelectedStyle] = useState('anime')
  const [selectedRatio, setSelectedRatio] = useState('16:9')
  const [selectedQuality, setSelectedQuality] = useState('high')
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* 自定义呼吸动画 */}
      <style>{`
        @keyframes breathe-drift-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          25% {
            transform: translate(30px, -20px) scale(1.15);
            opacity: 0.7;
          }
          50% {
            transform: translate(-20px, 15px) scale(0.95);
            opacity: 0.4;
          }
          75% {
            transform: translate(15px, 25px) scale(1.1);
            opacity: 0.65;
          }
        }
        @keyframes breathe-drift-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.45;
          }
          30% {
            transform: translate(-25px, 20px) scale(1.2);
            opacity: 0.7;
          }
          60% {
            transform: translate(20px, -15px) scale(0.9);
            opacity: 0.35;
          }
          80% {
            transform: translate(-10px, -25px) scale(1.05);
            opacity: 0.6;
          }
        }
        @keyframes breathe-drift-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1.05);
            opacity: 0.4;
          }
          20% {
            transform: translate(20px, 15px) scale(0.9);
            opacity: 0.55;
          }
          45% {
            transform: translate(-15px, -20px) scale(1.15);
            opacity: 0.7;
          }
          70% {
            transform: translate(10px, -10px) scale(1);
            opacity: 0.35;
          }
        }
      `}</style>

      <div className="flex flex-col items-center pt-[18vh] pb-12 px-4 max-w-3xl mx-auto w-full">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-2">
            ✨ {t('quickActions.title')}
          </h1>
          <p className="text-sm text-[var(--glass-text-tertiary)]">{t('inputPlaceholder')}</p>
        </div>

        {/* 呼吸光晕容器 */}
        <div className="w-full relative group">
          <div
            className="absolute -inset-10 rounded-[48px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(6, 182, 212, 0.4), transparent 70%)',
              animation: 'breathe-drift-1 8s ease-in-out infinite',
              filter: 'blur(30px)',
            }}
          />
          <div
            className="absolute -inset-10 rounded-[48px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 80% at 70% 60%, rgba(139, 92, 246, 0.35), transparent 70%)',
              animation: 'breathe-drift-2 10s ease-in-out infinite',
              filter: 'blur(35px)',
            }}
          />
          <div
            className="absolute -inset-12 rounded-[56px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59, 130, 246, 0.3), transparent 70%)',
              animation: 'breathe-drift-3 12s ease-in-out infinite',
              filter: 'blur(40px)',
            }}
          />

          <div className="relative w-full glass-surface-elevated rounded-2xl overflow-hidden">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('inputPlaceholder')}
              rows={4}
              className="w-full bg-transparent border-none outline-none text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)] text-base resize-none p-5 pb-2"
            />
            <div className="flex items-center justify-between gap-2 px-5 pb-4">
              <div className="flex items-center gap-2">
                <InlineSelector label={t('style')} selectedId={selectedStyle} options={STYLE_OPTIONS} onSelect={setSelectedStyle} renderLabel={(o) => `${o.emoji ?? ''} ${t(o.labelKey)}`} />
                <InlineSelector label={t('ratio')} selectedId={selectedRatio} options={RATIO_OPTIONS} onSelect={setSelectedRatio} renderLabel={(o) => t(o.labelKey)} />
                <InlineSelector label={t('quality')} selectedId={selectedQuality} options={QUALITY_OPTIONS} onSelect={setSelectedQuality} renderLabel={(o) => t(o.labelKey)} />
              </div>
              <button className="glass-btn-base glass-btn-primary px-5 py-2 text-sm flex-shrink-0">
                {t('startCreation')}
                <AppIcon name="arrowRight" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 底部排版内容 — 由外部注入 */}
      {children}
    </div>
  )
}
