import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.moroccan-fondouk.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques indexables
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/dispositifs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE}/diagnostic`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  ]

  // Fiches dispositifs — pages SEO principales
  try {
    const supabase = await createClient()
    const { data: dispositifs } = await supabase
      .from('dispositifs')
      .select('slug, updated_at')
      .eq('actif', true)
      .order('updated_at', { ascending: false })

    const ficheRoutes: MetadataRoute.Sitemap = (dispositifs ?? []).map((d) => ({
      url: `${BASE}/dispositifs/${d.slug}`,
      lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

    return [...staticRoutes, ...ficheRoutes]
  } catch {
    return staticRoutes
  }
}
