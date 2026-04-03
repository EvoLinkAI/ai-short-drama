/** Mock data and shared types for workspace redesign test page */

export interface MockProject {
  id: string
  name: string
  description: string
  updatedAt: string
  stats: {
    episodes: number
    images: number
    videos: number
  }
}

export type VariantKey = 'v1' | 'v2' | 'v3' | 'v4' | 'v5'

export interface StyleOption {
  id: string
  labelKey: string
  emoji: string
}

export interface RatioOption {
  id: string
  labelKey: string
  icon: string
}

export interface QualityOption {
  id: string
  labelKey: string
}

export const STYLE_OPTIONS: StyleOption[] = [
  { id: 'anime', labelKey: 'styles.anime', emoji: '🎌' },
  { id: 'realistic', labelKey: 'styles.realistic', emoji: '📷' },
  { id: 'watercolor', labelKey: 'styles.watercolor', emoji: '🎨' },
  { id: 'cyberpunk', labelKey: 'styles.cyberpunk', emoji: '🌃' },
  { id: 'ghibli', labelKey: 'styles.ghibli', emoji: '🌿' },
  { id: 'ink', labelKey: 'styles.ink', emoji: '🖌️' },
]

export const RATIO_OPTIONS: RatioOption[] = [
  { id: '16:9', labelKey: 'ratios.r16_9', icon: '▬' },
  { id: '9:16', labelKey: 'ratios.r9_16', icon: '▮' },
  { id: '1:1', labelKey: 'ratios.r1_1', icon: '■' },
  { id: '4:3', labelKey: 'ratios.r4_3', icon: '▭' },
]

export const QUALITY_OPTIONS: QualityOption[] = [
  { id: 'standard', labelKey: 'qualities.standard' },
  { id: 'high', labelKey: 'qualities.high' },
  { id: 'ultra', labelKey: 'qualities.ultra' },
]

export function createMockProjects(t: (key: string) => string): MockProject[] {
  return [
    {
      id: '1',
      name: t('mockProject.name1'),
      description: t('mockProject.desc1'),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      stats: { episodes: 5, images: 48, videos: 12 },
    },
    {
      id: '2',
      name: t('mockProject.name2'),
      description: t('mockProject.desc2'),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      stats: { episodes: 3, images: 24, videos: 6 },
    },
    {
      id: '3',
      name: t('mockProject.name3'),
      description: t('mockProject.desc3'),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      stats: { episodes: 8, images: 96, videos: 20 },
    },
    {
      id: '4',
      name: t('mockProject.name4'),
      description: t('mockProject.desc4'),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      stats: { episodes: 2, images: 16, videos: 4 },
    },
    {
      id: '5',
      name: t('mockProject.name5'),
      description: t('mockProject.desc5'),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      stats: { episodes: 4, images: 32, videos: 8 },
    },
  ]
}

export function formatTimeAgo(dateString: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return t('ago.justNow')
  if (diffMinutes < 60) return t('ago.minutesAgo', { n: diffMinutes })
  if (diffHours < 24) return t('ago.hoursAgo', { n: diffHours })
  return t('ago.daysAgo', { n: diffDays })
}
