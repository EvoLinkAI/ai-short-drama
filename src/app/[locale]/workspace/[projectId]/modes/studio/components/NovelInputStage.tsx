'use client'

/**
 * 小说推文模式 - 故事输入阶段 (Story View)
 * V3.2 UI: 极简版，专注剧本输入，资产管理移至资产库
 */

import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect, useCallback } from 'react'
import '@/styles/animations.css'
import { ART_STYLES, VIDEO_RATIOS } from '@/lib/constants'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'
import { trackEvent } from '@/lib/analytics'
import { RatioSelector, StyleSelector } from '@/components/selectors/RatioStyleSelectors'

/** 触发智能分集建议的字数阈值 */
const LONG_TEXT_THRESHOLD = 1000



interface NovelInputStageProps {
  // 核心数据
  novelText: string
  // 当前剧集名称
  episodeName?: string
  // 回调函数
  onNovelTextChange: (value: string) => void
  onNext: () => void
  /** 触发智能分集流程（携带当前文本） */
  onSmartSplit?: (text: string) => void
  // 状态
  isSubmittingTask?: boolean
  isSwitchingStage?: boolean
  // 旁白开关
  enableNarration?: boolean
  onEnableNarrationChange?: (enabled: boolean) => void
  // 配置项 - 比例与风格
  videoRatio?: string
  artStyle?: string
  onVideoRatioChange?: (value: string) => void
  onArtStyleChange?: (value: string) => void
}

