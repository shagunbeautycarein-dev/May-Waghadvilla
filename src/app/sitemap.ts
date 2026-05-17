import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  
  const rooms = await prisma.room.findMany({
    where: { status: 'Active', deletedAt: null },
    select: { id: true, updatedAt: true },
  });

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/rooms`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  rooms.forEach((room) => {
    routes.push({
      url: `${baseUrl}/rooms/${room.id}`,
      lastModified: room.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return routes;
}
