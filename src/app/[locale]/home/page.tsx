'use client'

/**
 * 首页 - 创作中心
 * 用户登录后的主入口页面：快速创作 + 最近项目
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import { AppIcon } from '@/components/ui/icons'
import { RatioSelector, StyleSelector } from '@/components/selectors/RatioStyleSelectors'
import { ART_STYLES, VIDEO_RATIOS } from '@/lib/constants'
import { Link, useRouter } from '@/i18n/navigation'
import { apiFetch } from '@/lib/api-fetch'
import { createHomeProjectLaunch } from '@/lib/home/create-project-launch'
import {
  HOME_QUICK_START_MIN_ROWS,
  resolveTextareaTargetHeight,
} from '@/lib/home/quick-start-textarea'

interface ProjectStats {
  episodes: number
  images: number
  videos: number
  panels: number
  firstEpisodePreview: string | null
}

interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  stats?: ProjectStats
}

const RECENT_COUNT = 6

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('home')
  const tc = useTranslations('common')

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [videoRatio, setVideoRatio] = useState('9:16')
  const [artStyle, setArtStyle] = useState('american-comic')
  const [createLoading, setCreateLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaMinHeightRef = useRef<number | null>(null)

  // textarea 自适应高度（rAF 分帧动画）
  const autoResizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const maxH = window.innerHeight * 0.3
    const oldH = el.offsetHeight
    const oldScrollTop = el.scrollTop
    if (textareaMinHeightRef.current === null && oldH > 0) {
      textareaMinHeightRef.current = oldH
    }
    const minH = textareaMinHeightRef.current ?? oldH

    // 同步：测量真实高度（不改 overflow，避免 scrollTop 被重置）
    el.style.transition = 'none'
    el.style.height = 'auto'
    const scrollH = el.scrollHeight
    const targetH = resolveTextareaTargetHeight({
      minHeight: minH,
      maxHeight: maxH,
      scrollHeight: scrollH,
    })
    el.style.height = `${oldH}px`
    el.scrollTop = oldScrollTop

    // 下一帧：开启 transition → 动画到目标高度
    requestAnimationFrame(() => {
      el.scrollTop = oldScrollTop
      el.style.transition = 'height 200ms ease-out'
      el.style.height = `${targetH}px`
      el.style.overflowY = scrollH > maxH ? 'auto' : 'hidden'
    })
  }, [])

  useEffect(() => {
    autoResizeTextarea()
  }, [inputValue, autoResizeTextarea])

  // 鉴权
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push({ pathname: '/auth/signin' })
    }
  }, [session, status, router])

  // 获取最近项目
  const fetchRecentProjects = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        pageSize: RECENT_COUNT.toString(),
      })
      const response = await apiFetch(`/api/projects?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      void fetchRecentProjects()
    }
  }, [session, fetchRecentProjects])

  // 创建项目并跳转
  const handleCreate = async () => {
    if (!inputValue.trim() || createLoading) return
    setCreateLoading(true)
    try {
      const storyText = inputValue.trim()
      const result = await createHomeProjectLaunch({
        apiFetch,
        projectName: storyText.slice(0, 50),
        storyText,
        videoRatio,
        artStyle,
        episodeName: `${tc('episode')} 1`,
      })

      router.push(result.target)
    } catch (error) {
      const message = error instanceof Error ? error.message : t('createFailed')
      window.alert(message)
    } finally {
      setCreateLoading(false)
    }
  }

  // 比例选项（带推荐标签）
  const ratioOptions = useMemo(
    () => VIDEO_RATIOS.map((r) => ({ ...r, recommended: r.value === '9:16' })),
    []
  )

  // 风格选项（带推荐标签）
  const styleOptions = useMemo(
    () => ART_STYLES.map((s) => ({ ...s, recommended: s.value === 'realistic' })),
    []
  )

  // 时间格式化
  const formatTimeAgo = (dateString: string): string => {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffMinutes < 1) return t('ago.justNow')
    if (diffMinutes < 60) return t('ago.minutesAgo', { n: diffMinutes })
    if (diffHours < 24) return t('ago.hoursAgo', { n: diffHours })
    return t('ago.daysAgo', { n: diffDays })
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-[#737373]">{tc('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-8 py-8">
        {/* 欢迎区 */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#171717]">
            {t('title')}
          </h1>
          <p className="text-[#525252] mt-1">{t('subtitle')}</p>
        </div>

        {/* 新建项目卡片 */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm mb-8">
          {/* textarea 区域 */}
          <div className="p-5 pb-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('inputPlaceholder')}
              rows={HOME_QUICK_START_MIN_ROWS}
              className="w-full bg-transparent border-none outline-none text-[#171717] placeholder:text-[#a3a3a3] text-sm resize-none leading-relaxed custom-scrollbar"
            />
          </div>

          {/* 工具栏：左侧选择器 + 右侧创建按钮 */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <RatioSelector
                value={videoRatio}
                onChange={setVideoRatio}
                options={ratioOptions}
              />
              <StyleSelector
                value={artStyle}
                onChange={setArtStyle}
                options={styleOptions}
              />
            </div>
            <button
              onClick={() => void handleCreate()}
              disabled={!inputValue.trim() || createLoading}
              className="flex items-center justify-center gap-2 bg-[#171717] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#262626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createLoading ? tc('loading') : t('startCreation')}
              <AppIcon name="arrowRight" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 最近项目 */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[#171717]">{t('recentProjects')}</h2>
            <Link
              href={{ pathname: '/workspace' }}
              className="text-sm text-[#525252] hover:text-[#171717] font-medium transition-colors"
            >
              {t('viewAll')}
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#e5e5e5] rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-[#f5f5f5] rounded mb-3" />
                  <div className="h-3 bg-[#f5f5f5] rounded mb-2" />
                  <div className="h-3 bg-[#f5f5f5] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-[#f5f5f5] rounded-xl flex items-center justify-center mx-auto mb-3">
                <AppIcon name="folderCards" className="w-6 h-6 text-[#a3a3a3]" />
              </div>
              <p className="text-sm text-[#737373]">{t('noProjects')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={{ pathname: `/workspace/${project.id}` }}
                  className="bg-white border border-[#e5e5e5] rounded-xl cursor-pointer group hover:border-[#d4d4d4] hover:shadow-sm transition-all duration-200 overflow-hidden relative block"
                >
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-[#171717] mb-2 line-clamp-1">
                      {project.name}
                    </h3>
                    {(project.description || project.stats?.firstEpisodePreview) && (
                      <div className="flex items-start gap-2 mb-3">
                        <AppIcon name="fileText" className="w-3.5 h-3.5 text-[#a3a3a3] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-[#525252] line-clamp-2 leading-relaxed">
                          {project.description || project.stats?.firstEpisodePreview}
                        </p>
                      </div>
                    )}
                    {project.stats && (project.stats.episodes > 0 || project.stats.images > 0 || project.stats.videos > 0) && (
                      <div className="flex items-center gap-2 mb-3">
                        <AppIcon name="statsBar" className="w-4 h-4 text-[#a3a3a3] flex-shrink-0" />
                        <div className="flex items-center gap-3 text-sm font-semibold text-[#171717]">
                          {project.stats.episodes > 0 && (
                            <span className="flex items-center gap-1">
                              {project.stats.episodes}
                            </span>
                          )}
                          {project.stats.images > 0 && (
                            <span className="flex items-center gap-1">
                              {project.stats.images}
                            </span>
                          )}
                          {project.stats.videos > 0 && (
                            <span className="flex items-center gap-1">
                              {project.stats.videos}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-[#a3a3a3]">
                      <AppIcon name="clock" className="w-3 h-3" />
                      {formatTimeAgo(project.updatedAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
