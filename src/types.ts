export type SupportedLanguageCode =
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'or' // Odia
  | 'pa' // Punjabi
  | 'en'; // English

export interface LanguageConfig {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  script: string;
  speechLocale: string;
  greetingText: string;
  welcomePrompt: string;
}

export interface ArtisanProfile {
  id: string;
  name: string;
  phone: string;
  village: string;
  state: string;
  craftType: string;
  experienceYears: number;
  language: SupportedLanguageCode;
  avatarUrl: string;
  totalEarnings: number;
  activeListingsCount: number;
  totalOrdersCount: number;
  rating: number;
  verified: boolean;
  createdAt: string;
}

export interface ProductListing {
  id: string;
  artisanId: string;
  artisanName: string;
  artisanCraft: string;
  artisanVillage: string;
  artisanState: string;
  originalLanguage: SupportedLanguageCode;
  rawVoiceTranscript: string;
  rawPhotoUrl: string;
  studioPhotoUrl: string;
  imageEnhanced: boolean;
  title: string;
  seoTitle: string;
  description: string;
  culturalStory: string;
  craftTechnique: string;
  materials: string[];
  dimensions: string;
  careInstructions: string;
  tags: string[];
  giTagStatus: string;
  artisanPrice: number;
  suggestedMarketPrice: number;
  retailPrice: number;
  estimatedMarginPercent: number;
  competitorAveragePrice: number;
  marketPriceBenchmark: {
    low: number;
    median: number;
    high: number;
    platformComparisons: {
      platform: string;
      price: number;
    }[];
  };
  stockQuantity: number;
  status: 'draft' | 'published' | 'low_stock' | 'out_of_stock';
  views: number;
  ordersCount: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  artisanId: string;
  artisanName: string;
  buyerName: string;
  buyerCity: string;
  buyerState: string;
  amount: number;
  artisanEarnings: number;
  platformFee: number;
  status: 'pending' | 'fulfilled' | 'canceled';
  createdAt: string;
  shippingAddress: string;
  paymentMethod: string;
}

export interface AnalyticsMetrics {
  totalSales: number;
  activeOrders: number;
  totalRevenue: number;
  artisanEarnings: number;
  totalInventoryItems: number;
  revenueTrends: {
    day: string;
    sales: number;
    orders: number;
  }[];
  craftCategoryDistribution: {
    category: string;
    count: number;
    revenue: number;
  }[];
  orderStatusDistribution: {
    status: 'pending' | 'fulfilled' | 'canceled';
    count: number;
  }[];
}

export type WizardStep =
  | 'language_select'
  | 'artisan_onboarding'
  | 'product_photo'
  | 'product_description'
  | 'product_price'
  | 'product_review'
  | 'product_published';

export type AppViewMode =
  | 'wizard'
  | 'seller_dashboard'
  | 'buyer_storefront'
  | 'db_inspector';
