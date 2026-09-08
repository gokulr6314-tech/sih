export interface ListingDraftInput {
  productName: string;
  craftCategory: string;
  materials: string[];
  technique: string;
  region: string;
  colorNotes?: string;
  dimensions?: string;
  askedPrice?: number;
}

export interface SeoOutput {
  title: string;
  metaTitle: string;
  description: string;
  structuredDescription: string;
  altText: string;
  tags: string[];
  giTagStatus: string;
  culturalStory: string;
  craftTechnique: string;
  materials: string[];
  dimensions: string;
  careInstructions: string;
  jsonLd: object;
  jsonLdString: string;
}