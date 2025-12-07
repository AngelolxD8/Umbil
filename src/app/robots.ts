import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cpd/', '/profile/', '/settings/', '/api/'],
    },
    sitemap: 'https://umbil.co.uk/sitemap.xml',
  };
}