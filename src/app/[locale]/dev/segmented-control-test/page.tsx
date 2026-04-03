'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'

// ─── 演示选项 ─────────────────────────────────────────
const demoTabs = [
  { value: 'all', label: '全部' },
  { value: 'character', label: '角色' },
  { value: 'location', label: '场景' },
  { value: 'prop', label: '道具' },
]

const demoTabsWithCount = [
  { value: 'all', label: '全部 (24)' },
  { value: 'character', label: '角色 (12)' },
  { value: 'location', label: '场景 (8)' },
  { value: 'prop', label: '道具 (4)' },
]

// ─── 原始版本 (Current) ──────────────────────────────────
function SegmentedCurrent({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-lg p-[3px] bg-[#f2f2f7] dark:bg-[#1c1c1e] shadow-inner">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all cursor-pointer ${value === opt.value
              ? 'bg-white text-[var(--glass-text-primary)] dark:bg-[#2c2c2e] dark:text-white shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)] font-bold'
              : 'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 方案 A: 滑动指示器 (Sliding Pill) ──────────────────
function SegmentedSlidingPill({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      })
    }
  }, [value, options])

  return (
    <div className="rounded-xl p-[3px] bg-[#e8e8ed] dark:bg-[#1c1c1e]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <div
          className="absolute top-0 bottom-0 rounded-[10px] bg-white dark:bg-[#3a3a3c] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 cursor-pointer ${value === opt.value
              ? 'text-[#1d1d1f] dark:text-white'
              : 'text-[#86868b] hover:text-[#6e6e73]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 方案 B: 渐变下划线 (Gradient Underline) ────────────
function SegmentedGradientUnderline({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lineStyle, setLineStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setLineStyle({
        left: activeButton.offsetLeft + 8,
        width: activeButton.offsetWidth - 16,
      })
    }
  }, [value, options])

  return (
    <div className="relative">
      <div ref={containerRef} className="flex items-center gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-[#1d1d1f] dark:text-white'
              : 'text-[#86868b] hover:text-[#6e6e73] dark:text-[#98989d] dark:hover:text-[#b0b0b5]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* 渐变下划线 */}
      <div
        className="absolute bottom-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: lineStyle.left, width: lineStyle.width }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#e5e5ea] dark:bg-[#38383a]" />
    </div>
  )
}

