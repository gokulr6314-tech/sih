/**
 * Module 2 — Voice Listing Assistant
 * A hands-free, 4-turn voice interview that catalogs a full product:
 *   Turn 1 → product name & category
 *   Turn 2 → materials & technique
 *   Turn 3 → visual capture hand-off (smart camera + background removal)
 *   Turn 4 → fair pricing negotiation & approval
 * Then auto-publishes the listing with a machine-first SEO package + JSON-LD.
 *
 * Engineering constraints honored:
 *  - Interview state lives in refs → survives mid-interview language switching.
 *  - Async image processing / audio analysis never blocks the UI thread.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  FileJson,
  Image as ImageIcon,
  Loader2,
  Mic,
  MicOff,
  PackageCheck,
  Play,
  Sparkles,
  Store,
  Volume2,
  X,
} from 'lucide-react';
import { ArtisanProfile, ProductListing, SupportedLanguageCode } from '../../types';
import { SpeechService } from '../../lib/speech';
import { getConfirmationVerbs, preloadVoices } from '../../lib/voiceLanguage';
import { useVoiceActivityDetector } from './vad';
import { SAMPLE_CAPTURES, getAssistantUi, getTurnPrompt } from './languageStrings';
import CameraStudio from '../vision/CameraStudio';
import BackgroundRemover from '../vision/BackgroundRemover';
import { LightingSample } from '../vision/lightingDetector';
import { generateSeo, inferCraftCategory, extractPriceFromSpeech } from '../../services/seo/seoEngine';
import { ListingDraftInput } from '../../services/seo/types';
import { buildProductJsonLd, serializeJsonLd } from '../../services/seo/jsonld';
import { analyzeMarketPricing } from '../../services/pricing/marketPricing';
import { PricingIntelligence } from '../../services/pricing/types';

export type AssistantStep =
  | 'intro'
  | 'product'
  | 'materials'
  | 'camera'
  | 'pricing'
  | 'review'
  | 'published';

export interface SeoDraft {
  title: string;
  metaTitle: string;
  description: string;
  altText: string;
  tags: string[];
  giTagStatus: string;
  culturalStory: string;
  craftTechnique: string;
  materials: string[];
  dimensions: string;
  careInstructions: string;
  jsonLdString: string;
  jsonLd: object;
}

interface InternalDraft {
  productName: string;
  craftCategory: string;
  materials: string[];
  technique: string;
  rawPhoto: string;
  studioPhoto: string;
  lighting: LightingSample | null;
  askedPrice: number;
  turns: string[];
}

const EMPTY_DRAFT: InternalDraft = {
  productName: '',
  craftCategory: '',
  materials: [],
  technique: '',
  rawPhoto: '',
  studioPhoto: '',
  lighting: null,
  askedPrice: 0,
  turns: [],
};

const STEP_ORDER: AssistantStep[] = ['intro', 'product', 'materials', 'camera', 'pricing', 'review', 'published'];

interface VoiceListingAssistantProps {
  open: boolean;
  onClose: () => void;
  artisan: ArtisanProfile | null;
  language: SupportedLanguageCode;
  isMuted?: boolean;
  onProductCreated: (product: ProductListing) => void;
  onViewInStore?: () => void;
}

export default function VoiceListingAssistant({
  open,
  onClose,
  artisan,
  language,
  isMuted,
  onProductCreated,
  onViewInStore,
}: VoiceListingAssistantProps) {
  const ui = getAssistantUi(language);

  const [step, setStep] = useState<AssistantStep>('intro');
  const [draft, setDraft] = useState<InternalDraft>(EMPTY_DRAFT);
  const [pricing, setPricing] = useState<PricingIntelligence | null>(null);
  const [seo, setSeo] = useState<SeoDraft | null>(null);
  const [vadOn, setVadOn] = useState(false);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [showJsonLd, setShowJsonLd] = useState(false);

  const draftRef = useRef<InternalDraft>({ ...EMPTY_DRAFT });
  const stepRef = useRef<AssistantStep>('intro');
  const languageRef = useRef<SupportedLanguageCode>(language);
  const listenTimerRef = useRef<number | null>(null);
  const pricingRef = useRef<PricingIntelligence | null>(null);
  const seoRef = useRef<SeoDraft | null>(null);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const setDraftPartial = useCallback((patch: Partial<InternalDraft>) => {
    draftRef.current = { ...draftRef.current, ...patch };
    setDraft(draftRef.current);
  }, []);

  const goToStep = useCallback((next: AssistantStep) => {
    stepRef.current = next;
    setStep(next);
  }, []);

  const clearListenTimer = useCallback(() => {
    if (listenTimerRef.current !== null) {
      window.clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  }, []);

  const haltMic = useCallback(() => {
    clearListenTimer();
    setVadOn(false);
  }, [clearListenTimer]);

  const speakWithAutoListen = useCallback(
    (prompt: string, delayMs = 850) => {
      haltMic();
      if (typeof window === 'undefined') return;
      const muted = isMuted;
      const armListen = () => {
        clearListenTimer();
        listenTimerRef.current = window.setTimeout(() => setVadOn(true), delayMs);
      };
      if (muted || !('speechSynthesis' in window)) {
        setTtsSpeaking(false);
        armListen();
        return;
      }
      setTtsSpeaking(true);
      SpeechService.speak(prompt, languageRef.current, undefined, () => {
        setTtsSpeaking(false);
        armListen();
      });
    },
    [haltMic, clearListenTimer, isMuted]
  );

  // ---------------------------------------------------------------
  // Pricing intelligence & SEO engine (async, deterministic fallback)
  // ---------------------------------------------------------------
  const computePricingIntelligence = useCallback(
    async (proposedPrice: number) => {
      setAiBusy(true);
      const d = draftRef.current;
      const local = analyzeMarketPricing({
        craftCategory: d.craftCategory,
        productName: d.productName,
        materials: d.materials,
        askedPrice: proposedPrice > 0 ? proposedPrice : d.askedPrice,
        artisanName: artisan?.name,
      });
      pricingRef.current = local;
      setPricing(local);
      try {
        const res = await fetch('/api/ai/market-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            craftCategory: d.craftCategory,
            productName: d.productName,
            materials: d.materials,
            artisanAskedPrice: proposedPrice > 0 ? proposedPrice : d.askedPrice,
            artisanName: artisan?.name,
            village: artisan?.village,
            state: artisan?.state,
          }),
        });
        const data = await res.json();
        if (data && typeof data.marketMedian === 'number') {
          pricingRef.current = data;
          setPricing(data);
        }
      } catch {
        // Deterministic pricing already in place.
      } finally {
        setAiBusy(false);
      }
    },
    [artisan]
  );

  const computeSeo = useCallback(async () => {
    setAiBusy(true);
    const d = draftRef.current;
    const negotiated = pricingRef.current?.artisanAskedPrice || d.askedPrice || 0;
    const input: ListingDraftInput = {
      productName: d.productName,
      craftCategory: d.craftCategory,
      materials: d.materials,
      technique: d.technique,
      region: `${artisan?.village || ''}, ${artisan?.state || ''}`.replace(/^,\s*/, ''),
      askedPrice: negotiated,
    };
    let generated = generateSeo(input);
    try {
      const res = await fetch('/api/ai/seo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, voiceTranscript: d.turns.join(' ') }),
      });
      const data = await res.json();
      if (data && typeof data.title === 'string') generated = data;
    } catch {
      // Deterministic SEO stays.
    }

    const imageUrl = d.studioPhoto || d.rawPhoto || '';
    const jsonLd = buildProductJsonLd({
      name: generated.title,
      description: generated.description,
      image: imageUrl,
      sku: `SKU-${(d.craftCategory || 'Handicraft').replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      price: negotiated,
      category: d.craftCategory,
      material: generated.materials?.[0] || 'Natural materials',
      craftRegion: `${artisan?.village || ''}, ${artisan?.state || ''}`,
      tags: Array.isArray(generated.tags) ? generated.tags : [],
      sellerName: artisan?.name || 'Bharat TULIP Artisan',
      ratingValue: 4.8,
      reviewCount: 12,
    });
    const finalSeo: SeoDraft = {
      ...generated,
      jsonLd,
      jsonLdString: serializeJsonLd(jsonLd),
    };
    seoRef.current = finalSeo;
    setSeo(finalSeo);
    setAiBusy(false);
  }, [artisan]);

  const buildPricingPrompt = useCallback(
    (lang: SupportedLanguageCode, d: InternalDraft, p: PricingIntelligence | null): string => {
      if (!p) return getTurnPrompt('pricing', lang, { product: d.productName });
      return getTurnPrompt('pricing', lang, {
        product: d.productName,
        price: String(p.artisanAskedPrice || d.askedPrice),
        target: String(p.competitiveTarget),
        median: String(p.marketMedian),
      });
    },
    []
  );

  const advanceTo = useCallback(
    (next: AssistantStep) => {
      if (next === 'pricing') {
        const provisional = analyzeMarketPricing({
          craftCategory: draftRef.current.craftCategory,
          productName: draftRef.current.productName,
          materials: draftRef.current.materials,
          askedPrice: 0,
        });
        const proposed = draftRef.current.askedPrice > 0 ? draftRef.current.askedPrice : provisional.competitiveTarget;
        if (draftRef.current.askedPrice <= 0) setDraftPartial({ askedPrice: proposed });
        computePricingIntelligence(proposed).then(() => {
          goToStep('pricing');
          speakWithAutoListen(
            buildPricingPrompt(languageRef.current, draftRef.current, pricingRef.current),
            900
          );
        });
        return;
      }
      if (next === 'materials') {
        goToStep(next);
        speakWithAutoListen(getTurnPrompt(next, languageRef.current, { product: draftRef.current.productName }));
        return;
      }
      if (next === 'product') {
        goToStep(next);
        speakWithAutoListen(getTurnPrompt(next, languageRef.current));
        return;
      }
      if (next === 'camera') {
        goToStep(next);
        speakWithAutoListen(getTurnPrompt(next, languageRef.current));
        return;
      }
      if (next === 'review') {
        goToStep(next);
        computeSeo();
        const p = pricingRef.current;
        speakWithAutoListen(
          getTurnPrompt(next, languageRef.current, {
            product: draftRef.current.productName,
            target: String(p?.competitiveTarget ?? 0),
          }),
          1000
        );
        return;
      }
      goToStep(next);
    },
    [buildPricingPrompt, computePricingIntelligence, computeSeo, goToStep, setDraftPartial, speakWithAutoListen]
  );

  const publishListing = useCallback(() => {
    const d = draftRef.current;
    const p = pricingRef.current;
    const s = seoRef.current;
    const negotiated = p?.artisanAskedPrice || d.askedPrice;
    const retail = p?.retailPrice || Math.round((negotiated || 0) * 1.35);
    const floor = p?.floorPrice || Math.round((negotiated || 0) * 0.5);
    const margin = Math.min(90, Math.max(15, Math.round(((retail - floor) / Math.max(1, retail)) * 100)));

    const defaultRaw = SAMPLE_CAPTURES[0].raw;
    const defaultStudio = SAMPLE_CAPTURES[0].studio;

    const newProduct: ProductListing = {
      id: `prod_assist_${Date.now()}`,
      artisanId: artisan?.id || 'artisan_001',
      artisanName: artisan?.name || 'Ramvati Devi',
      artisanCraft: d.craftCategory || 'Handicraft',
      artisanVillage: artisan?.village || 'Gorakhpur',
      artisanState: artisan?.state || 'Uttar Pradesh',
      originalLanguage: language,
      rawVoiceTranscript: d.turns.join(' | '),
      rawPhotoUrl: d.rawPhoto || defaultRaw,
      studioPhotoUrl: d.studioPhoto || defaultStudio,
      imageEnhanced: true,
      title: s?.title || `Handmade ${d.productName}`,
      seoTitle: s?.metaTitle || `Authentic ${d.productName} | Handmade Artisan`,
      description:
        s?.description ||
        `Meticulously handcrafted ${d.productName} using ${d.materials.join(', ')}, created through ${d.technique}.`,
      culturalStory: s?.culturalStory || `Carrying generations of regional folk artistry, ${d.productName} preserves timeless craft.`,
      craftTechnique: s?.craftTechnique || d.technique || 'Traditional Handcrafting',
      materials: s?.materials?.length ? s.materials : d.materials,
      dimensions: s?.dimensions || 'Standard Artisan Sizing',
      careInstructions: s?.careInstructions || 'Wipe with a dry soft cloth; keep away from direct water.',
      tags: s?.tags?.length ? s.tags : ['Handcrafted', 'Artisan Direct', 'Made in India'],
      giTagStatus: s?.giTagStatus || 'GI Certified Craft Candidate',
      artisanPrice: negotiated || 0,
      suggestedMarketPrice: p?.competitiveTarget ?? Math.round((negotiated || 0) * 1.5),
      retailPrice: retail,
      estimatedMarginPercent: margin,
      competitorAveragePrice: p?.marketMedian ?? Math.round((negotiated || 0) * 1.4),
      marketPriceBenchmark: p?.benchmark || {
        low: floor,
        median: p?.marketMedian ?? Math.round((negotiated || 0) * 1.4),
        high: p?.marketHigh ?? Math.round((negotiated || 0) * 1.8),
        platformComparisons: [],
      },
      stockQuantity: 10,
      status: 'published',
      views: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };

    onProductCreated(newProduct);
    goToStep('published');
    speakWithAutoListen(
      getTurnPrompt('published', languageRef.current, {
        name: artisan?.name?.split(' ')[0] || 'friend',
      }),
      0
    );
  }, [artisan, language, onProductCreated, goToStep, speakWithAutoListen]);

  const handleCaptured = useCallback(
    (rawDataUrl: string, lighting: LightingSample) => {
      clearListenTimer();
      setVadOn(false);
      setDraftPartial({ rawPhoto: rawDataUrl, lighting, studioPhoto: '' });
    },
    [clearListenTimer, setDraftPartial]
  );

  const handlePhotoReady = useCallback(
    (studioUrl: string) => {
      setDraftPartial({ studioPhoto: studioUrl });
      clearListenTimer();
      listenTimerRef.current = window.setTimeout(() => setVadOn(true), 0);
    },
    [clearListenTimer, setDraftPartial]
  );

  const retryReviewAudio = useCallback(() => {
    speakWithAutoListen(
      getTurnPrompt('review', languageRef.current, { product: draftRef.current.productName })
    );
  }, [speakWithAutoListen]);

  // ---------------------------------------------------------------
  // Voice activity detector — all handlers declared before this hook
  // ---------------------------------------------------------------
  const vads = useVoiceActivityDetector({
    language,
    enabled: vadOn && open,
    onUtterance: (text) => {
      const currentStep = stepRef.current;
      const draftData = draftRef.current;
      const lang = languageRef.current;
      const confirm = getConfirmationVerbs(lang).confirm;
      const deny = getConfirmationVerbs(lang).deny;
      const say = (prompt: string) => speakWithAutoListen(prompt);
      const lower = text.toLowerCase();

      if (currentStep === 'product') {
        const name = text.replace(/\.$/, '').trim().slice(0, 90);
        if (!name) {
          say(getTurnPrompt('product', lang));
          return;
        }
        setDraftPartial({
          productName: name,
          craftCategory: inferCraftCategory(name, text),
          turns: [...draftData.turns, text],
        });
        haltMic();
        advanceTo('materials');
      } else if (currentStep === 'materials') {
        const segments = text
          .split(/[,।]|\b(?:and|और|এবং|மற்றும்|మరియు|आणि|અને|ഒപ്പം)\b/i)
          .map((s) => s.trim())
          .filter(Boolean);
        const materials = segments.length > 1 ? segments.slice(0, 3) : [text.trim()];
        setDraftPartial({
          materials: materials.length ? materials : ['Natural materials'],
          technique: text.trim().slice(0, 140),
          craftCategory: inferCraftCategory(draftData.productName, `${draftData.productName} ${text}`),
          turns: [...draftData.turns, text],
        });
        haltMic();
        advanceTo('camera');
      } else if (currentStep === 'camera') {
        if (
          draftData.rawPhoto &&
          confirm.some((w) => lower.includes(w.toLowerCase()))
        ) {
          haltMic();
          advanceTo('pricing');
        }
      } else if (currentStep === 'pricing') {
        if (deny.some((w) => lower.includes(w.toLowerCase()))) {
          say(buildPricingPrompt(lang, draftData, pricingRef.current));
          return;
        }
        if (lower.includes('repeat') || lower.includes('फिर') || lower.includes('மீண்டும்')) {
          say(buildPricingPrompt(lang, draftData, pricingRef.current));
          return;
        }
        const amount = extractPriceFromSpeech(text);
        if (amount && amount >= 50) {
          setDraftPartial({ askedPrice: amount, turns: [...draftData.turns, text] });
          haltMic();
          computePricingIntelligence(amount).then(() => advanceTo('review'));
        } else {
          say(buildPricingPrompt(lang, draftData, pricingRef.current));
        }
      } else if (currentStep === 'review') {
        if (confirm.some((w) => lower.includes(w.toLowerCase()))) {
          publishListing();
        } else if (deny.some((w) => lower.includes(w.toLowerCase()))) {
          haltMic();
          goToStep('pricing');
        }
      }
    },
    onInterim: () => {},
  });

  // Reset interview state & greet on open
  useEffect(() => {
    if (!open) return;
    draftRef.current = { ...EMPTY_DRAFT };
    setDraft({ ...EMPTY_DRAFT });
    pricingRef.current = null;
    seoRef.current = null;
    setPricing(null);
    setSeo(null);
    setShowJsonLd(false);
    goToStep('intro');
    preloadVoices();
    speakWithAutoListen(
      getTurnPrompt('intro', languageRef.current, {
        name: artisan?.name?.split(' ')[0] || 'friend',
      })
    );
    return () => {
      haltMic();
      SpeechService.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-[#0a1b12]/70 backdrop-blur-md animate-fadeIn cursor-pointer"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[86vh] overflow-y-auto bg-[#0e2118]/95 backdrop-blur-2xl text-white rounded-t-3xl sm:rounded-3xl border border-emerald-400/25 shadow-[0_-10px_50px_rgba(0,0,0,0.55),0_0_60px_rgba(16,185,129,0.12)] animate-slideUp p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 grid place-items-center">
              <Volume2 size={18} />
            </span>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">{ui.title}</h2>
              <p className="text-[11px] text-emerald-200/70">
                {ui.subtitle} · Step {stepIndex}/6
              </p>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider">
              {language}
            </span>
          </div>
          <button
            onClick={() => {
              SpeechService.stopSpeaking();
              haltMic();
              onClose();
            }}
            aria-label="Close assistant"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Intro / Start card */}
        {step === 'intro' && (
          <div className="flex flex-col items-center text-center py-8">
            <div
              className={`w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 grid place-items-center mb-4 ${
                ttsSpeaking ? 'animate-pulse' : 'iso-voice-pulse'
              }`}
            >
              <Mic size={28} />
            </div>
            <h3 className="text-lg font-bold mb-1.5">
              {artisan?.name?.split(' ')[0] || 'Friend'},{' '}
              {getTurnPrompt('intro', language, { name: artisan?.name?.split(' ')[0] || 'friend' }).split('.')[0].replace(/नमस्ते|வணக்கம்|నమస్కారం|নমস্কার|नमस्कार|નમસ્તે|ਨਮਸਤੇ/g, '').trim()}
            </h3>
            <p className="text-[13px] text-emerald-100/70 max-w-sm leading-relaxed mb-6">{ui.privacyNote}</p>
            <button
              onClick={() => advanceTo('product')}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#0a1b12] px-7 py-3.5 text-sm font-black shadow-lg"
            >
              <Play size={16} />
              {ui.start}
            </button>
          </div>
        )}

        {/* Turn 1: Product name */}
        {step === 'product' && (
          <InterviewTurn
            label={ui.productName}
            icon={<PackageCheck size={18} />}
            transcript={draft.turns[draft.turns.length - 1]}
            listening={vads.listening}
            interim={vads.interim}
            ttsSpeaking={ttsSpeaking}
          />
        )}

        {/* Turn 2: Materials & technique */}
        {step === 'materials' && (
          <InterviewTurn
            label={ui.materials}
            icon={<ImageIcon size={18} />}
            transcript={draft.turns[draft.turns.length - 1]}
            listening={vads.listening}
            interim={vads.interim}
            ttsSpeaking={ttsSpeaking}
          />
        )}

        {/* Turn 3: Camera hand-off */}
        {step === 'camera' && (
          <div className="space-y-3">
            <p className="text-[12px] text-emerald-100/80 leading-relaxed">
              {getTurnPrompt('camera', language, { product: draft.productName })}
            </p>
            {!draft.rawPhoto ? (
              <>
                <CameraStudio language={language} onCaptured={handleCaptured} captureLabel={ui.useCamera} />
                <div>
                  <p className="text-[11px] text-emerald-200/60 font-semibold uppercase tracking-wider mb-2">
                    {ui.fallbackCamera}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {SAMPLE_CAPTURES.map((sample) => (
                      <button
                        key={sample.name}
                        onClick={() =>
                          handleCaptured(sample.raw, {
                            luminance: 160,
                            status: 'ideal',
                            message: 'Perfect lighting — hold steady.',
                            centered: true,
                            timestamp: Date.now(),
                          })
                        }
                        className="rounded-xl overflow-hidden border border-white/15 hover:border-emerald-400/60 transition-colors group"
                      >
                        <img
                          src={sample.studio}
                          alt={sample.name}
                          className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="block text-[10px] font-bold truncate px-1.5 py-1 bg-white/5">{sample.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <BackgroundRemover
                  language={language}
                  sourceDataUrl={draft.rawPhoto}
                  craftType={draft.craftCategory}
                  productTitle={draft.productName}
                  onComplete={handlePhotoReady}
                  onSkip={() => handlePhotoReady(draft.rawPhoto)}
                />
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDraftPartial({ rawPhoto: '', studioPhoto: '' })}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/20 text-white/80 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                  >
                    <ChevronLeft size={13} />
                    {ui.retake}
                  </button>
                  <button
                    onClick={() => advanceTo('pricing')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0a1b12] px-4 py-2 text-xs font-black"
                  >
                    {ui.continueCta}
                    <ChevronRight size={13} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Turn 4: Pricing negotiation */}
        {step === 'pricing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[12px] text-emerald-100/80">
              {aiBusy && <Loader2 size={13} className="animate-spin text-emerald-300" />}
              <span>{ui.pricingTitle}</span>
            </div>

            {pricing ? (
              <>
                <div className="space-y-2.5">
                  {[
                    { label: ui.floorLabel, value: pricing.floorPrice, color: 'bg-slate-400' },
                    { label: ui.medianLabel, value: pricing.marketMedian, color: 'bg-amber-400' },
                    { label: ui.targetLabel, value: pricing.competitiveTarget, color: 'bg-emerald-400' },
                    { label: 'Market High', value: pricing.marketHigh, color: 'bg-teal-300' },
                  ].map((row) => {
                    const max = pricing.marketHigh || 1;
                    return (
                      <div key={row.label} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-[11px] text-emerald-100/70">{row.label}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.color}`}
                            style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm font-black">₹{row.value}</span>
                      </div>
                    );
                  })}
                </div>

                {pricing.anomaly.isAnomaly && pricing.anomaly.suggestedRange && (
                  <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2.5">
                    <p className="text-[11px] text-amber-200 font-bold">{ui.anomalyWarning}</p>
                    <p className="text-[11px] text-amber-100/80 mt-0.5">
                      {pricing.anomaly.message} Recommended:{' '}
                      <span className="font-black">
                        ₹{pricing.anomaly.suggestedRange.min}–₹{pricing.anomaly.suggestedRange.max}
                      </span>
                    </p>
                  </div>
                )}

                <p className="text-[12px] text-emerald-100/85 leading-relaxed">{pricing.fairPriceEvaluation}</p>

                <div className="rounded-xl border border-white/10 bg-white/5">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-200/70 border-b border-white/10">
                    {ui.platformCompare}
                  </p>
                  {pricing.benchmark.platformComparisons.map((cmp) => (
                    <div
                      key={cmp.platform}
                      className="flex items-center justify-between px-3 py-1.5 text-[12px] border-b border-white/5 last:border-0"
                    >
                      <span className="text-emerald-100/70">{cmp.platform}</span>
                      <span className="font-bold">₹{cmp.price}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[pricing.competitiveTarget, pricing.marketMedian, pricing.marketHigh].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setDraftPartial({ askedPrice: opt });
                        haltMic();
                        computePricingIntelligence(opt).then(() => advanceTo('review'));
                      }}
                      className="rounded-full border border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/20 px-3.5 py-1.5 text-xs font-bold"
                    >
                      ₹{opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-emerald-100/60">
                <Loader2 size={20} className="animate-spin inline mr-2" />
                Calculating fair market price…
              </div>
            )}
          </div>
        )}

        {/* Review: SEO preview + publish */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-extrabold">
                <Sparkles size={15} className="text-emerald-300" />
                {ui.reviewTitle}
              </h3>
              <button
                onClick={retryReviewAudio}
                className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                <Volume2 size={13} /> Replay
              </button>
            </div>

            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10">
                <img
                  src={draft.studioPhoto || draft.rawPhoto}
                  alt="Listing preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{seo?.title || draft.productName}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                  <BadgeCheck size={11} /> Meta ≤60 chars · {seo?.metaTitle?.length ?? 0} chars
                </p>
                <p className="text-[11px] text-emerald-100/70 mt-1 leading-relaxed line-clamp-3">{seo?.description}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <ImageIcon size={11} /> Image alt text
              </p>
              <p className="text-[12px] text-emerald-100/85 bg-white/5 rounded-lg px-3 py-2">{seo?.altText}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {seo?.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-400/15 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                onClick={() => setShowJsonLd((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-emerald-200/80"
              >
                <span className="inline-flex items-center gap-1.5">
                  <FileJson size={12} /> Structured Data (schema.org/Product)
                </span>
                <span>{showJsonLd ? 'Hide' : 'Show'}</span>
              </button>
              {showJsonLd && (
                <pre className="text-[10px] leading-relaxed px-3 pb-3 text-emerald-100/70 overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {JSON.stringify(seo?.jsonLd ?? {}, null, 2)}
                </pre>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: ui.medianLabel, value: `₹${pricing?.marketMedian ?? 0}` },
                { label: ui.targetLabel, value: `₹${pricing?.competitiveTarget ?? 0}` },
                { label: 'Your Price', value: `₹${pricing?.artisanAskedPrice ?? draft.askedPrice}` },
              ].map((cell) => (
                <div key={cell.label} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-200/60 font-bold">{cell.label}</p>
                  <p className="text-sm font-black text-emerald-300">{cell.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => goToStep('pricing')}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/20 text-white/80 px-4 py-3 text-xs font-bold hover:bg-white/10"
              >
                <ChevronLeft size={13} /> {ui.continueCta}
              </button>
              <button
                onClick={publishListing}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0a1b12] px-4 py-3 text-sm font-black"
              >
                <PackageCheck size={16} /> {ui.publish}
              </button>
            </div>
          </div>
        )}

        {/* Published */}
        {step === 'published' && (
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center mb-4 animate-pulse">
              <Check size={40} strokeWidth={3} className="text-[#0a1b12]" />
            </div>
            <h3 className="text-xl font-black">{ui.publishedTitle}</h3>
            <p className="text-[13px] text-emerald-100/75 mt-1 mb-6 max-w-xs">{ui.publishedBody}</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-white/20 text-white/90 px-5 py-3 text-xs font-bold hover:bg-white/10"
              >
                {ui.close}
              </button>
              {onViewInStore && (
                <button
                  onClick={() => {
                    onClose();
                    onViewInStore();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0a1b12] px-5 py-3 text-xs font-black"
                >
                  <Store size={14} /> {ui.viewInStore}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Voice status bar */}
        {(step === 'product' || step === 'materials' || step === 'pricing' || step === 'review') && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5">
            <button
              onClick={() => {
                if (vadOn) haltMic();
                else setVadOn(true);
              }}
              className={`relative rounded-full p-2.5 transition-colors ${
                vadOn ? 'bg-emerald-500 text-[#0a1b12] iso-voice-pulse' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
              aria-label="Toggle listening"
            >
              {vadOn ? <Mic size={15} /> : <MicOff size={15} />}
            </button>
            <div className="min-w-0 flex-1">
              {ttsSpeaking ? (
                <span className="flex items-center gap-1.5 text-[12px] text-emerald-200/80">
                  <Volume2 size={12} className="animate-pulse" /> {ui.speaking}
                </span>
              ) : vadOn ? (
                <>
                  <p className="text-[12px] text-emerald-200/90 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    {vads.speaking ? ui.speaking : ui.listening}
                  </p>
                  {vads.interim && <p className="text-[11px] text-emerald-100/60 truncate mt-0.5">“{vads.interim}”</p>}
                </>
              ) : (
                <span className="text-[12px] text-white/50">{ui.subtitle}</span>
              )}
            </div>
            {step === 'pricing' && <span className="text-[10px] text-emerald-200/60">{ui.repeatHint}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function InterviewTurn({
  label,
  icon,
  transcript,
  listening,
  interim,
  ttsSpeaking,
}: {
  label: string;
  icon: ReactNode;
  transcript?: string;
  listening: boolean;
  interim: string;
  ttsSpeaking: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/80 to-teal-400/80 grid place-items-center mb-3 ${
          listening && !ttsSpeaking ? 'iso-voice-pulse' : ''
        }`}
      >
        {icon}
      </div>
      <p className="text-[12px] text-emerald-200/70 uppercase tracking-widest font-bold mb-1">{label}</p>
      {transcript ? (
        <p className="text-[13px] text-white/85 max-w-md leading-relaxed mt-1">“{transcript}”</p>
      ) : (
        <p className="text-[12px] text-emerald-100/50 mt-1">
          {ttsSpeaking ? 'Speaking…' : listening ? 'Listening…' : 'Ready'}
        </p>
      )}
      {interim && <p className="text-[12px] text-emerald-200/70 mt-2">“{interim}”</p>}
    </div>
  );
}