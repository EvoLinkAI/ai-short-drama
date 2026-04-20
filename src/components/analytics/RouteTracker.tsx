'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

export default function RouteTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) trackPageView(pathname)
  }, [pathname])

  return null
}
