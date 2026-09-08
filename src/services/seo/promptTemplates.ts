/**
 * Module 4 — SEO Prompt Templates
 * Battle-tested prompt builders that ask the Gemini model to produce
 * machine-first optimized listing copy in the marketplace's voice.
 */

import { ListingDraftInput } from './types';

export function buildSeoPrompt(input: ListingDraftInput, voiceTranscript?: string): string {
  const {
    productName,
    craftCategory,
    materials,
    technique,
    region,
    dimensions,
    colorNotes,
    askedPrice,
  } = input;

  return `You are the lead SEO cataloging engine for Bharat TULIP, an Indian artisan marketplace competing for top search rankings on Etsy, Amazon Karigar and ONDC.

Artisan's spoken description: "${voiceTranscript || ''}"
Product name: "${productName || 'handcrafted artifact'}"
Craft category: "${craftCategory || 'handicraft'}"
Raw materials: "${(materials || []).join(', ')}"
Traditional technique: "${technique || 'traditional handcrafting'}"
Artisan region: "${region || 'rural India'}"
Dimensions: "${dimensions || ''}"
Color notes: "${colorNotes || ''}"
Asking price (INR): "${askedPrice || 'unknown'}"

Generate a high-ranking, keyword-dense listing by returning ONLY valid JSON:
{
  "title": "clear e-commerce product title, 6-9 words",
  "metaTitle": "high-CTR indexed title strictly under 60 characters with high-volume keywords (Handmade, Authentic, region)",
  "description": "structured description: a 160-character crawler-preview opener rich with search terms, then bullet points of exact materials, dimensions and craft lineage, then care instructions and authentic provenance",
  "altText": "image alt attribute combining [Product Type] + [Artisan Material] + [Craft Style] + [Color/Dimension], e.g. 'Hand-carved solid teak wood elephant figurine with brass inlay - authentic Rajasthani handicraft'",
  "tags": ["exactly 13 high-intent, low-competition marketplace search tags"],
  "giTagStatus": "realistic GI / heritage authenticity status",
  "culturalStory": "deep 2-sentence heritage narrative honoring the artisan community",
  "craftTechnique": "exact artisanal manufacturing technique",
  "materials": ["expanded truthful material list"],
  "dimensions": "realistic dimensions and approximate weight",
  "careInstructions": "practical preservation guidance"
}`;
}

export function buildPricingPrompt(input: {
  productName: string;
  craftCategory: string;
  materials: string[];
  askedPrice: number;
  floorPrice: number;
  marketMedian: number;
}): string {
  return `You are a fair-trade pricing intelligence agent for Bharat TULIP artisan marketplace.
Analyze real Indian marketplace prices (Amazon Karigar, Fabindia, ONDC, Etsy India, Pepperfry) for:
Product: "${input.productName}"
Category: "${input.craftCategory}"
Materials: "${(input.materials || []).join(', ')}"

Engineering baseline:
- Floor price (raw materials + minimal artisan labor): ₹${input.floorPrice}
- Market median of comparable items: ₹${input.marketMedian}
- Artisan suggested price: ₹${input.askedPrice}

Return ONLY valid JSON:
{
  "floorPrice": number,
  "marketMedian": number,
  "competitiveTarget": number,
  "marketHigh": number,
  "retailPrice": number,
  "platformComparisons": [
    { "platform": "Fabindia", "price": number },
    { "platform": "Amazon Karigar", "price": number },
    { "platform": "ONDC Handicrafts", "price": number },
    { "platform": "Etsy India", "price": number }
  ],
  "fairPriceEvaluation": "2-sentence encouraging explanation in English of why this price protects artisan value and converts buyers."
}`;
}