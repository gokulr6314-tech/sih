/**
 * Module 5 — Price Anomaly Detection
 * Flags any artisan-suggested price that falls more than 40% below the
 * fair market median (a classic sign of under-valuing / exploited labor).
 */

import { PriceAnomaly, PricingBenchmark } from './types';

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function detectPriceAnomaly(
  askedPrice: number,
  benchmark: Pick<PricingBenchmark, 'median' | 'competitiveTarget' | 'floorPrice'>
): PriceAnomaly {
  if (!askedPrice || askedPrice <= 0) {
    return {
      isAnomaly: true,
      type: null,
      severity: 'high',
      message: 'A valid selling price is required before publishing.',
      suggestedRange: null,
    };
  }

  const marketFloor = benchmark.median * 0.6;
  const farAbove = benchmark.median * 1.9;

  if (askedPrice < marketFloor) {
    const min = roundToTen(benchmark.competitiveTarget * 0.9);
    const max = roundToTen(benchmark.competitiveTarget * 1.12);
    return {
      isAnomaly: true,
      type: 'below_market',
      severity: 'high',
      message: `₹${askedPrice} is more than 40% below the market median of ₹${benchmark.median}. This is excellent value for buyers but under-compensates the artisan. Recommend ${rangeLabel(min, max)}.`,
      suggestedRange: { min, max },
    };
  }

  if (askedPrice > farAbove) {
    return {
      isAnomaly: true,
      type: 'above_market',
      severity: 'low',
      message: `₹${askedPrice} is well above the ₹${benchmark.median} market median. Buyers may hesitate. Consider pricing closer to ₹${roundToTen(benchmark.competitiveTarget)}.`,
      suggestedRange: {
        min: roundToTen(benchmark.competitiveTarget * 0.9),
        max: roundToTen(benchmark.competitiveTarget * 1.15),
      },
    };
  }

  return {
    isAnomaly: false,
    type: null,
    severity: null,
    message: 'Fair and market-aligned price.',
    suggestedRange: null,
  };
}

function rangeLabel(min: number, max: number): string {
  return `₹${min}–₹${max}`;
}