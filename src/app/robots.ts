import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.moroccan-fondouk.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/diagnostic', '/dispositifs/'],
        disallow: [
          '/tableau-de-bord/',
          '/resultats/',
          '/api/',
          '/auth/',
          '/connexion',
          '/inscription',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
