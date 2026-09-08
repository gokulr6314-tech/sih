/**
 * Module 1 — Multilingual Real-Time Voice Engine
 * Language auto-detection helpers:
 *  - Detect the artisan's spoken language from raw transcript Unicode scripts
 *  - Resolve the most authentic available TTS voice with graceful fallback
 */

import { SupportedLanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from './languages';

export interface UnicodeRange {
  code: SupportedLanguageCode;
  ranges: [number, number][];
}

// Mapping of script codepoint bounds → supported language codes.
// Devanagari + Marathi often share script; we default Devanagari to Hindi but
// allow an explicit preference hint (e.g., an artisan-selected profile language).
export const SCRIPT_RANGES: UnicodeRange[] = [
  { code: 'hi', ranges: [[0x0900, 0x097f]] }, // Devanagari
  { code: 'bn', ranges: [[0x0980, 0x09ff]] }, // Bengali
  { code: 'or', ranges: [[0x0b00, 0x0b7f]] }, // Odia
  { code: 'ta', ranges: [[0x0b80, 0x0bff]] }, // Tamil
  { code: 'te', ranges: [[0x0c00, 0x0c7f]] }, // Telugu
  { code: 'kn', ranges: [[0x0c80, 0x0cff]] }, // Kannada
  { code: 'ml', ranges: [[0x0d00, 0x0d7f]] }, // Malayalam
  { code: 'pa', ranges: [[0x0a00, 0x0a7f]] }, // Gurmukhi
  { code: 'gu', ranges: [[0x0a80, 0x0aff]] }, // Gujarati
];

export function detectLanguageFromText(
  text: string,
  preference?: SupportedLanguageCode
): SupportedLanguageCode | null {
  if (!text || !text.trim()) return null;

  let score = 0;
  let winner: SupportedLanguageCode | null = null;
  let sampleCount = 0;

  for (const sample of text.trim().split(/\s+/).slice(0, 40)) {
    let matched: SupportedLanguageCode | null = null;
    for (const cp of sample) {
      const codePoint = cp.codePointAt(0)!;
      const rangeHit = SCRIPT_RANGES.find((entry) =>
        entry.ranges.some(([start, end]) => codePoint >= start && codePoint <= end)
      );
      if (rangeHit) {
        matched = rangeHit.code;
        break;
      }
    }

    if (!matched) continue;

    sampleCount += 1;
    if (matched === winner) {
      score += 1;
    } else if (score === 0) {
      winner = matched;
      score = 1;
    }
  }

  if (!winner || sampleCount === 0) {
    // No South-Asian script matched — assume English/Latin input.
    return null;
  }

  // Devanagari ambiguous between Hindi & Marathi — defer to explicit preference.
  if (winner === 'hi' && (preference === 'mr' || preference === 'hi')) {
    return preference;
  }

  return winner;
}

export function detectLanguageFromBrowser(): SupportedLanguageCode | null {
  if (typeof navigator === 'undefined') return null;
  const raw = navigator.language || (navigator as any).userLanguage || 'en-IN';
  const base = raw.split('-')[0].toLowerCase();
  const match = SUPPORTED_LANGUAGES.find((l) => l.code === base);
  return match ? match.code : 'en';
}

export interface ResolvedVoice {
  voice: SpeechSynthesisVoice | null;
  locale: string;
  matched: boolean;
  isFallback: boolean;
  fallbackReason?: 'no_voices' | 'no_native' | 'generic';
}

function getVoicesFromBrowser(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return (window.speechSynthesis.getVoices() as SpeechSynthesisVoice[]) || [];
}

export function resolveVoice(
  languageCode: SupportedLanguageCode,
  voices?: SpeechSynthesisVoice[]
): ResolvedVoice {
  const allVoices = voices ?? getVoicesFromBrowser();
  if (allVoices.length === 0) {
    return { voice: null, locale: 'en-IN', matched: false, isFallback: true, fallbackReason: 'no_voices' };
  }

  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === languageCode);
  const targetLocale = langConfig ? langConfig.speechLocale : 'en-IN';
  const base = targetLocale.split('-')[0];

  // 1. Exact regional match — most authentic voice e.g. "hi-IN"
  const exact = allVoices.find((v) => v.lang.toLowerCase() === targetLocale.toLowerCase());
  if (exact) return { voice: exact, locale: targetLocale, matched: true, isFallback: false };

  // 2. Base language match — e.g. any "hi" voice
  const baseMatch = allVoices.find((v) => v.lang.toLowerCase().startsWith(`${base}-`));
  if (baseMatch) return { voice: baseMatch, locale: baseMatch.lang, matched: true, isFallback: false };

  // 3. Fallback respecting language integrity:
  //    For native-language targets we NEVER force a mismatched English voice —
  //    that would read Hindi/Tamil/etc. text back in an English accent. Instead
  //    we return no voice so the TTS engine auto-selects from utterance.lang.
  //    English text is the only case where a generic English voice is assigned.
  if (base === 'en') {
    const en = allVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (en) return { voice: en, locale: en.lang, matched: true, isFallback: false };
  }

  return { voice: null, locale: targetLocale, matched: false, isFallback: true, fallbackReason: 'no_native' };
}