export default function NovelInputStage({
  novelText,
  episodeName,
  onNovelTextChange,
  onNext,
  onSmartSplit,
  isSubmittingTask = false,
  isSwitchingStage = false,
  enableNarration = false,
  onEnableNarrationChange,
  videoRatio = '9:16',
  artStyle = 'american-comic',
  onVideoRatioChange,
  onArtStyleChange
}: NovelInputStageProps) {
  const t = useTranslations('studio')

  // ── IME 组合输入处理 ──
  // 中文/日文/韩文输入法在组合（composing）期间会持续触发 onChange，
  // 如果此时同步到父组件（触发 API 请求 + React Query invalidation），
  // 服务端返回的旧数据会覆盖当前输入，导致拼音跳动。
  // 解决方案：组合期间仅更新本地 state，组合结束后再同步到父组件。
  const isComposingRef = useRef(false)
  const [localText, setLocalText] = useState(novelText)

  // 当父组件的 novelText 变化（非本地编辑触发）时，同步到本地 state
  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalText(novelText)
    }
  }, [novelText])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalText(newValue)
    // 仅在非 IME 组合状态下才同步到父组件
    if (!isComposingRef.current) {
      onNovelTextChange(newValue)
    }
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false
    // 组合结束，将最终文本同步到父组件
    onNovelTextChange(e.currentTarget.value)
  }

  const hasContent = localText.trim().length > 0
  const [showLongTextPrompt, setShowLongTextPrompt] = useState(false)

  /** 点击"开始创作"时，先检测文本长度 */
  const handleStartClick = useCallback(() => {
    trackEvent('novel_import')
    const textLength = localText.trim().length
    if (textLength > LONG_TEXT_THRESHOLD && onSmartSplit) {
      setShowLongTextPrompt(true)
    } else {
      onNext()
    }
  }, [localText, onNext, onSmartSplit])

  // 当前配置展示文案
  const ratioDisplayLabel = (VIDEO_RATIOS.find((option) => option.value === videoRatio) ?? VIDEO_RATIOS[0])?.label
  const artStyleDisplayLabel = (ART_STYLES.find((option) => option.value === artStyle) ?? ART_STYLES[0])?.label

  // 不同比例适合的素材类型文案映射（完整句子，用于 info 悬浮层）
  const ratioUsageTextMap: Record<string, string> = {
    '1:1': t('storyInput.ratioUsage.1_1'),
    '9:16': t('storyInput.ratioUsage.9_16'),
    '16:9': t('storyInput.ratioUsage.16_9'),
    '4:3': t('storyInput.ratioUsage.4_3'),
    '3:4': t('storyInput.ratioUsage.3_4'),
    '2:3': t('storyInput.ratioUsage.2_3'),
    '3:2': t('storyInput.ratioUsage.3_2'),
    '4:5': t('storyInput.ratioUsage.4_5'),
    '5:4': t('storyInput.ratioUsage.5_4'),
    '21:9': t('storyInput.ratioUsage.21_9'),
  }

  // 下拉中使用的简短标签（低信息密度）
  const ratioUsageTagMap: Record<string, string> = {
    '1:1': t('storyInput.ratioUsageTag.1_1'),
    '9:16': t('storyInput.ratioUsageTag.9_16'),
    '16:9': t('storyInput.ratioUsageTag.16_9'),
    '4:3': t('storyInput.ratioUsageTag.4_3'),
    '3:4': t('storyInput.ratioUsageTag.3_4'),
    '2:3': t('storyInput.ratioUsageTag.2_3'),
    '3:2': t('storyInput.ratioUsageTag.3_2'),
    '4:5': t('storyInput.ratioUsageTag.4_5'),
    '5:4': t('storyInput.ratioUsageTag.5_4'),
    '21:9': t('storyInput.ratioUsageTag.21_9'),
  }

  const getRatioUsageText = (ratio: string): string =>
    ratioUsageTextMap[ratio] ?? t('storyInput.videoRatioHint')

  const getRatioUsageTag = (ratio: string): string =>
    ratioUsageTagMap[ratio] ?? ''

  const ratioUsageText = getRatioUsageText(videoRatio)
  const stageSwitchingState = isSwitchingStage
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'text',
      hasOutput: false,
    })
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* 当前编辑剧集提示 - 顶部居中醒目显示 */}
      {episodeName && (
        <div className="text-center py-1">
          <div className="text-lg font-semibold text-[var(--glass-text-primary)]">
            {t("storyInput.currentEditing", { name: episodeName })}
          </div>
          <div className="text-sm text-[var(--glass-text-tertiary)] mt-1">{t("storyInput.editingTip")}</div>
        </div>
      )}

      {/* 主输入区域（含底部工具栏） */}
      <div className="glass-surface-elevated overflow-hidden relative z-10">
        <div className="p-6 pb-0">
          {/* 字数统计 */}
          <div className="flex items-center justify-end mb-3">
            <span className="glass-chip glass-chip-neutral text-xs">
              {t("storyInput.wordCount")} {localText.length}
            </span>
          </div>

          {/* 剧本输入框 */}
          <textarea
            value={localText}
            onChange={handleTextChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={t('storyInput.placeholder')}
            className="glass-textarea-base custom-scrollbar h-80 px-4 py-3 text-base resize-none placeholder:text-[var(--glass-text-tertiary)]"
            disabled={isSubmittingTask || isSwitchingStage}
          />
        </div>

        {/* 底部工具栏：比例 + 风格 + 开始创作（内嵌在输入框卡片内） */}
        <div className="flex items-end gap-3 px-6 py-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-[160px] flex-shrink-0">
              <RatioSelector
                value={videoRatio}
                onChange={(value) => onVideoRatioChange?.(value)}
                options={VIDEO_RATIOS.map((option) => ({
                  ...option,
                  recommended: option.value === '9:16'
                }))}
                getUsage={getRatioUsageTag}
              />
            </div>
            <div className="w-[160px] flex-shrink-0">
              <StyleSelector
                value={artStyle}
                onChange={(value) => onArtStyleChange?.(value)}
                options={ART_STYLES.map((option) => ({
                  ...option,
                  recommended: option.value === 'realistic'
                }))}
              />
            </div>
          </div>
          <button
            onClick={handleStartClick}
            disabled={!hasContent || isSubmittingTask || isSwitchingStage}
            className="glass-btn-base glass-btn-primary px-5 py-2.5 text-sm flex-shrink-0 disabled:opacity-50 flex items-center gap-2"
          >
            {isSwitchingStage ? (
              <TaskStatusInline state={stageSwitchingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              <>
                <span>{t("smartImport.manualCreate.button")}</span>
                <AppIcon name="arrowRight" className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 配置提示 */}
        <div className="px-6 pb-4 space-y-1 text-center">
          <p className="text-xs text-[var(--glass-text-secondary)]">
            {t("storyInput.currentConfigSummary", {
              ratio: ratioDisplayLabel,
              style: artStyleDisplayLabel
            })}
          </p>
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {t("storyInput.moreConfig")}
          </p>
        </div>
      </div>

      {/* 资产库引导提示 */}
      <div className="glass-surface p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 glass-surface-soft rounded-xl flex items-center justify-center flex-shrink-0">
            <AppIcon name="folderCards" className="w-5 h-5 text-[var(--glass-text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--glass-text-secondary)] mb-1">{t("storyInput.assetLibraryTip.title")}</div>
            <p className="text-sm text-[var(--glass-text-tertiary)] leading-relaxed">
              {t("storyInput.assetLibraryTip.description")}
            </p>
          </div>
        </div>
      </div>

      {/* 旁白开关 */}
      {onEnableNarrationChange && (
        <div className="glass-surface p-6">
          <div className="glass-surface-soft flex items-center justify-between p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] font-semibold text-sm">VO</span>
              <div>
                <div className="font-medium text-[var(--glass-text-primary)]">{t("storyInput.narration.title")}</div>
                <div className="text-xs text-[var(--glass-text-tertiary)]">{t("storyInput.narration.description")}</div>
              </div>
            </div>
            <button
              onClick={() => onEnableNarrationChange(!enableNarration)}
              className={`relative w-14 h-8 rounded-full transition-colors ${enableNarration
                ? 'bg-[var(--glass-accent-from)]'
                : 'bg-[var(--glass-stroke-strong)]'
                }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-[var(--glass-bg-surface)] rounded-full shadow-sm transition-transform ${enableNarration ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 长文本检测 — 智能分集强引导弹窗 */}
      {showLongTextPrompt && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 relative">
            {/* 渐变描边外壳 */}
            <div
              className="rounded-2xl p-[1.5px]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)' }}
            >
              <div className="glass-surface-modal rounded-2xl p-6 space-y-5">
                {/* 标题行 */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))' }}
                  >
                    <AppIcon name="sparkles" className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--glass-text-primary)]">
                    {t('storyInput.longTextDetection.title')}
                  </h3>
                </div>

                {/* 描述 */}
                <p className="text-sm text-[var(--glass-text-secondary)] leading-relaxed">
                  {t('storyInput.longTextDetection.description', { count: localText.trim().length.toLocaleString() })}
                </p>

                {/* 强烈推荐文案 */}
                <div
                  className="p-4 rounded-xl text-sm leading-relaxed"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))' }}
                >
                  <p
                    className="font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t('storyInput.longTextDetection.strongRecommend')}
                  </p>
                </div>

                {/* 按钮区域 */}
                <div className="flex flex-col gap-3 pt-1">
                  {/* 智能分集 — 主按钮 */}
                  <button
                    onClick={() => {
                      setShowLongTextPrompt(false)
                      onSmartSplit?.(localText)
                    }}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}
                  >
                    <AppIcon name="sparkles" className="w-5 h-5" />
                    <span>{t('storyInput.longTextDetection.smartSplit')}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {t('storyInput.longTextDetection.smartSplitRecommend')}
                    </span>
                  </button>

                  {/* 直接创作 — 弱化按钮 */}
                  <button
                    onClick={() => {
                      setShowLongTextPrompt(false)
                      onNext()
                    }}
                    className="w-full py-2.5 text-sm text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] transition-colors"
                  >
                    {t('storyInput.longTextDetection.continueAnyway')}
                    <span className="text-xs ml-1 opacity-60">
                      — {t('storyInput.longTextDetection.singleEpisodeWarning')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
