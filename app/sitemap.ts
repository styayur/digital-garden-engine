import type { MetadataRoute } from 'next';

import { getAllPosts } from '@/lib/posts';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/writing',
    '/projects',
    '/library',
    '/garden',
    '/now',
    '/about',
    '/terminal',
  ].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: today,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.6,
  }));

  const essays: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${site.url}/writing/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: 'yearly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...essays];
}