/**
 * Module 5 — Real-Time Market Pricing Agent
 * Computes the full pricing intelligence stack deterministically:
 *   floor = raw material cost + min artisan labor rate
 *   median / high = live benchmark reference
 *   competitiveTarget = sticker under the median to convert buyers
 */

import { resolveCraftProfile } from './craftData';
import { detectPriceAnomaly } from './anomaly';
import { PricingIntelligence } from './types';

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export interface MarketPriceInput {
  craftCategory: string;
  productName: string;
  materials: string[];
  askedPrice: number;
  artisanName?: string;
}

export function analyzeMarketPricing(input: MarketPriceInput): PricingIntelligence {
  const profile = resolveCraftProfile(input.craftCategory);

  const floorPrice = Math.round(profile.baseMaterialCost + profile.laborHours * profile.laborRatePerHour);
  const marketMedian = profile.medianReference;
  const marketHigh = profile.highReference;
  const competitiveTarget = roundToTen(marketMedian * 0.88);
  const retailPrice = Math.round(competitiveTarget * 1.35);

  const benchmark = {
    low: floorPrice,
    median: marketMedian,
    high: marketHigh,
    floorPrice,
    competitiveTarget,
    retailPrice,
    platformComparisons: profile.platformComparisons,
  };

  const anomaly = detectPriceAnomaly(input.askedPrice, benchmark);
  const spread = Math.max(1, competitiveTarget - floorPrice);
  const fairness = Math.round(((competitiveTarget - floorPrice) / spread) * 100);

  let fairPriceEvaluation: string;
  if (anomaly.type === 'below_market') {
    fairPriceEvaluation = `Your price of ₹${input.askedPrice} protects buyer conversion but sits far below the ₹${marketMedian} benchmark — craftsmanship value is being left on the table. Let's raise it to a fair ₹${competitiveTarget} range so families like yours earn their true worth.`;
  } else if (anomaly.type === 'above_market') {
    fairPriceEvaluation = `Strong confidence in the piece! The market median is ₹${marketMedian}; setting ₹${competitiveTarget} keeps you competitive while buyers still perceive premium authenticity.`;
  } else {
    fairPriceEvaluation = `Priced at ₹${input.askedPrice}, you're in the healthy trading band around the ₹${marketMedian} benchmark. Your labor effort of ${profile.laborHours} hrs is fairly rewarded (≈${fairness}% value margin), and buyers get genuine craft at fair trade terms.`;
  }

  if (input.artisanName) {
    fairPriceEvaluation = fairPriceEvaluation.replace(
      /families like yours/,
      `${input.artisanName}'s family`
    );
  }

  return {
    artisanAskedPrice: input.askedPrice,
    floorPrice,
    marketMedian,
    competitiveTarget,
    marketHigh,
    retailPrice,
    benchmark,
    anomaly,
    fairPriceEvaluation,
  };
}

export function priceForDisplay(price: number): string {
  return `₹${Math.round(price).toLocaleString('en-IN')}`;
}