// ─── 方案 C: 胶囊按钮组 (Capsule Group) ─────────────────
function SegmentedCapsule({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#f5f5f7]/80 dark:bg-[#1c1c1e]/80 backdrop-blur-sm border border-[#e5e5ea]/60 dark:border-[#38383a]/60">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative px-3 py-1.5 text-[13px] font-semibold rounded-full transition-all duration-250 cursor-pointer ${value === opt.value
            ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
            : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#e8e8ed]/60 dark:text-[#98989d] dark:hover:text-white dark:hover:bg-[#2c2c2e]'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── 方案 D: 霓虹卡片 (Neon Card) ───────────────────────
function SegmentedNeonCard({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      })
    }
  }, [value, options])

  return (
    <div className="rounded-2xl p-[3px] bg-[#f0f0f5] dark:bg-[#0d0d0f] border border-[#e0e0e5] dark:border-[#2a2a2e]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <div
          className="absolute top-0 bottom-0 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]'
              : 'text-[#86868b] hover:text-[#6e6e73] dark:text-[#68686e] dark:hover:text-[#98989d]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 方案 E: 玻璃态 (Glassmorphism) ─────────────────────
function SegmentedGlass({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      })
    }
  }, [value, options])

  return (
    <div className="rounded-2xl p-[3px] bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <div
          className="absolute top-0 bottom-0 rounded-xl bg-white/70 dark:bg-white/[0.12] backdrop-blur-md border border-white/60 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-[#1d1d1f] dark:text-white'
              : 'text-[#86868b]/70 hover:text-[#6e6e73] dark:text-white/35 dark:hover:text-white/55'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 方案 F: 浮雕质感 (Embossed) ────────────────────────
function SegmentedEmbossed({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-[2px] p-[3px] rounded-xl bg-gradient-to-b from-[#e4e4e8] to-[#d8d8dc] dark:from-[#1a1a1e] dark:to-[#141418] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.04)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center justify-center px-3 py-1.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 cursor-pointer ${value === opt.value
            ? 'bg-gradient-to-b from-white to-[#f8f8fa] dark:from-[#3a3a3e] dark:to-[#2e2e32] text-[#1d1d1f] dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]'
            : 'text-[#86868b] hover:text-[#6e6e73] dark:text-[#68686e] dark:hover:text-[#98989d]'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 🆕 Round 2: 基于 Sliding Pill + Neon Card + Glass 融合
// ═══════════════════════════════════════════════════════════

// ─── 方案 G: 玻璃霓虹滑块 (Glass Neon Slide) ────────────
// 融合: Glass 的半透明底 + Neon 的渐变发光指示器 + Pill 的滑动动画
function SegmentedGlassNeonSlide({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
  }, [value, options])

  return (
    <div className="rounded-2xl p-[3px] bg-white/30 dark:bg-white/[0.04] backdrop-blur-xl border border-white/40 dark:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <div
          className="absolute top-0 bottom-0 rounded-xl transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(139,92,246,0.85) 50%, rgba(168,85,247,0.85) 100%)',
            boxShadow: '0 0 16px rgba(99,102,241,0.25), 0 0 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
              : 'text-[#86868b]/80 hover:text-[#6e6e73] dark:text-white/30 dark:hover:text-white/50'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 方案 H: 极光药丸 (Aurora Pill) ─────────────────────
// 融合: Pill 的圆润滑动 + 极光渐变边框 + Glass 的通透感
function SegmentedAuroraPill({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
  }, [value, options])

  return (
    <div className="rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899, #6366f1)' }}>
      <div className="rounded-full p-[2px] bg-[#f5f5f7] dark:bg-[#141418]">
        <div className="rounded-full bg-[#f5f5f7]/90 dark:bg-[#141418]/90 backdrop-blur-sm">
          <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
            <div
              className="absolute inset-y-0 rounded-full transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            >
              <div className="h-full rounded-full p-[1.5px]" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' }}>
                <div className="h-full rounded-full bg-white dark:bg-[#2a2a2e] shadow-[0_2px_8px_rgba(99,102,241,0.2)]" />
              </div>
            </div>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${value === opt.value
                  ? 'text-[#1d1d1f] dark:text-white'
                  : 'text-[#86868b] hover:text-[#6e6e73] dark:text-[#68686e] dark:hover:text-[#98989d]'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 方案 I: 冰晶霓虹 (Ice Neon) ────────────────────────
// 融合: Neon 的发光效果 + 冷调蓝色渐变 + Pill 的弹性滑动 + Glass 的边框
function SegmentedIceNeon({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
  }, [value, options])

  return (
    <div className="rounded-xl p-[3px] bg-[#eef2ff] dark:bg-[#0c0a1a] border border-[#c7d2fe]/50 dark:border-[#312e81]/40 shadow-[0_1px_12px_rgba(99,102,241,0.06)] dark:shadow-[0_1px_12px_rgba(99,102,241,0.08)]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <div
          className="absolute top-0 bottom-0 rounded-[10px] transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 40%, #8b5cf6 100%)',
            boxShadow: '0 0 14px rgba(59,130,246,0.3), 0 0 28px rgba(99,102,241,0.12), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]'
              : 'text-[#6366f1]/60 hover:text-[#6366f1]/80 dark:text-[#818cf8]/40 dark:hover:text-[#818cf8]/60'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 方案 J: 磨砂药丸 (Frosted Pill) ────────────────────
// 融合: Pill 的弹性滑动 + Glass 的磨砂质感 + 微妙的内阴影
function SegmentedFrostedPill({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
  }, [value, options])

  return (
    <div className="rounded-2xl p-[3px] bg-[#e5e5ea]/60 dark:bg-[#1c1c1e]/80 backdrop-blur-md shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.03)]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <div
          className="absolute top-0 bottom-0 rounded-xl bg-white dark:bg-[#2c2c2e] backdrop-blur-sm transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 6px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-[#1d1d1f] dark:text-white font-bold'
              : 'text-[#86868b]/70 hover:text-[#6e6e73] dark:text-white/30 dark:hover:text-white/50 font-medium'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 方案 K: 星辰玻璃 (Stellar Glass) ───────────────────
// 融合: 深色渐变底 + Glass 的通透指示器 + Neon 的微光边缘 + Pill 的滑动
function SegmentedStellarGlass({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
  }, [value, options])

  return (
    <div
      className="rounded-2xl p-[3px] border border-[#c7d2fe]/20 dark:border-[#4338ca]/25"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%)' }}
    >
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <div
          className="absolute top-0 bottom-0 rounded-xl transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 0 12px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]'
              : 'text-[#a5b4fc]/40 hover:text-[#a5b4fc]/60'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 🏆 Final Round: 最终候选 — 对齐当前系统 px-3 py-1.5 间距
// ═══════════════════════════════════════════════════════════

// ─── Final 1: 滑动药丸 (Sliding Pill Final) ─────────────
// 与当前系统对等的 px-3 py-1.5 按钮间距
function SegmentedSlidingPillFinal({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
  }, [value, options])

  return (
    <div className="rounded-lg p-[3px] bg-[#e8e8ed] dark:bg-[#1c1c1e]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {/* 指示器放在 grid 内部，与按钮共享定位参考系 */}
        <div
          className="absolute top-0 bottom-0 rounded-md bg-white dark:bg-[#3a3a3c] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 cursor-pointer ${value === opt.value
              ? 'text-[var(--glass-text-primary)] dark:text-white font-bold'
              : 'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Final 2: 蓝色霓虹 (Blue Neon Final) ────────────────
// 蓝色渐变 + 与当前系统对等的 px-3 py-1.5 按钮间距
function SegmentedBlueNeonFinal({ options, value, onChange }: {
  options: Array<{ value: string; label: ReactNode }>
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const activeIndex = options.findIndex((opt) => opt.value === value)
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
  }, [value, options])

  return (
    <div className="rounded-lg p-[3px] bg-[#f0f0f5] dark:bg-[#0d0d0f] border border-[#e0e0e5] dark:border-[#2a2a2e]">
      <div ref={containerRef} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {/* 指示器放在 grid 内部，与按钮共享定位参考系 */}
        <div
          className="absolute top-0 bottom-0 rounded-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
            boxShadow: '0 0 12px rgba(59,130,246,0.25), 0 0 24px rgba(37,99,235,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-200 cursor-pointer ${value === opt.value
              ? 'text-white font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]'
              : 'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 页面 ─────────────────────────────────────────────
export default function SegmentedControlTestPage() {
  const [v1, setV1] = useState('all')
  const [v2, setV2] = useState('all')
  const [v3, setV3] = useState('all')
  const [v4, setV4] = useState('all')
  const [v5, setV5] = useState('all')
  const [v6, setV6] = useState('all')

  // 带计数的独立状态
  const [v1c, setV1c] = useState('all')
  const [v2c, setV2c] = useState('all')
  const [v3c, setV3c] = useState('all')
  const [v4c, setV4c] = useState('all')
  const [v5c, setV5c] = useState('all')
  const [v6c, setV6c] = useState('all')

  // Round 2 状态
  const [vG, setVG] = useState('all')
  const [vH, setVH] = useState('all')
  const [vI, setVI] = useState('all')
  const [vJ, setVJ] = useState('all')
  const [vK, setVK] = useState('all')
  const [vGc, setVGc] = useState('all')
  const [vHc, setVHc] = useState('all')
  const [vIc, setVIc] = useState('all')
  const [vJc, setVJc] = useState('all')
  const [vKc, setVKc] = useState('all')

  // Final 状态
  const [vF1, setVF1] = useState('all')
  const [vF2, setVF2] = useState('all')
  const [vF1c, setVF1c] = useState('all')
  const [vF2c, setVF2c] = useState('all')

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] dark:from-[#0a0a0c] dark:to-[#141418] p-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white">
            SegmentedControl 样式对比
          </h1>
          <p className="text-[#86868b] text-sm">
            共 13 种方案 · Round 1 (A-F) + Round 2 (G-K) + 🏆 Final (2) · 每种方案展示简约版和带计数版
          </p>
        </div>

        {/* ─── 0. Current (原始) ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-[#86868b]/10 text-[#86868b] text-xs font-bold tracking-wider">CURRENT</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">当前版本 · iOS Segmented</h2>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedCurrent options={demoTabs} value={v1} onChange={setV1} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedCurrent options={demoTabsWithCount} value={v1c} onChange={setV1c} />
            </div>
          </div>
        </section>

        {/* ─── A. Sliding Pill ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider">A</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">滑动药丸 · Sliding Pill</h2>
            <span className="text-xs text-[#86868b]">平滑的滑动动画指示器</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedSlidingPill options={demoTabs} value={v2} onChange={setV2} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedSlidingPill options={demoTabsWithCount} value={v2c} onChange={setV2c} />
            </div>
          </div>
        </section>

        {/* ─── B. Gradient Underline ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold tracking-wider">B</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">渐变下划线 · Gradient Underline</h2>
            <span className="text-xs text-[#86868b]">紫色渐变下划线指示器, 极简风格</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedGradientUnderline options={demoTabs} value={v3} onChange={setV3} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedGradientUnderline options={demoTabsWithCount} value={v3c} onChange={setV3c} />
            </div>
          </div>
        </section>

        {/* ─── C. Capsule ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider">C</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">胶囊按钮 · Capsule Group</h2>
            <span className="text-xs text-[#86868b]">黑白反转, 胶囊形态</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedCapsule options={demoTabs} value={v4} onChange={setV4} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedCapsule options={demoTabsWithCount} value={v4c} onChange={setV4c} />
            </div>
          </div>
        </section>

        {/* ─── D. Neon Card ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wider">D</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">霓虹卡片 · Neon Card</h2>
            <span className="text-xs text-[#86868b]">渐变紫色指示器, 发光效果</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedNeonCard options={demoTabs} value={v5} onChange={setV5} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedNeonCard options={demoTabsWithCount} value={v5c} onChange={setV5c} />
            </div>
          </div>
        </section>

        {/* ─── E. Glass ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold tracking-wider">E</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">毛玻璃 · Glassmorphism</h2>
            <span className="text-xs text-[#86868b]">半透明毛玻璃质感, 融入背景</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedGlass options={demoTabs} value={v6} onChange={setV6} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedGlass options={demoTabsWithCount} value={v6c} onChange={setV6c} />
            </div>
          </div>
        </section>

        {/* ─── F. Embossed ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wider">F</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">浮雕质感 · Embossed</h2>
            <span className="text-xs text-[#86868b]">微妙的渐变 + 浮雕阴影, 精致的立体感</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedEmbossed options={demoTabs} value={v1} onChange={setV1} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedEmbossed options={demoTabsWithCount} value={v1c} onChange={setV1c} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 🆕 Round 2: 融合变体 */}
        {/* ═══════════════════════════════════════════════════ */}

        <div className="text-center space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366f1]/10 via-[#a855f7]/10 to-[#ec4899]/10 border border-[#6366f1]/20">
            <span className="text-sm font-bold text-[#6366f1] dark:text-[#818cf8]">🆕 Round 2</span>
            <span className="text-xs text-[#86868b]">基于 Sliding Pill + Neon Card + Glass 融合</span>
          </div>
        </div>

        {/* ─── G. Glass Neon Slide ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold tracking-wider">G</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">玻璃霓虹滑块 · Glass Neon Slide</h2>
            <span className="text-xs text-[#86868b]">Glass 半透明底 + Neon 渐变发光 + 弹性滑动</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedGlassNeonSlide options={demoTabs} value={vG} onChange={setVG} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedGlassNeonSlide options={demoTabsWithCount} value={vGc} onChange={setVGc} />
            </div>
          </div>
        </section>

        {/* ─── H. Aurora Pill ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold tracking-wider">H</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">极光药丸 · Aurora Pill</h2>
            <span className="text-xs text-[#86868b]">彩虹渐变边框 + 圆润全圆角 + 弹性滑动指示器</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedAuroraPill options={demoTabs} value={vH} onChange={setVH} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedAuroraPill options={demoTabsWithCount} value={vHc} onChange={setVHc} />
            </div>
          </div>
        </section>

        {/* ─── I. Ice Neon ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider">I</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">冰晶霓虹 · Ice Neon</h2>
            <span className="text-xs text-[#86868b]">冷调蓝紫渐变发光 + 弹性滑动 + 淡蓝底色</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedIceNeon options={demoTabs} value={vI} onChange={setVI} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedIceNeon options={demoTabsWithCount} value={vIc} onChange={setVIc} />
            </div>
          </div>
        </section>

        {/* ─── J. Frosted Pill ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 text-xs font-bold tracking-wider">J</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">磨砂药丸 · Frosted Pill</h2>
            <span className="text-xs text-[#86868b]">磨砂质感底 + 超弹性滑动 + 选中加粗 + 精致内阴影</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedFrostedPill options={demoTabs} value={vJ} onChange={setVJ} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedFrostedPill options={demoTabsWithCount} value={vJc} onChange={setVJc} />
            </div>
          </div>
        </section>

        {/* ─── K. Stellar Glass ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wider">K</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">星辰玻璃 · Stellar Glass</h2>
            <span className="text-xs text-[#86868b]">深色宇宙渐变底 + 发光玻璃指示器 + 紫色辉光文字</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedStellarGlass options={demoTabs} value={vK} onChange={setVK} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedStellarGlass options={demoTabsWithCount} value={vKc} onChange={setVKc} />
            </div>
          </div>
        </section>

        {/* 暗色背景对比区 - Round 1 */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">🌙 暗色背景参考 · Round 1</h2>
          <div className="p-8 rounded-2xl bg-[#1d1d1f] space-y-8">
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">Current</span>
              <SegmentedCurrent options={demoTabs} value={v1} onChange={setV1} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">A · Sliding Pill</span>
              <SegmentedSlidingPill options={demoTabs} value={v2} onChange={setV2} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">B · Gradient Underline</span>
              <SegmentedGradientUnderline options={demoTabs} value={v3} onChange={setV3} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">C · Capsule</span>
              <SegmentedCapsule options={demoTabs} value={v4} onChange={setV4} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">D · Neon Card</span>
              <SegmentedNeonCard options={demoTabs} value={v5} onChange={setV5} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">E · Glassmorphism</span>
              <SegmentedGlass options={demoTabs} value={v6} onChange={setV6} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">F · Embossed</span>
              <SegmentedEmbossed options={demoTabs} value={v1} onChange={setV1} />
            </div>
          </div>
        </section>

        {/* 暗色背景对比区 - Round 2 */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">🌙 暗色背景参考 · Round 2</h2>
          <div className="p-8 rounded-2xl bg-[#1d1d1f] space-y-8">
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">G · Glass Neon Slide</span>
              <SegmentedGlassNeonSlide options={demoTabs} value={vG} onChange={setVG} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">H · Aurora Pill</span>
              <SegmentedAuroraPill options={demoTabs} value={vH} onChange={setVH} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">I · Ice Neon</span>
              <SegmentedIceNeon options={demoTabs} value={vI} onChange={setVI} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">J · Frosted Pill</span>
              <SegmentedFrostedPill options={demoTabs} value={vJ} onChange={setVJ} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">K · Stellar Glass</span>
              <SegmentedStellarGlass options={demoTabs} value={vK} onChange={setVK} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* 🏆 Final Round: 最终候选 */}
        {/* ═══════════════════════════════════════════════════ */}

        <div className="text-center space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#3b82f6]/10 to-[#2563eb]/10 border border-[#3b82f6]/20">
            <span className="text-sm font-bold text-[#3b82f6] dark:text-[#60a5fa]">🏆 Final Round</span>
            <span className="text-xs text-[#86868b]">对齐系统 px-3 py-1.5 间距 · 霓虹改蓝色</span>
          </div>
        </div>

        {/* ─── Final 1: Sliding Pill ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider">F1</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">滑动药丸 · Sliding Pill Final</h2>
            <span className="text-xs text-[#86868b]">对齐系统间距 px-3 py-1.5 + 滑动动画</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedSlidingPillFinal options={demoTabs} value={vF1} onChange={setVF1} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedSlidingPillFinal options={demoTabsWithCount} value={vF1c} onChange={setVF1c} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">对照</span>
              <SegmentedCurrent options={demoTabs} value={vF1} onChange={setVF1} />
              <span className="text-[10px] text-[#86868b]/60">← 当前系统</span>
            </div>
          </div>
        </section>

        {/* ─── Final 2: Blue Neon ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider">F2</span>
            <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">蓝色霓虹 · Blue Neon Final</h2>
            <span className="text-xs text-[#86868b]">蓝色渐变发光 + 对齐系统间距 px-3 py-1.5</span>
          </div>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-[#e5e5ea]/60 dark:border-[#38383a]/60 space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">简约</span>
              <SegmentedBlueNeonFinal options={demoTabs} value={vF2} onChange={setVF2} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">计数</span>
              <SegmentedBlueNeonFinal options={demoTabsWithCount} value={vF2c} onChange={setVF2c} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#86868b] w-12 shrink-0">对照</span>
              <SegmentedCurrent options={demoTabs} value={vF2} onChange={setVF2} />
              <span className="text-[10px] text-[#86868b]/60">← 当前系统</span>
            </div>
          </div>
        </section>

        {/* 🏆 Final 暗色背景对比区 */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white">🌙 暗色背景参考 · Final</h2>
          <div className="p-8 rounded-2xl bg-[#1d1d1f] space-y-8">
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">Current (对照)</span>
              <SegmentedCurrent options={demoTabs} value={vF1} onChange={setVF1} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">F1 · Sliding Pill Final</span>
              <SegmentedSlidingPillFinal options={demoTabs} value={vF1} onChange={setVF1} />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#86868b]">F2 · Blue Neon Final</span>
              <SegmentedBlueNeonFinal options={demoTabs} value={vF2} onChange={setVF2} />
            </div>
          </div>
        </section>

        {/* Footer 说明 */}
        <div className="text-center text-xs text-[#86868b] pb-8">
          测试页面 · 仅用于样式对比 · 选择喜欢的方案后替换 SegmentedControl.tsx
        </div>
      </div>
    </div>
  )
}
