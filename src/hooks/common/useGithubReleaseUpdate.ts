'use client'

export interface ReleaseUpdateInfo {
  latestVersion: string
  releaseUrl: string
  releaseName: string | null
  publishedAt: string | null
}

export interface UseGithubReleaseUpdateResult {
  currentVersion: string
  update: ReleaseUpdateInfo | null
  shouldPulse: boolean
  showModal: boolean
  isChecking: boolean
  checkError: string | null
  openModal: () => void
  dismissCurrentUpdate: () => void
  checkNow: () => Promise<void>
}

export function useGithubReleaseUpdate(): UseGithubReleaseUpdateResult {
  return {
    currentVersion: '',
    update: null,
    shouldPulse: false,
    showModal: false,
    isChecking: false,
    checkError: null,
    openModal: () => {},
    dismissCurrentUpdate: () => {},
    checkNow: async () => {},
  }
}
