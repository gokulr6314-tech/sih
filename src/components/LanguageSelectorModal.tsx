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
    <div className="w-full max-w-2xl mx-auto py-1 sm:py-2">
      {/* Voice Assistant Header Prompt */}
      <VoiceAssistantOrb
        currentPrompt={spokenPrompt}
        language={activeLang}
        onVoiceResult={handleVoiceInput}
        stepHint="Voice Language Selection"
        suggestedPhrases={['English', 'हिन्दी (Hindi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'বাংলা (Bengali)', 'मराठी (Marathi)']}
      />

      <div className="bg-[#F0F7F0]/95 backdrop-blur-md rounded-2xl sm:rounded-[32px] p-4 sm:p-7 shadow-[8px_8px_20px_#d1dbd1,-8px_-8px_20px_#ffffff] border border-white/60 relative">
        {/* Close Button for Modal Mode */}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white text-[#2D422D] flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm border border-white/80 transition-transform active:scale-95 cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        )}

        <div className="text-center mb-3 sm:mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white shadow-sm border border-white/80 text-[#4CAF50] mb-2 sm:mb-2.5">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#2D422D]">
            Please say your language
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#2E7D32] mt-0.5">
            कृपया अपनी भाषा बोलें • தயவுசெய்து உங்கள் மொழியைச் சொல்லுங்கள்
          </p>
          <p className="hidden sm:block text-xs text-[#455A45] mt-1 max-w-md mx-auto leading-relaxed">
            Speak into the microphone above or select your regional language below to get started.
          </p>
        </div>

        {/* 11 Indian Languages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = activeLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageClick(lang.code)}
                className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-[18px] text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#81C784] text-white shadow-[4px_4px_12px_#c8d6c8,-4px_-4px_12px_#ffffff] border border-white/60 scale-[1.01]'
                    : 'bg-white/75 backdrop-blur-sm text-[#2D422D] shadow-[2px_2px_8px_#d1dbd1,-2px_-2px_8px_#ffffff] border border-white/80 hover:bg-white hover:border-[#81C784]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      isSelected
                        ? 'bg-white/30 text-white'
                        : 'bg-[#C8E6C9] text-[#2E7D32]'
                    }`}
                  >
                    {lang.code}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-[#2E7D32] flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                  )}
                </div>

                <div className="mt-1.5 sm:mt-2">
                  <div
                    className={`text-sm sm:text-base font-bold leading-snug ${
                      isSelected ? 'text-white' : 'text-[#2D422D]'
                    }`}
                  >
                    {lang.nativeName}
                  </div>
                  <div
                    className={`text-[10px] sm:text-xs font-medium ${
                      isSelected ? 'text-white/80' : 'text-[#455A45]'
                    }`}
                  >
                    {lang.name}
                  </div>
                </div>

                <div
                  className={`mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t flex items-center gap-1 text-[10px] sm:text-[11px] ${
                    isSelected
                      ? 'border-white/30 text-white/90'
                      : 'border-emerald-100 text-[#2E7D32]'
                  }`}
                >
                  <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  <span className="truncate">{lang.greetingText}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirmation Button */}
        <div className="mt-3.5 pt-3 sm:mt-5 sm:pt-4 border-t border-white/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <div className="text-[11px] sm:text-xs font-semibold text-[#455A45]">
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
            className="w-full sm:w-auto px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border bg-[#81C784] hover:bg-[#4CAF50] text-white shadow-md border-white/50 active:scale-95 cursor-pointer transition-all"
          >
            <span>
              Continue in {currentLangConfig.name}
            </span>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
