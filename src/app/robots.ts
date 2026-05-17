import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/guest', '/api'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/sitemap.xml`,
  };
}
