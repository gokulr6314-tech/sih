import React, { useState } from 'react';
import { UserCheck, Sparkles, MapPin, Hammer, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { SupportedLanguageCode, ArtisanProfile } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { DatabaseStore } from '../lib/supabase';
import { VoiceAssistantOrb } from './VoiceAssistantOrb';

interface ArtisanOnboardingVoiceProps {
  language: SupportedLanguageCode;
  onAccountCreated: (profile: ArtisanProfile) => void;
}

export const ArtisanOnboardingVoice: React.FC<ArtisanOnboardingVoiceProps> = ({
  language,
  onAccountCreated,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [onboardingSubStep, setOnboardingSubStep] = useState<'name' | 'village' | 'craft' | 'confirm'>('name');
  const [artisanName, setArtisanName] = useState('');
  const [village, setVillage] = useState('');
  const [craftType, setCraftType] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Dynamic voice prompts per onboarding step in the chosen language
  const getCurrentPrompt = (): string => {
    switch (onboardingSubStep) {
      case 'name':
        return t.askNamePrompt;
      case 'village':
        return t.askVillagePrompt;
      case 'craft':
        return t.askCraftPrompt;
      case 'confirm':
        return `${artisanName} जी, आपकी जानकारी दर्ज हो गई है। क्या हम आपकी दुकान खोलें?`;
    }
  };

  const getStepHint = (): string => {
    switch (onboardingSubStep) {
      case 'name':
        return t.nameLabel;
      case 'village':
        return t.villageLabel;
      case 'craft':
        return t.craftLabel;
      case 'confirm':
        return 'सत्यापन (Confirmation)';
    }
  };

  const getSuggestedPhrases = (): string[] => {
    switch (onboardingSubStep) {
      case 'name':
        return ['रामवती देवी (Ramvati Devi)', 'बालमुरुगन (Balamurugan)', 'कमला बाई (Kamla Bai)'];
      case 'village':
        return ['नौरंगाबाद, गोरखपुर (Gorakhpur)', 'पट्टमडई, तिरुनेलवेली (Tirunelveli)', 'बस्तर, छत्तीसगढ़ (Bastar)'];
      case 'craft':
        return ['मिट्टी के बर्तन और मूर्तियाँ (Terracotta)', 'पारंपरिक रेशम व हथकरघा (Handloom)', 'कांस्य ढोकरा कला (Brass Craft)', 'लकड़ी के खिलौने (Wooden Toys)'];
      case 'confirm':
        return ['हाँ, दुकान खोलें (Yes, open store)'];
    }
  };

  const handleVoiceInput = async (spokenText: string) => {
    if (!spokenText || !spokenText.trim()) return;
    setIsProcessing(true);
    setFeedbackMessage(null);

    try {
      // Call server voice agent to extract and re-correct if missing
      const response = await fetch('/api/ai/voice-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText,
          currentStep: `onboarding_${onboardingSubStep}`,
          language,
          previousState: { artisanName, village, craftType },
        }),
      });

      const data = await response.json();
      const extracted = data.extractedValue || spokenText;

      if (onboardingSubStep === 'name') {
        const cleanedName = extracted.replace(/(मेरा नाम|नाम है|namaste|my name is)/gi, '').trim();
        setArtisanName(cleanedName || spokenText);
        setOnboardingSubStep('village');
      } else if (onboardingSubStep === 'village') {
        setVillage(extracted);
        setOnboardingSubStep('craft');
      } else if (onboardingSubStep === 'craft') {
        setCraftType(extracted);
        setOnboardingSubStep('confirm');
      } else if (onboardingSubStep === 'confirm') {
        handleFinalSubmit();
      }
    } catch (e) {
      // Direct assignment fallback
      if (onboardingSubStep === 'name') {
        setArtisanName(spokenText);
        setOnboardingSubStep('village');
      } else if (onboardingSubStep === 'village') {
        setVillage(spokenText);
        setOnboardingSubStep('craft');
      } else if (onboardingSubStep === 'craft') {
        setCraftType(spokenText);
        setOnboardingSubStep('confirm');
      } else if (onboardingSubStep === 'confirm') {
        handleFinalSubmit();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSubmit = () => {
    const newProfile: ArtisanProfile = {
      id: `artisan_${Date.now().toString().slice(-5)}`,
      name: artisanName.trim() || 'Ramvati Devi',
      phone: phone || '+91 98765 43210',
      village: village.trim() || 'Naurangabad, Gorakhpur',
      state: 'Uttar Pradesh',
      craftType: craftType.trim() || 'Terracotta Pottery',
      experienceYears: 18,
      language,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      totalEarnings: 0,
      activeListingsCount: 0,
      totalOrdersCount: 0,
      rating: 5.0,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    DatabaseStore.saveArtisan(newProfile);
    onAccountCreated(newProfile);
  };

  return (
    <div className="max-w-xl mx-auto py-2">
      {/* Interactive Voice Assistant */}
      <VoiceAssistantOrb
        currentPrompt={getCurrentPrompt()}
        language={language}
        onVoiceResult={handleVoiceInput}
        isProcessing={isProcessing}
        stepHint={getStepHint()}
        suggestedPhrases={getSuggestedPhrases()}
      />

      <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#81C784] text-white flex items-center justify-center font-bold shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/50">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#2D422D]">
              {t.onboardingTitle}
            </h2>
            <p className="text-xs text-[#455A45]">
              बोलकर उत्तर दें या नीचे विवरण भरें — लिखने-पढ़ने की कोई बाधा नहीं
            </p>
          </div>
        </div>

        {/* Dynamic Progress indicator */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div
            className={`h-2 rounded-full transition-all ${
              artisanName ? 'bg-[#4CAF50]' : 'bg-[#C8E6C9]'
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all ${
              village ? 'bg-[#4CAF50]' : 'bg-[#C8E6C9]'
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all ${
              craftType ? 'bg-[#4CAF50]' : 'bg-[#C8E6C9]'
            }`}
          />
        </div>

        {/* Live Profile Card assembled by Voice */}
        <div className="space-y-4">
          <div className="bg-[#E1EBE1] border border-white/60 rounded-[20px] p-4 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff]">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-1.5 mb-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#4CAF50]" />
              {t.nameLabel}
            </label>
            <input
              type="text"
              value={artisanName}
              onChange={(e) => setArtisanName(e.target.value)}
              placeholder="बोलकर बताएं (जैसे: रामवती देवी)"
              className="w-full bg-transparent text-[#2D422D] font-semibold text-base focus:outline-none placeholder-[#455A45]/40"
            />
          </div>

          <div className="bg-[#E1EBE1] border border-white/60 rounded-[20px] p-4 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff]">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#4CAF50]" />
              {t.villageLabel}
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="बोलकर बताएं (जैसे: नौरंगाबाद, गोरखपुर)"
              className="w-full bg-transparent text-[#2D422D] font-semibold text-base focus:outline-none placeholder-[#455A45]/40"
            />
          </div>

          <div className="bg-[#E1EBE1] border border-white/60 rounded-[20px] p-4 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff]">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-1.5 mb-1.5">
              <Hammer className="w-3.5 h-3.5 text-[#4CAF50]" />
              {t.craftLabel}
            </label>
            <input
              type="text"
              value={craftType}
              onChange={(e) => setCraftType(e.target.value)}
              placeholder="बोलकर बताएं (जैसे: मिट्टी के बर्तन / टेराकोटा)"
              className="w-full bg-transparent text-[#2D422D] font-semibold text-base focus:outline-none placeholder-[#455A45]/40"
            />
          </div>

          <div className="bg-[#E1EBE1] border border-white/60 rounded-[20px] p-4 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff]">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-[#4CAF50]" />
              मोबाइल नंबर (Mobile No.)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-transparent text-[#2D422D] font-semibold text-base focus:outline-none placeholder-[#455A45]/40"
            />
          </div>
        </div>

        {/* Heritage Trust Badge */}
        <div className="mt-5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 flex items-center gap-3 text-xs text-[#2D422D] shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff]">
          <div className="p-2 bg-[#C8E6C9] text-[#2E7D32] rounded-xl">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="font-medium leading-relaxed">
            भारत सरकार के वोकल फॉर लोकल और भारत ट्यूलिप से सीधे जुड़कर 100% बिचौलिया-मुक्त आमदनी पाएं।
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="w-full bg-[#81C784] hover:bg-[#4CAF50] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[6px_6px_16px_#c8d6c8,-6px_-6px_16px_#ffffff] border border-white/50 active:scale-95 transition-all"
          >
            <span>{t.createAccountBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
