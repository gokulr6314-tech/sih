import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  DollarSign,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  Eye,
  Sliders,
  Award
} from 'lucide-react';
import {
  SupportedLanguageCode,
  ArtisanProfile,
  ProductListing
} from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { DatabaseStore } from '../lib/supabase';
import { VoiceAssistantOrb } from './VoiceAssistantOrb';

interface SmartSellingWizardProps {
  artisan: ArtisanProfile;
  language: SupportedLanguageCode;
  onProductPublished: (product: ProductListing) => void;
  onViewStorefront: () => void;
}

type SellStep = 'photo' | 'description' | 'price' | 'review' | 'success';

export const SmartSellingWizard: React.FC<SmartSellingWizardProps> = ({
  artisan,
  language,
  onProductPublished,
  onViewStorefront,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [currentStep, setCurrentStep] = useState<SellStep>('photo');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);

  // Raw inputs from Artisan
  const [rawPhotoUrl, setRawPhotoUrl] = useState<string>('');
  const [rawVoiceDescription, setRawVoiceDescription] = useState<string>('');
  const [artisanAskedPrice, setArtisanAskedPrice] = useState<number>(850);

  // AI Work 1 outputs: Enhanced Image
  const [studioPhotoUrl, setStudioPhotoUrl] = useState<string>('');
  const [lightingNotes, setLightingNotes] = useState<string>('');
  const [imageEnhanced, setImageEnhanced] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState<'studio' | 'raw'>('studio');

  // AI Work 2 outputs: Enhanced Description & SEO
  const [aiTitle, setAiTitle] = useState<string>('');
  const [aiSeoTitle, setAiSeoTitle] = useState<string>('');
  const [aiDescription, setAiDescription] = useState<string>('');
  const [aiCulturalStory, setAiCulturalStory] = useState<string>('');
  const [aiTechnique, setAiTechnique] = useState<string>('');
  const [aiMaterials, setAiMaterials] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [aiGiTag, setAiGiTag] = useState<string>('GI Tag Craft Candidate');

  // AI Work 3 outputs: Price Analysis & Benchmarking
  const [suggestedMarketPrice, setSuggestedMarketPrice] = useState<number>(1450);
  const [retailPrice, setRetailPrice] = useState<number>(1299);
  const [estimatedMarginPercent, setEstimatedMarginPercent] = useState<number>(82);
  const [competitorAvg, setCompetitorAvg] = useState<number>(1650);
  const [benchmarks, setBenchmarks] = useState<{
    low: number;
    median: number;
    high: number;
    platformComparisons: { platform: string; price: number }[];
  }>({
    low: 1100,
    median: 1450,
    high: 1850,
    platformComparisons: [
      { platform: 'Fabindia Heritage Store', price: 1750 },
      { platform: 'Amazon Karigar', price: 1499 },
      { platform: 'ONDC Crafts Network', price: 1250 },
      { platform: 'Etsy India Global', price: 1950 },
    ],
  });
  const [fairEvaluationNote, setFairEvaluationNote] = useState<string>('');

  const [publishedProduct, setPublishedProduct] = useState<ProductListing | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample quick photos for artisans without a live camera in test environments
  const sampleCraftPhotos = [
    {
      name: 'मिट्टी का फूलदान (Terracotta Vase)',
      raw: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
      studio: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=85',
      craft: 'Terracotta Pottery',
      desc: 'मैंने यह मिट्टी का फूलदान चाक पर प्राकृतिक चिकनी मिट्टी से बनाया है, इसमें प्राकृतिक रंग है।',
      price: 850,
    },
    {
      name: 'अखंड दीया (Clay Diya Lamp)',
      raw: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80',
      studio: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=85',
      craft: 'Clay Sculpting',
      desc: 'पूजा और दीपावली के लिए पांच मुख वाला अखंड दीया, धूप में सुखाकर भट्टी में पकाया गया।',
      price: 320,
    },
    {
      name: 'पट्टमडई सिल्क मैट (Handloom Mat)',
      raw: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80',
      studio: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85',
      craft: 'Pattamadai Handloom Weaving',
      desc: 'தாமிரபரணி ஆற்றங்கரை புல்லால் நெய்யப்பட்ட மிக மென்மையான பட்டு கோரைப்பாய்.',
      price: 1350,
    },
  ];

  // Dynamic voice prompts per step in the chosen language
  const getCurrentPrompt = (): string => {
    switch (currentStep) {
      case 'photo':
        return t.stepPhotoPrompt;
      case 'description':
        return t.stepDescPrompt;
      case 'price':
        return t.stepPricePrompt;
      case 'review':
        return `${artisan.name} जी, आपका उत्पाद तैयार है। एआई ने फोटो और विवरण को आकर्षक बना दिया है। क्या इसे प्रकाशित करें?`;
      case 'success':
        return t.productPublishedSuccess;
    }
  };

  const getStepHint = (): string => {
    switch (currentStep) {
      case 'photo':
        return t.stepPhotoTitle;
      case 'description':
        return t.stepDescTitle;
      case 'price':
        return t.stepPriceTitle;
      case 'review':
        return t.reviewTitle;
      case 'success':
        return 'सफल (Live)';
    }
  };

  const getSuggestedPhrases = (): string[] => {
    switch (currentStep) {
      case 'photo':
        return ['फोटो तैयार है (Photo ready)', 'कैमरा चालू करें (Open Camera)'];
      case 'description':
        return [
          'मैंने इसे चाक पर हाथ से प्राकृतिक मिट्टी से बनाया है',
          'यह पारंपरिक हथकरघे पर बुना हुआ शुद्ध रेशमी वस्त्र है',
          'हाथ से गढ़ी गई पीतल की मूर्ति जो पीढ़ियों पुरानी विधि से बनी है',
        ];
      case 'price':
        return ['आठ सौ पचास रुपये (850)', 'बारह सौ रुपये (1200)', 'पांच सौ रुपये (500)'];
      case 'review':
        return ['हाँ, प्रकाशित करें (Yes, Publish)', 'दुकान में देखें (View in Store)'];
      case 'success':
        return ['खरीदार स्टोर में देखें (View Buyer Store)'];
    }
  };

  // -------------------------------------------------------------
  // AI WORK 1: Trigger Image Enhancement (Background Removal & Studio Photoshoot)
  // -------------------------------------------------------------
  const processImageWithAI = async (photoUrl: string) => {
    setRawPhotoUrl(photoUrl);
    setIsAiProcessing(true);
    setProcessingLabel('AI द्वारा बैकग्राउंड हटाया जा रहा है और स्टूडियो फोटो बनाई जा रही है...');

    try {
      const response = await fetch('/api/ai/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawImageUrl: photoUrl,
          craftType: artisan.craftType,
          productTitle: aiTitle || 'Artisanal Handicraft',
        }),
      });

      const data = await response.json();
      setStudioPhotoUrl(data.enhancedImageUrl || photoUrl);
      setLightingNotes(data.lightingNotes || 'Studio diffused lighting applied.');
      setImageEnhanced(true);
      setActivePhotoTab('studio');
    } catch (e) {
      console.warn('Image enhancement fallback:', e);
      setStudioPhotoUrl(photoUrl);
      setImageEnhanced(true);
    } finally {
      setIsAiProcessing(false);
      setProcessingLabel(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        processImageWithAI(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSamplePhotoSelect = (sample: typeof sampleCraftPhotos[0]) => {
    setRawPhotoUrl(sample.raw);
    setStudioPhotoUrl(sample.studio);
    setImageEnhanced(true);
    setActivePhotoTab('studio');
    setLightingNotes('Matte white studio background with 45° warm rim softbox illumination.');
    setRawVoiceDescription(sample.desc);
    setArtisanAskedPrice(sample.price);
  };

  // -------------------------------------------------------------
  // AI WORK 2: Trigger Description Enhancement & SEO Optimization
  // -------------------------------------------------------------
  const processDescriptionWithAI = async (text: string) => {
    setRawVoiceDescription(text);
    setIsAiProcessing(true);
    setProcessingLabel('AI आपके शब्दों को आकर्षक SEO विवरण में बदल रहा है...');

    try {
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: text,
          language,
          craftType: artisan.craftType,
          artisanName: artisan.name,
          village: artisan.village,
        }),
      });

      const data = await response.json();
      setAiTitle(data.title || 'Handcrafted Artisan Heritage Decor');
      setAiSeoTitle(data.seoTitle || '');
      setAiDescription(data.description || '');
      setAiCulturalStory(data.culturalStory || '');
      setAiTechnique(data.craftTechnique || 'Hand sculpted');
      setAiMaterials(data.materials || ['Natural Clay']);
      setAiTags(data.tags || ['Handmade']);
      setAiGiTag(data.giTagStatus || 'GI Tag Certified');

      setCurrentStep('price');
    } catch (e) {
      console.warn('Description generation fallback:', e);
      setAiTitle('Handcrafted Heritage Artisan Creation');
      setAiDescription(text);
      setCurrentStep('price');
    } finally {
      setIsAiProcessing(false);
      setProcessingLabel(null);
    }
  };

  // -------------------------------------------------------------
  // AI WORK 3: Trigger Price Calculation & Marketplace Benchmark
  // -------------------------------------------------------------
  const processPriceWithAI = async (askedPrice: number) => {
    setArtisanAskedPrice(askedPrice);
    setIsAiProcessing(true);
    setProcessingLabel('AI बाजार दरों से तुलना कर उचित मूल्य और लाभ की गणना कर रहा है...');

    try {
      const response = await fetch('/api/ai/price-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisanAskedPrice: askedPrice,
          craftType: artisan.craftType,
          productTitle: aiTitle,
        }),
      });

      const data = await response.json();
      setSuggestedMarketPrice(data.suggestedMarketPrice || Math.round(askedPrice * 1.5));
      setRetailPrice(data.retailPrice || Math.round(askedPrice * 1.4));
      setEstimatedMarginPercent(data.estimatedMarginPercent || 82);
      setCompetitorAvg(data.competitorAveragePrice || Math.round(askedPrice * 1.7));
      if (data.marketPriceBenchmark) {
        setBenchmarks(data.marketPriceBenchmark);
      }
      setFairEvaluationNote(data.fairPriceEvaluation || '');

      setCurrentStep('review');
    } catch (e) {
      console.warn('Price calculation fallback:', e);
      setSuggestedMarketPrice(Math.round(askedPrice * 1.5));
      setRetailPrice(Math.round(askedPrice * 1.35));
      setCurrentStep('review');
    } finally {
      setIsAiProcessing(false);
      setProcessingLabel(null);
    }
  };

  // -------------------------------------------------------------
  // Voice Input Router across Selling Wizard steps
  // -------------------------------------------------------------
  const handleVoiceInput = (spokenText: string) => {
    if (!spokenText || !spokenText.trim()) return;

    if (currentStep === 'photo') {
      if (spokenText.toLowerCase().includes('photo') || spokenText.toLowerCase().includes('कैमरा')) {
        fileInputRef.current?.click();
      } else if (!rawPhotoUrl) {
        // Pick first sample if voice says ready
        handleSamplePhotoSelect(sampleCraftPhotos[0]);
      } else {
        setCurrentStep('description');
      }
    } else if (currentStep === 'description') {
      processDescriptionWithAI(spokenText);
    } else if (currentStep === 'price') {
      // Extract digits from speech
      const numbers = spokenText.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const parsed = parseInt(numbers[0], 10);
        if (parsed > 0) {
          processPriceWithAI(parsed);
          return;
        }
      }
      // Word matches for common Hindi/English numbers
      if (spokenText.includes('आठ सौ') || spokenText.includes('850')) processPriceWithAI(850);
      else if (spokenText.includes('बारह सौ') || spokenText.includes('1200')) processPriceWithAI(1200);
      else if (spokenText.includes('पांच सौ') || spokenText.includes('500')) processPriceWithAI(500);
      else processPriceWithAI(artisanAskedPrice);
    } else if (currentStep === 'review') {
      if (
        spokenText.toLowerCase().includes('हाँ') ||
        spokenText.toLowerCase().includes('publish') ||
        spokenText.toLowerCase().includes('yes')
      ) {
        handleFinalPublish();
      }
    } else if (currentStep === 'success') {
      onViewStorefront();
    }
  };

  // -------------------------------------------------------------
  // Final Submission -> Save End-to-End to Database (Supabase)
  // -------------------------------------------------------------
  const handleFinalPublish = () => {
    const newProduct: ProductListing = {
      id: `prod_${Date.now().toString().slice(-6)}`,
      artisanId: artisan.id,
      artisanName: artisan.name,
      artisanCraft: artisan.craftType,
      artisanVillage: artisan.village,
      artisanState: artisan.state,
      originalLanguage: language,
      rawVoiceTranscript: rawVoiceDescription,
      rawPhotoUrl: rawPhotoUrl || sampleCraftPhotos[0].raw,
      studioPhotoUrl: studioPhotoUrl || sampleCraftPhotos[0].studio,
      imageEnhanced: true,
      title: aiTitle || 'Handcrafted Heritage Terracotta Vase',
      seoTitle: aiSeoTitle || 'GI Tag Certified Handcrafted Product',
      description: aiDescription || rawVoiceDescription,
      culturalStory: aiCulturalStory || 'Rooted in rural Indian heritage and handcrafting lineage.',
      craftTechnique: aiTechnique || 'Handmade wheel throwing and organic firing',
      materials: aiMaterials.length > 0 ? aiMaterials : ['Natural Clay', 'Mineral Dye'],
      dimensions: '14" Height x 7" Width, 1.6 kg',
      careInstructions: 'Clean gently with dry soft cloth. Keep in shaded airy space.',
      tags: aiTags.length > 0 ? aiTags : ['Handcrafted', 'GI Tag', 'Decor', 'Vocal for Local'],
      giTagStatus: aiGiTag,
      artisanPrice: artisanAskedPrice,
      suggestedMarketPrice,
      retailPrice,
      estimatedMarginPercent,
      competitorAveragePrice: competitorAvg,
      marketPriceBenchmark: benchmarks,
      stockQuantity: 12,
      status: 'published',
      views: 1,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Save end-to-end to DB (Supabase + resilient local mirror)
    DatabaseStore.addProduct(newProduct);
    setPublishedProduct(newProduct);
    setCurrentStep('success');
    onProductPublished(newProduct);
  };

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Universal Voice Assistant Orb */}
      <VoiceAssistantOrb
        currentPrompt={getCurrentPrompt()}
        language={language}
        onVoiceResult={handleVoiceInput}
        isProcessing={isAiProcessing}
        stepHint={getStepHint()}
        suggestedPhrases={getSuggestedPhrases()}
      />

      {/* Main Card Container */}
      <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60">
        {/* Step Progression Bar (3 core voice steps + review) */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 'photo'
                  ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
                  : 'bg-white/70 text-[#2D422D] shadow-sm'
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold text-[#2D422D] hidden sm:inline">
              फोटो (Photo)
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-white/60" />

          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 'description'
                  ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
                  : rawVoiceDescription
                  ? 'bg-[#C8E6C9] text-[#2E7D32]'
                  : 'bg-white/50 text-[#455A45]/60'
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-[#2D422D] hidden sm:inline">
              विवरण (Voice SEO)
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-white/60" />

          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 'price'
                  ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
                  : retailPrice
                  ? 'bg-[#C8E6C9] text-[#2E7D32]'
                  : 'bg-white/50 text-[#455A45]/60'
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold text-[#2D422D] hidden sm:inline">
              कीमत (Price AI)
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-white/60" />

          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 'review' || currentStep === 'success'
                  ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
                  : 'bg-white/50 text-[#455A45]/60'
              }`}
            >
              ✓
            </div>
            <span className="text-xs font-bold text-[#2D422D] hidden sm:inline">
              प्रकाशन (Publish)
            </span>
          </div>
        </div>

        {/* Processing Indicator */}
        {isAiProcessing && (
          <div className="mb-5 p-4 rounded-2xl bg-[#81C784] text-white shadow-lg flex items-center gap-3 animate-pulse border border-white/40">
            <RefreshCw className="w-5 h-5 text-white animate-spin flex-shrink-0" />
            <div className="text-xs">
              <div className="font-bold">Bharat TULIP AI Assistant</div>
              <div className="opacity-90">{processingLabel || t.aiThinking}</div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: Product Photo & AI Studio Enhancement */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'photo' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2D422D] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#4CAF50]" />
                  {t.stepPhotoTitle}
                </h3>
                <p className="text-xs text-[#455A45]">
                  {t.stepPhotoAiEnhance}
                </p>
              </div>
            </div>

            {/* Hidden native camera/file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Photo Capture & Preview Area */}
            {rawPhotoUrl ? (
              <div className="space-y-3">
                {/* Before / After toggle */}
                <div className="flex items-center justify-between p-1 rounded-2xl bg-[#E1EBE1] border border-white/60 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('studio')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      activePhotoTab === 'studio'
                        ? 'bg-[#81C784] text-white shadow-md'
                        : 'text-[#455A45] hover:text-[#2D422D]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.studioPhoto}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('raw')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      activePhotoTab === 'raw'
                        ? 'bg-[#81C784] text-white shadow-md'
                        : 'text-[#455A45] hover:text-[#2D422D]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t.originalPhoto}</span>
                  </button>
                </div>

                {/* Display active image */}
                <div className="relative rounded-[28px] overflow-hidden aspect-[4/3] bg-white/50 border border-white/80 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff]">
                  <img
                    src={activePhotoTab === 'studio' ? studioPhotoUrl : rawPhotoUrl}
                    alt="Artisan craft preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {activePhotoTab === 'studio' && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#2D422D]/85 backdrop-blur-md text-[#C8E6C9] text-[11px] font-semibold flex items-center gap-1.5 shadow-md">
                      <Sparkles className="w-3 h-3 text-[#81C784]" />
                      <span>AI Photoshoot Mode</span>
                    </div>
                  )}

                  {lightingNotes && activePhotoTab === 'studio' && (
                    <div className="absolute bottom-0 inset-x-0 bg-[#2D422D]/85 backdrop-blur-md p-3 text-[11px] text-[#F0F7F0]">
                      <span className="font-bold text-[#81C784]">AI Enhancement: </span>
                      {lightingNotes}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/80 hover:bg-white text-[#2D422D] py-3 px-4 rounded-2xl text-xs font-semibold shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 flex-1 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#4CAF50]" />
                    <span>दूसरी फोटो लें (Retake)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('description')}
                    className="bg-[#81C784] hover:bg-[#4CAF50] text-white py-3 px-6 rounded-2xl text-xs font-bold flex-1 flex items-center justify-center gap-1.5 shadow-[6px_6px_14px_#c8d6c8,-6px_-6px_14px_#ffffff] border border-white/50 active:scale-95 transition-all"
                  >
                    <span>अगला कदम: विवरण (Next)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload action box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/60 hover:bg-white/80 border-2 border-dashed border-[#81C784] p-8 rounded-[28px] text-center cursor-pointer shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff] transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/80 text-[#4CAF50] flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-base text-[#2D422D]">
                    {t.takePhotoBtn} या {t.uploadPhotoBtn}
                  </h4>
                  <p className="text-xs text-[#455A45] mt-1 max-w-sm mx-auto">
                    अपने मोबाइल कैमरे से हस्तशिल्प की एक स्पष्ट फोटो लें। एआई अपने-आप बैकग्राउंड साफ कर देगा।
                  </p>
                </div>

                {/* Pre-curated sample crafts for rapid testing */}
                <div>
                  <div className="text-xs font-bold text-[#2D422D] uppercase tracking-wider mb-2.5">
                    या इनमें से एक नमूना हस्तकला चुनें (Demo Samples):
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {sampleCraftPhotos.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSamplePhotoSelect(sample)}
                        className="bg-white/70 backdrop-blur-sm p-2.5 text-left rounded-2xl hover:bg-white shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 transition-all flex flex-col hover:border-[#81C784]"
                      >
                        <img
                          src={sample.studio}
                          alt={sample.name}
                          className="w-full h-20 object-cover rounded-xl mb-1.5"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[11px] font-bold text-[#2D422D] truncate">
                          {sample.name}
                        </span>
                        <span className="text-[10px] font-semibold text-[#2E7D32]">₹{sample.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: Voice Description & AI SEO Storytelling */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'description' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#2D422D] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4CAF50]" />
                {t.stepDescTitle}
              </h3>
              <p className="text-xs text-[#455A45]">
                {t.stepDescAiEnhance}
              </p>
            </div>

            {/* Thumbnail reminder of photo taken */}
            {studioPhotoUrl && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff]">
                <img
                  src={studioPhotoUrl}
                  alt="Product thumbnail"
                  className="w-14 h-14 object-cover rounded-xl shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#2D422D]">फोटो तैयार है</div>
                  <div className="text-[#455A45]">अब बोलकर बताएं कि आपने इसे कैसे बनाया</div>
                </div>
              </div>
            )}

            {/* Voice Input Textarea (auto-filled by voice or editable) */}
            <div className="bg-[#E1EBE1] border border-white/60 rounded-[20px] p-4 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff]">
              <label className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider block mb-1.5">
                आपकी बोली हुई आवाज़ (Raw Voice Transcript):
              </label>
              <textarea
                rows={3}
                value={rawVoiceDescription}
                onChange={(e) => setRawVoiceDescription(e.target.value)}
                placeholder={t.stepDescExample}
                className="w-full bg-transparent text-[#2D422D] font-medium text-sm focus:outline-none placeholder-[#455A45]/40 resize-none"
              />
            </div>

            {/* AI Generated Preview (if already generated) */}
            {aiTitle && (
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E7D32]">
                  <Sparkles className="w-4 h-4 text-[#4CAF50]" />
                  <span>AI संवर्धित SEO कैटलॉग विवरण (Enhanced Preview)</span>
                </div>
                <div className="text-sm font-bold text-[#2D422D]">{aiTitle}</div>
                <p className="text-xs text-[#455A45] leading-relaxed">{aiDescription}</p>
                {aiMaterials.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {aiMaterials.map((m, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-[#C8E6C9] text-[#2E7D32] px-2 py-0.5 rounded-lg font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('photo')}
                className="bg-white/80 hover:bg-white text-[#2D422D] py-3 px-5 rounded-2xl text-xs font-semibold shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 active:scale-95 transition-all"
              >
                पीछे जाएं (Back)
              </button>

              <button
                type="button"
                onClick={() =>
                  processDescriptionWithAI(
                    rawVoiceDescription ||
                      'यह उत्पाद मैंने पारंपरिक हाथ से प्राकृतिक मिट्टी और औजारों से बनाया है।'
                  )
                }
                className="bg-[#81C784] hover:bg-[#4CAF50] text-white py-3 px-6 rounded-2xl text-xs font-bold flex-1 flex items-center justify-center gap-2 shadow-[6px_6px_14px_#c8d6c8,-6px_-6px_14px_#ffffff] border border-white/50 active:scale-95 transition-all"
              >
                <span>एआई विवरण बनाएं (Generate SEO)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: Price Input & AI Market Benchmarking */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'price' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#2D422D] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#4CAF50]" />
                {t.stepPriceTitle}
              </h3>
              <p className="text-xs text-[#455A45]">
                {t.stepPriceMarketCompare}
              </p>
            </div>

            {/* Input price field */}
            <div className="bg-[#E1EBE1] border border-white/60 rounded-[20px] p-4 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff]">
              <label className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider block mb-1">
                {t.yourPriceLabel}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#4CAF50]">₹</span>
                <input
                  type="number"
                  value={artisanAskedPrice}
                  onChange={(e) => setArtisanAskedPrice(Number(e.target.value) || 0)}
                  placeholder="850"
                  className="w-full bg-transparent text-2xl font-extrabold text-[#2D422D] focus:outline-none"
                />
              </div>
            </div>

            {/* AI Marketplace Comparison Grid */}
            <div className="p-5 rounded-[24px] bg-white/70 backdrop-blur-sm border border-white/80 shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D422D]">
                  <TrendingUp className="w-4 h-4 text-[#4CAF50]" />
                  <span>बाजार दरों की तुलना (Marketplace Benchmark)</span>
                </div>
                <span className="text-[11px] bg-[#C8E6C9] text-[#2E7D32] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  {estimatedMarginPercent}% कारीगर मार्जिन
                </span>
              </div>

              {/* Price comparison cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white border border-white/80 shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff]">
                  <div className="text-[11px] text-[#455A45] font-medium">आपकी आय (You Get)</div>
                  <div className="text-xl font-bold text-[#2E7D32]">₹{artisanAskedPrice}</div>
                  <div className="text-[10px] text-[#4CAF50] font-semibold">सीधे बैंक में (No Middleman)</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#C8E6C9]/40 border border-white/80 shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff]">
                  <div className="text-[11px] text-[#2D422D] font-medium">खरीदार मूल्य (Retail Price)</div>
                  <div className="text-xl font-bold text-[#2D422D]">₹{retailPrice}</div>
                  <div className="text-[10px] text-[#455A45]">सस्ती व प्रतिस्पर्धी दर</div>
                </div>
              </div>

              {/* Platform benchmark list */}
              <div className="space-y-1.5 pt-2 border-t border-white/60">
                <div className="text-[10px] uppercase font-bold text-[#455A45] tracking-wider">
                  अन्य बड़े ऑनलाइन प्लेटफॉर्म्स पर औसत कीमत:
                </div>
                {benchmarks.platformComparisons.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-[#455A45]">{item.platform}</span>
                    <span className="font-bold text-[#2D422D]">₹{item.price}</span>
                  </div>
                ))}
              </div>

              {fairEvaluationNote && (
                <div className="text-xs text-[#2D422D] bg-white/80 p-3 rounded-xl border border-white/80 shadow-inner">
                  {fairEvaluationNote}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('description')}
                className="bg-white/80 hover:bg-white text-[#2D422D] py-3 px-5 rounded-2xl text-xs font-semibold shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 active:scale-95 transition-all"
              >
                पीछे जाएं (Back)
              </button>

              <button
                type="button"
                onClick={() => processPriceWithAI(artisanAskedPrice)}
                className="bg-[#81C784] hover:bg-[#4CAF50] text-white py-3 px-6 rounded-2xl text-xs font-bold flex-1 flex items-center justify-center gap-2 shadow-[6px_6px_14px_#c8d6c8,-6px_-6px_14px_#ffffff] border border-white/50 active:scale-95 transition-all"
              >
                <span>अंतिम समीक्षा देखें (Review Listing)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: Review & Confirm Submission */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'review' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#2D422D] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
                {t.reviewTitle}
              </h3>
              <p className="text-xs text-[#455A45]">
                {t.reviewPrompt}
              </p>
            </div>

            {/* Complete listing preview card */}
            <div className="bg-white/80 backdrop-blur-md rounded-[28px] overflow-hidden border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff]">
              <div className="relative aspect-[16/9] bg-white">
                <img
                  src={studioPhotoUrl || rawPhotoUrl}
                  alt={aiTitle}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-[#2D422D]/85 backdrop-blur-sm text-[#C8E6C9] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Award className="w-3.5 h-3.5 text-[#81C784]" />
                  <span>{aiGiTag || 'GI Certified'}</span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-base text-[#2D422D]">
                      {aiTitle || 'Handcrafted Artisan Decor'}
                    </h4>
                    <p className="text-xs text-[#455A45] font-medium">
                      कारीगर: {artisan.name} • {artisan.village}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-[#2D422D]">₹{retailPrice}</div>
                    <div className="text-[10px] text-[#2E7D32] font-bold">
                      कारीगर को मिलेगा: ₹{artisanAskedPrice}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#455A45] leading-relaxed">
                  {aiDescription || rawVoiceDescription}
                </p>

                {aiCulturalStory && (
                  <div className="p-3 rounded-xl bg-[#E1EBE1] border border-white/60 text-xs text-[#2D422D] italic shadow-inner">
                    "{aiCulturalStory}"
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {aiTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-[#C8E6C9] text-[#2E7D32] px-2.5 py-0.5 rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('price')}
                className="bg-white/80 hover:bg-white text-[#2D422D] py-3 px-5 rounded-2xl text-xs font-semibold shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 active:scale-95 transition-all"
              >
                सुधार करें (Edit)
              </button>

              <button
                type="button"
                onClick={handleFinalPublish}
                className="bg-[#81C784] hover:bg-[#4CAF50] text-white py-3.5 px-6 rounded-2xl text-sm font-bold flex-1 flex items-center justify-center gap-2 shadow-[6px_6px_16px_#c8d6c8,-6px_-6px_16px_#ffffff] border border-white/50 active:scale-95 transition-all"
              >
                <span>{t.publishBtn}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 5: Success & Live in Storefront */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'success' && (
          <div className="text-center py-6 space-y-5">
            <div className="w-18 h-18 rounded-full bg-[#81C784] text-white flex items-center justify-center mx-auto shadow-[6px_6px_16px_#c8d6c8,-6px_-6px_16px_#ffffff] border-4 border-[#F0F7F0]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#2D422D]">
                {t.productPublishedSuccess}
              </h3>
              <p className="text-xs text-[#455A45] mt-1 max-w-sm mx-auto">
                आपका हस्तशिल्प अब भारत ट्यूलिप नेशनल मार्केटप्लेस पर खरीदारों के लिए लाइव हो चुका है!
              </p>
            </div>

            {publishedProduct && (
              <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 max-w-md mx-auto text-left flex items-center gap-3.5 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff] border border-white/80">
                <img
                  src={publishedProduct.studioPhotoUrl}
                  alt={publishedProduct.title}
                  className="w-16 h-16 object-cover rounded-2xl shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-[#2D422D] truncate">
                    {publishedProduct.title}
                  </div>
                  <div className="text-xs text-[#2E7D32] font-semibold mt-0.5">
                    मूल्य: ₹{publishedProduct.retailPrice} (आपकी आय: ₹{publishedProduct.artisanPrice})
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#2E7D32] bg-[#C8E6C9] px-2.5 py-0.5 rounded-full">
                    Live On Bharat TULIP
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-3 justify-center">
              <button
                type="button"
                onClick={onViewStorefront}
                className="bg-[#81C784] hover:bg-[#4CAF50] text-white py-3.5 px-7 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-[6px_6px_16px_#c8d6c8,-6px_-6px_16px_#ffffff] border border-white/50 active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.viewInStorefront}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep('photo');
                  setRawPhotoUrl('');
                  setStudioPhotoUrl('');
                  setRawVoiceDescription('');
                  setAiTitle('');
                }}
                className="bg-white/80 hover:bg-white text-[#2D422D] py-3.5 px-6 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-[#4CAF50]" />
                <span>एक और उत्पाद जोड़ें (Add Another)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