export function describeVoice(voice: SpeechSynthesisVoice | null): string {
  if (!voice) return 'System voice';
  return `${voice.name} (${voice.lang})`;
}

// Amharic-style warm-up: speak a silent utterance to unblock Chrome's
// SpeechSynthesis gate & force-prime available voices for spell-check of TTS.
export function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const readyVoices = synth.getVoices();
    if (readyVoices.length > 0) {
      resolve(readyVoices);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', finish, { once: true });
    window.setTimeout(finish, 1500);
  });
}

export function getConfirmationVerbs(languageCode: SupportedLanguageCode): {
  confirm: string[];
  deny: string[];
} {
  const map: Record<string, { confirm: string[]; deny: string[] }> = {
    hi: { confirm: ['हाँ', 'हां', 'प्रकाशित', 'ठीक है', 'करो'], deny: ['नहीं', 'रुको', 'बदलो'] },
    ta: { confirm: ['ஆம்', 'சரி', 'வெளியிடு'], deny: ['இல்லை', 'மாற்று', 'நிறுத்து'] },
    te: { confirm: ['అవును', 'సరే', 'ప్రచురించు'], deny: ['లేదు', 'మార్చు', 'ఆపు'] },
    bn: { confirm: ['হ্যাঁ', 'ঠিক আছে', 'প্রকাশ'], deny: ['না', 'বদলাও', 'থামো'] },
    mr: { confirm: ['होय', 'ठीक आहे', 'प्रकाशित'], deny: ['नाही', 'बदला', 'थांब'] },
    gu: { confirm: ['હા', 'બરાબર', 'પ્રકાશિત'], deny: ['ના', 'બદલો', 'રોકો'] },
    kn: { confirm: ['ಹೌದು', 'ಸರಿ', 'ಪ್ರಕಟಿಸು'], deny: ['ಇಲ್ಲ', 'ಬದಲಾಯಿಸಿ', 'ನಿಲ್ಲಿಸು'] },
    ml: { confirm: ['അതെ', 'ശരി', 'പ്രസിദ്ധീകരിക്കുക'], deny: ['ഇല്ല', 'മാറ്റുക', 'നിർത്തുക'] },
    or: { confirm: ['ହଁ', 'ଠିକ୍ ଅଛି', 'ପ୍ରକାଶ'], deny: ['ନା', 'ବଦଳାନ୍ତୁ', 'ଅଟକାନ୍ତୁ'] },
    pa: { confirm: ['ਹਾਂ', 'ਠੀਕ ਹੈ', 'ਪ੍ਰਕਾਸ਼ਿਤ'], deny: ['ਨਹੀਂ', 'ਬਦਲੋ', 'ਰੋਕੋ'] },
    en: { confirm: ['yes', 'publish', 'confirm', 'ok', 'fine'], deny: ['no', 'cancel', 'wait', 'not'] },
  };
  return map[languageCode] || map.en;
}