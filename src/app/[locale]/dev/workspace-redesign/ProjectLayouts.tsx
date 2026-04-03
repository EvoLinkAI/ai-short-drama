'use client'

/**
 * 最近项目布局组件集
 * 5 种不同的排版方式，使用系统实际的卡片设计风格
 */
import { AppIcon, IconGradientDefs } from '@/components/ui/icons'
import type { MockProject } from './shared'
import { formatTimeAgo } from './shared'

/** 通用的项目统计行 — 模仿系统真实卡片中的渐变统计 */
function ProjectStats({ project, t }: { project: MockProject; t: (key: string) => string }) {
  return (
    <div className="flex items-center gap-2">
      <IconGradientDefs className="w-0 h-0 absolute" aria-hidden="true" />
      <AppIcon name="statsBarGradient" className="w-4 h-4 flex-shrink-0" />
      <div className="flex items-center gap-3 text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
        {project.stats.episodes > 0 && (
          <span className="flex items-center gap-1" title={t('episodes')}>
            <AppIcon name="statsEpisodeGradient" className="w-3.5 h-3.5" />
            {project.stats.episodes}
          </span>
        )}
        {project.stats.images > 0 && (
          <span className="flex items-center gap-1" title={t('images')}>
            <AppIcon name="statsImageGradient" className="w-3.5 h-3.5" />
            {project.stats.images}
          </span>
        )}
        {project.stats.videos > 0 && (
          <span className="flex items-center gap-1" title={t('videos')}>
            <AppIcon name="statsVideoGradient" className="w-3.5 h-3.5" />
            {project.stats.videos}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * 排版1: 网格卡片
 * 标准 5 列网格，卡片内容模仿系统真实结构（标题+描述+统计+时间）
 */
export function LayoutGrid({ projects, t }: { projects: MockProject[]; t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-8 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[var(--glass-text-secondary)]">{t('recentProjects')}</h2>
        <button className="text-xs text-[var(--glass-tone-info-fg)] hover:underline font-medium">{t('viewAll')}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="glass-surface cursor-pointer group hover:border-[var(--glass-tone-info-fg)]/40 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="p-5 relative z-10">
              <h3 className="text-sm font-bold text-[var(--glass-text-primary)] mb-2 group-hover:text-[var(--glass-tone-info-fg)] transition-colors line-clamp-1">
                {p.name}
              </h3>
              <div className="flex items-start gap-2 mb-3">
                <AppIcon name="fileText" className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-2 leading-relaxed">{p.description}</p>
              </div>
              <ProjectStats project={p} t={t} />
              <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--glass-text-tertiary)]">
                <AppIcon name="clock" className="w-3 h-3" />
                {formatTimeAgo(p.updatedAt, t)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 排版2: 横向滚动
 * 一排横滚大卡片，更有沉浸感
 */
export function LayoutScroll({ projects, t }: { projects: MockProject[]; t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-8 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[var(--glass-text-secondary)]">{t('recentProjects')}</h2>
        <button className="text-xs text-[var(--glass-tone-info-fg)] hover:underline font-medium">{t('viewAll')}</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {projects.map((p) => (
          <div key={p.id} className="min-w-[300px] max-w-[300px] snap-start glass-surface cursor-pointer group hover:border-[var(--glass-tone-info-fg)]/40 transition-all duration-300 overflow-hidden relative flex-shrink-0">
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="p-5 relative z-10">
              <h3 className="text-base font-bold text-[var(--glass-text-primary)] mb-2 group-hover:text-[var(--glass-tone-info-fg)] transition-colors line-clamp-1">
                {p.name}
              </h3>
              <div className="flex items-start gap-2 mb-4">
                <AppIcon name="fileText" className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-2 leading-relaxed">{p.description}</p>
              </div>
              <ProjectStats project={p} t={t} />
              <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--glass-text-tertiary)]">
                <AppIcon name="clock" className="w-3 h-3" />
                {formatTimeAgo(p.updatedAt, t)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 排版3: 紧凑列表
 * 左右布局的一行式列表，信息紧凑
 */
export function LayoutList({ projects, t }: { projects: MockProject[]; t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[var(--glass-text-secondary)]">{t('recentProjects')}</h2>
        <button className="text-xs text-[var(--glass-tone-info-fg)] hover:underline font-medium">{t('viewAll')}</button>
      </div>
      <div className="glass-surface overflow-hidden divide-y divide-[var(--glass-stroke-base)]">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-4 px-5 py-4 cursor-pointer group hover:bg-[var(--glass-bg-muted)] transition-colors">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[var(--glass-text-primary)] group-hover:text-[var(--glass-tone-info-fg)] transition-colors line-clamp-1 mb-0.5">
                {p.name}
              </h3>
              <p className="text-xs text-[var(--glass-text-tertiary)] line-clamp-1">{p.description}</p>
            </div>
            <div className="flex-shrink-0">
              <ProjectStats project={p} t={t} />
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-[var(--glass-text-tertiary)]">
              <AppIcon name="clock" className="w-3 h-3" />
              {formatTimeAgo(p.updatedAt, t)}
            </div>
            <AppIcon name="chevronRight" className="w-4 h-4 text-[var(--glass-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 排版4: 突出首项
 * 第一个项目大卡片占满左侧，右侧两列堆叠小卡片
 */
export function LayoutFeatured({ projects, t }: { projects: MockProject[]; t: (key: string, params?: Record<string, string | number>) => string }) {
  const [first, ...rest] = projects

  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-8 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[var(--glass-text-secondary)]">{t('recentProjects')}</h2>
        <button className="text-xs text-[var(--glass-tone-info-fg)] hover:underline font-medium">{t('viewAll')}</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 大卡片 */}
        {first && (
          <div className="lg:col-span-1 glass-surface cursor-pointer group hover:border-[var(--glass-tone-info-fg)]/40 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="p-6 relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="glass-chip glass-chip-info text-[10px] mb-3 w-fit">{t('latestUpdate')}</div>
                <h3 className="text-lg font-bold text-[var(--glass-text-primary)] mb-2 group-hover:text-[var(--glass-tone-info-fg)] transition-colors">
                  {first.name}
                </h3>
                <div className="flex items-start gap-2 mb-4">
                  <AppIcon name="fileText" className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[var(--glass-text-secondary)] leading-relaxed">{first.description}</p>
                </div>
              </div>
              <div>
                <ProjectStats project={first} t={t} />
                <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--glass-text-tertiary)]">
                  <AppIcon name="clock" className="w-3 h-3" />
                  {formatTimeAgo(first.updatedAt, t)}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 小卡片网格 */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.map((p) => (
            <div key={p.id} className="glass-surface cursor-pointer group hover:border-[var(--glass-tone-info-fg)]/40 transition-all duration-300 overflow-hidden relative">
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="p-4 relative z-10">
                <h3 className="text-sm font-bold text-[var(--glass-text-primary)] mb-1 group-hover:text-[var(--glass-tone-info-fg)] transition-colors line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-xs text-[var(--glass-text-tertiary)] line-clamp-1 mb-3">{p.description}</p>
                <div className="flex items-center justify-between">
                  <ProjectStats project={p} t={t} />
                  <span className="text-[10px] text-[var(--glass-text-tertiary)]">{formatTimeAgo(p.updatedAt, t)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 排版5: 极简圆点列表
 * 和输入框同宽的极简列表，仅显示项目名和关键数据
 */
export function LayoutMinimalList({ projects, t }: { projects: MockProject[]; t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <div className="px-4 pb-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-[var(--glass-text-tertiary)] uppercase tracking-wider">{t('recentProjects')}</h2>
        <button className="text-xs text-[var(--glass-tone-info-fg)] hover:underline font-medium">{t('viewAll')}</button>
      </div>
      <div className="space-y-0.5">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-[var(--glass-bg-muted)] cursor-pointer transition-colors group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:scale-125 transition-transform flex-shrink-0" />
              <span className="text-sm font-medium text-[var(--glass-text-primary)] group-hover:text-[var(--glass-tone-info-fg)] transition-colors truncate">{p.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--glass-text-tertiary)] flex-shrink-0">
              <span>{p.stats.episodes} {t('episodes')}</span>
              <span>{p.stats.images} {t('images')}</span>
              <span className="hidden sm:inline">{formatTimeAgo(p.updatedAt, t)}</span>
              <AppIcon name="chevronRight" className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
