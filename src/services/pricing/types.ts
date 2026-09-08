export interface PlatformComparison {
  platform: string;
  price: number;
}

export interface PricingBenchmark {
  low: number;
  median: number;
  high: number;
  floorPrice: number;
  competitiveTarget: number;
  retailPrice: number;
  platformComparisons: PlatformComparison[];
}

export interface PriceAnomaly {
  isAnomaly: boolean;
  type: 'below_market' | 'above_market' | null;
  severity: 'low' | 'high' | null;
  message: string;
  suggestedRange: { min: number; max: number } | null;
}

export interface PricingIntelligence {
  artisanAskedPrice: number;
  floorPrice: number;
  marketMedian: number;
  competitiveTarget: number;
  marketHigh: number;
  retailPrice: number;
  benchmark: PricingBenchmark;
  anomaly: PriceAnomaly;
  fairPriceEvaluation: string;
}