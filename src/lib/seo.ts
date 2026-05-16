import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export function generateSEO({
  title,
  description,
  path = "/",
  image,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const fullDescription = description || siteConfig.description;
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || `${siteConfig.url}/og-image.jpg`;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name }],
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
