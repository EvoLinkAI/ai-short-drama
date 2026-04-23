type EventName =
  | 'sign_up'
  | 'login'
  | 'project_create'
  | 'novel_import'
  | 'smart_import'
  | 'image_generate'
  | 'video_generate'
  | 'video_download'
  | 'voice_design'
  | 'voice_generate_all'
  | 'workflow_run'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: EventName, params?: Record<string, string | number>) {
  window.gtag?.('event', name, params)
}

export function trackPageView(url: string) {
  window.gtag?.('event', 'page_view', { page_path: url })
}
