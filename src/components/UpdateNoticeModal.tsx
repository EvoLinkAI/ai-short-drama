'use client'

export interface UpdateNoticeModalProps {
  show: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
  releaseName: string | null
  publishedAt: string | null
  onDismiss: () => void
}

export default function UpdateNoticeModal(_props: UpdateNoticeModalProps) {
  return null
}
