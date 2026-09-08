/**
 * Module 4 — JSON-LD Schema Markup Generator
 * Emits valid schema.org `Product` + `Offer` structured data so search
 * crawlers can instantly index price, availability and crafted attributes.
 */

export interface JsonLdProductInput {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'LimitedAvailability' | 'OutOfStock';
  ratingValue?: number;
  reviewCount?: number;
  category: string;
  material: string;
  craftRegion: string;
  tags: string[];
  sellerName: string;
}

export function buildProductJsonLd(input: JsonLdProductInput): object {
  const currency = input.currency || 'INR';
  const availability = input.availability || 'InStock';

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    priceCurrency: currency,
    price: Math.round(input.price).toString(),
    availability: `https://schema.org/${availability}`,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: input.sellerName,
    },
  };

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: input.name,
    image: input.image,
    description: input.description,
    sku: input.sku,
    category: input.category,
    material: input.material,
    brand: {
      '@type': 'Brand',
      name: `${input.sellerName} Handcraft`,
    },
    keywords: input.tags.join(', '),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Craft Region', value: input.craftRegion },
      { '@type': 'PropertyValue', name: 'Handmade', value: 'Yes — direct artisan origin' },
    ],
    offers: offer,
  };

  if (typeof input.ratingValue === 'number' && typeof input.reviewCount === 'number') {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.ratingValue,
      reviewCount: input.reviewCount,
    };
  }

  return schema;
}

export function serializeJsonLd(schema: object): string {
  return JSON.stringify(schema, (key, value) => (value === undefined ? undefined : value));
}

export function jsonLdToHtmlScript(schema: object): string {
  return `<script type="application/ld+json">${serializeJsonLd(schema)}</script>`;
}