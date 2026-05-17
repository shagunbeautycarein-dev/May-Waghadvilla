import { siteConfig } from '@/config/site';

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address,
      addressLocality: 'Ambawadi',
      addressRegion: 'Gujarat',
      postalCode: '380006',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '23.0225',
      longitude: '72.5714',
    },
    priceRange: '₹₹',
    image: siteConfig.ogImage,
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function productSchema(room: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${room.name} - ${siteConfig.name}`,
    description: `PG room in Ambawadi, Ahmedabad. ${room.sharingType} with AC and WiFi.`,
    image: room.images?.[0] || siteConfig.ogImage,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: room.minRent?.toString() || '9000',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
