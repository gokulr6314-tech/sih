import React, { useEffect, useState } from 'react';
import { Globe, Check, Sparkles, Volume2 } from 'lucide-react';
import { SupportedLanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../lib/languages';
import { SpeechService } from '../lib/speech';
import { VoiceAssistantOrb } from './VoiceAssistantOrb';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguageCode;
  onSelectLanguage: (lang: SupportedLanguageCode) => void;
  onProceed: (lang: SupportedLanguageCode) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorProps> = ({
  selectedLanguage = 'en',
  onSelectLanguage,
  onProceed,
  isModal = false,
  onClose,
}) => {
  const [activeLang, setActiveLang] = useState<SupportedLanguageCode>(selectedLanguage || 'en');

  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === activeLang) ||
    SUPPORTED_LANGUAGES.find((l) => l.code === 'en')!;

  // Speak initial prompt asking for language upon opening
  useEffect(() => {
    const timer = setTimeout(() => {
      SpeechService.speak(
        'Please say your language. कृपया अपनी भाषा बोलें।',
        'en'
      );
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleLanguageClick = (langCode: SupportedLanguageCode) => {
    setActiveLang(langCode);
    onSelectLanguage(langCode);
    onProceed(langCode);
  };

  const handleVoiceInput = (text: string) => {
    const lower = text.toLowerCase().trim();

    const matchMap: Record<SupportedLanguageCode, string[]> = {
      hi: ['hindi', 'hindustani', 'हिन्दी', 'हिंदी'],
      ta: ['tamil', 'thamizh', 'tamizh', 'தமிழ்'],
      te: ['telugu', 'thesugu', 'తెలుగు'],
      bn: ['bengali', 'bangla', 'বাংলা'],
      mr: ['marathi', 'मराठी'],
      gu: ['gujarati', 'gujrati', 'ગુજરાતી'],
      kn: ['kannada', 'kannad', 'ಕನ್ನಡ'],
      ml: ['malayalam', 'malayali', 'മലയാളം'],
      or: ['odia', 'oriya', 'ଓଡ଼ିଆ'],
      pa: ['punjabi', 'panjabi', 'ਪੰਜਾਬੀ'],
      en: ['english', 'angrezi', 'inglish'],
    };

    let matchedCode: SupportedLanguageCode | null = null;
    for (const [code, terms] of Object.entries(matchMap)) {
      if (terms.some((term) => lower.includes(term))) {
        matchedCode = code as SupportedLanguageCode;
        break;
      }
    }

    if (!matchedCode) {
      const found = SUPPORTED_LANGUAGES.find(
        (l) =>
          lower.includes(l.name.toLowerCase()) ||
          lower.includes(l.nativeName.toLowerCase()) ||
          lower.includes(l.code.toLowerCase())
      );
      if (found) matchedCode = found.code;
    }

    if (matchedCode) {
      setActiveLang(matchedCode);
      onSelectLanguage(matchedCode);
      onProceed(matchedCode);
    }
  };

  const spokenPrompt = 'Please say your language • कृपया अपनी भाषा बोलें • தயவுசெய்து உங்கள் மொழியைச் சொல்லுங்கள்';

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Voice Assistant Header Prompt */}
      <VoiceAssistantOrb
        currentPrompt={spokenPrompt}
        language={activeLang}
        onVoiceResult={handleVoiceInput}
        stepHint="Voice Language Selection"
        suggestedPhrases={['English', 'हिन्दी (Hindi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'বাংলা (Bengali)', 'मराठी (Marathi)']}
      />

      <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60 relative">
        {/* Close Button for Modal Mode */}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#2D422D] flex items-center justify-center font-bold text-sm shadow-[2px_2px_6px_#d1dbd1,-2px_-2px_6px_#ffffff] border border-white/80 transition-transform active:scale-95 cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/80 text-[#4CAF50] mb-3">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D422D]">
            Please say your language
          </h2>
          <p className="text-sm font-semibold text-[#2E7D32] mt-1">
            कृपया अपनी भाषा बोलें • தயவுசெய்து உங்கள் மொழியைச் சொல்லுங்கள்
          </p>
          <p className="text-xs text-[#455A45] mt-1.5 max-w-md mx-auto leading-relaxed">
            Speak into the microphone above or select your regional language below to get started.
          </p>
        </div>

        {/* 11 Indian Languages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = activeLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageClick(lang.code)}
                className={`p-4 rounded-[20px] text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#81C784] text-white shadow-[6px_6px_16px_#c8d6c8,-6px_-6px_16px_#ffffff] border border-white/60 scale-[1.02]'
                    : 'bg-white/70 backdrop-blur-sm text-[#2D422D] shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 hover:bg-white hover:border-[#81C784]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isSelected
                        ? 'bg-white/30 text-white'
                        : 'bg-[#C8E6C9] text-[#2E7D32]'
                    }`}
                  >
                    {lang.code}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-white text-[#2E7D32] flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div
                    className={`text-lg font-bold ${
                      isSelected ? 'text-white' : 'text-[#2D422D]'
                    }`}
                  >
                    {lang.nativeName}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      isSelected ? 'text-white/80' : 'text-[#455A45]'
                    }`}
                  >
                    {lang.name}
                  </div>
                </div>

                <div
                  className={`mt-2.5 pt-2 border-t flex items-center gap-1 text-[11px] ${
                    isSelected
                      ? 'border-white/30 text-white/90'
                      : 'border-emerald-100 text-[#2E7D32]'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span className="truncate">{lang.greetingText}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirmation Button */}
        <div className="mt-7 pt-4 border-t border-white/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-semibold text-[#455A45]">
            <span>
              Selected Language:{' '}
              <span className="text-[#2E7D32] font-bold">
                {currentLangConfig.nativeName} ({currentLangConfig.name})
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onProceed(activeLang)}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border bg-[#81C784] hover:bg-[#4CAF50] text-white shadow-[6px_6px_14px_#c8d6c8,-6px_-6px_14px_#ffffff] border-white/50 active:scale-95 cursor-pointer transition-all"
          >
            <span>
              Continue in {currentLangConfig.name}
            </span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
