import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aidrama.dev'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/*/profile/', '/*/workspace/'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
