import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  ArrowRight,
  Layers,
  Wand2,
} from 'lucide-react';
import { SupportedLanguageCode } from '../types';
import { PRODUCT_IMAGE_PROMPTS } from '../lib/languages';

interface ProductImageCaptureProps {
  language: SupportedLanguageCode;
  onImageSelected: (imageUrl: string, craftName?: string) => void;
  rawImageUrl: string | null;
  studioImageUrl: string | null;
  lightingNotes: string | null;
  isAiEnhancing: boolean;
  onRetake: () => void;
  onProceedToDescription?: () => void;
}

interface SampleCraft {
  id: string;
  name: Record<SupportedLanguageCode, string>;
  category: string;
  thumbnail: string;
}

const SAMPLE_CRAFTS: SampleCraft[] = [
  {
    id: 'terracotta-vase',
    name: {
      hi: 'मिट्टी का पारंपरिक फूलदान',
      ta: 'மண்பாண்ட மலர் குவளை',
      te: 'టెర్రకోట మట్టి జాడీ',
      bn: 'মাটির ঐতিহ্যবাহী ফুলদানি',
      mr: 'मातीचे नक्षीदार फुलदाणी',
      gu: 'માટીનો કલાત્મક કૂંજો',
      kn: 'ಮಣ್ಣಿನ ಹೂದಾನಿ',
      ml: 'മൺപാത്ര പൂപ്പാത്രം',
      or: 'ମାଟିର ପାରମ୍ପରିକ ଫୁଲଦାନୀ',
      pa: 'ਮਿੱਟੀ ਦਾ ਗੁਲਦਸਤਾ',
      en: 'Terracotta Heritage Vase',
    },
    category: 'terracotta',
    thumbnail: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'silk-saree',
    name: {
      hi: 'कांचीपुरम हाथ से बुनी सिल्क साड़ी',
      ta: 'காஞ்சிபுரம் கைத்தறி பட்டுப் புடவை',
      te: 'చేనేత కాంచీపురం పట్టు చీర',
      bn: 'হাতে বোনা কাঞ্জিভরম রেশম শাড়ি',
      mr: 'हातमाग कांजीवरम रेशमी साडी',
      gu: 'હાથવણાટ કાંચીપુરમ સિલ્ક સાડી',
      kn: 'ಕೈಮಗ್ಗದ ಕಾಂಚೀಪುರಂ ರೇಷ್ಮೆ ಸೀರೆ',
      ml: 'കൈത്തറി കാഞ്ചീപുരം പട്ടുസാരി',
      or: 'ହସ୍ତତନ୍ତ କାଞ୍ଚୀପୁରମ୍ ରେଶମ ଶାଢ଼ି',
      pa: 'ਹੱਥ ਨਾਲ ਬੁਣਿਆ ਰੇਸ਼ਮੀ ਸੂਟ/ਸਾੜ੍ਹੀ',
      en: 'Handloom Kanchipuram Silk Saree',
    },
    category: 'silk',
    thumbnail: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'brass-diya',
    name: {
      hi: 'नक्काशीदार पीतल का दीया (मयूर दीया)',
      ta: 'பாரம்பரிய பித்தளை மயில் விளக்கு',
      te: 'సాంప్రదాయ ఇత్తడి దీపం',
      bn: 'খোদাই করা পেতলের প্রদীপ',
      mr: 'नक्षीदार पितळी समई / दिवा',
      gu: 'નકશીદાર પિત્તળનો દીવો',
      kn: 'ಕೆತ್ತನೆಯ ಹಿತ್ತಾಳೆ ದೀಪ',
      ml: 'പിച്ചള കൊത്തുപണി നിലവിളക്ക്',
      or: 'ପିତ୍ତଳ ନିର୍ମିତ ଦୀପ',
      pa: 'ਪਿੱਤਲ ਦਾ ਰਵਾਇਤੀ ਦੀਵਾ',
      en: 'Carved Brass Peacock Diya',
    },
    category: 'brass',
    thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'wood-craft',
    name: {
      hi: 'चन्नापटनम हस्तनिर्मित लकड़ी का खिलौना',
      ta: 'சென்னபட்டினம் மர பொம்மை',
      te: 'చెన్నపట్నం చెక్క బొమ్మ',
      bn: 'চন্নপট্টনম কাঠের খেলনা',
      mr: 'चन्नपट्टण लाकडी खेळणे',
      gu: 'ચન્નાપટ્ટનમ લાકડાનું રમકડું',
      kn: 'ಚನ್ನಪಟ್ಟಣ ಮರದ ಆಟಿಕೆ',
      ml: 'ചന്നപട്ടണം മരപ്പാത്രങ്ങൾ',
      or: 'ଚନ୍ନାପାଟଣା କାଠ ଖେଳନା',
      pa: 'ਲੱਕੜ ਦੀ ਦਸਤਕਾਰੀ',
      en: 'Channapatna Wooden Handcraft',
    },
    category: 'wood',
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
  },
];

export const ProductImageCapture: React.FC<ProductImageCaptureProps> = ({
  language,
  onImageSelected,
  rawImageUrl,
  studioImageUrl,
  lightingNotes,
  isAiEnhancing,
  onRetake,
  onProceedToDescription,
}) => {
  const prompts = PRODUCT_IMAGE_PROMPTS[language] || PRODUCT_IMAGE_PROMPTS.en;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'raw'>('studio');
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null);
  const [bgError, setBgError] = useState<string | null>(null);

  /**
   * Call remove.bg API to strip the product background.
   * Uses the VITE_REMOVEBG_API_KEY env variable.
   */
  const removeBackground = async () => {
    const photoUrl = rawImageUrl;
    if (!photoUrl) return;
    setBgRemoving(true);
    setBgError(null);
    try {
      // Fetch the image as a blob (handles both data: URLs and http URLs)
      let imageBlob: Blob;
      if (photoUrl.startsWith('data:')) {
        const response = await fetch(photoUrl);
        imageBlob = await response.blob();
      } else {
        // For remote URLs, fetch through a proxy-safe approach
        const response = await fetch(photoUrl);
        imageBlob = await response.blob();
      }

      const formData = new FormData();
      formData.append('image_file', imageBlob, 'product.jpg');
      formData.append('size', 'auto');

      const apiKey = (import.meta as any).env?.VITE_REMOVEBG_API_KEY || 'KATuvZFwA3MbH4EH8jh8QeWx';
      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `remove.bg API error: ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBgRemovedUrl(objectUrl);
      // Pass back to parent as the enhanced image
      onImageSelected(objectUrl);
    } catch (err: any) {
      console.error('remove.bg error:', err);
      setBgError('Background removal failed. Check API key or network.');
    } finally {
      setBgRemoving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageSelected(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageSelected(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="bg-[#F0F7F0]/95 backdrop-blur-md rounded-[28px] p-5 sm:p-7 shadow-[10px_10px_20px_#d1dbd1,-10px_-10px_20px_#ffffff] border border-white/80 transition-all">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header section in user's selected regional language */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#81C784] text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_5px_#c8d6c8,-2px_-2px_5px_#ffffff]">
              📸
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#2D422D]">
              {prompts.askImageHeadline}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#455A45] mt-1 font-medium leading-relaxed">
            {prompts.askImageSubtext}
          </p>
        </div>

        {rawImageUrl && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onRetake}
              className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#455A45] border border-white/80 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{prompts.retakeText}</span>
            </button>
          </div>
        )}
      </div>

      {/* When NO image is selected yet: Show Capture / Upload and Quick Samples */}
      {!rawImageUrl ? (
        <div className="flex flex-col gap-5">
          {/* Action Trigger Buttons: Big Camera & Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="group bg-[#81C784] hover:bg-[#4CAF50] text-white p-5 rounded-2xl shadow-[6px_6px_14px_#c8d6c8,-6px_-6px_14px_#ffffff] border border-white/40 flex items-center justify-center gap-3 font-bold text-sm sm:text-base cursor-pointer transition-all active:scale-98"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-white font-extrabold">{prompts.takePhotoText}</div>
                <div className="text-[11px] text-white/80 font-normal">
                  Use device camera
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group bg-white/90 hover:bg-white text-[#2D422D] p-5 rounded-2xl shadow-[6px_6px_14px_#d1dbd1,-6px_-6px_14px_#ffffff] border border-white/80 flex items-center justify-center gap-3 font-bold text-sm sm:text-base cursor-pointer transition-all active:scale-98"
            >
              <div className="w-11 h-11 rounded-full bg-[#E1EBE1] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-[#2E7D32]" />
              </div>
              <div className="text-left">
                <div className="text-[#2D422D] font-extrabold">{prompts.uploadPhotoText}</div>
                <div className="text-[11px] text-[#455A45] font-normal">
                  Gallery / Files
                </div>
              </div>
            </button>
          </div>

          {/* Drag & Drop Surface */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-[#4CAF50] bg-[#C8E6C9]/40 scale-[1.01]'
                : 'border-[#81C784]/60 bg-white/50 hover:bg-white/80'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-[#E1EBE1] flex items-center justify-center text-[#2E7D32] mb-2 shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#2D422D]">
              {prompts.dragDropText}
            </p>
            <p className="text-[11px] text-[#455A45] mt-1">
              Supports JPG, PNG, WEBP (Max 10MB)
            </p>
          </div>

          {/* 1-Tap Sample Crafts for quick live demonstration */}
          <div className="mt-2 pt-4 border-t border-white/70">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D422D] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{prompts.sampleCraftsTitle}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_CRAFTS.map((craft) => (
                <button
                  key={craft.id}
                  type="button"
                  onClick={() => {
                    const localTitle = craft.name[language] || craft.name.en;
                    onImageSelected(craft.thumbnail, localTitle);
                  }}
                  className="group bg-white/70 hover:bg-white rounded-2xl p-2.5 text-left border border-white/80 shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff] transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-[#E1EBE1]">
                    <img
                      src={craft.thumbnail}
                      alt={craft.name[language] || craft.name.en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                      1-Tap
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#2D422D] line-clamp-1 leading-snug group-hover:text-[#2E7D32]">
                    {craft.name[language] || craft.name.en}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* When Image IS Selected: Show comparison, AI enhancement, and next step */
        <div className="flex flex-col gap-5">
          {/* AI Enhancing Status Banner */}
          {isAiEnhancing ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-900">
                  {prompts.imageEnhancingText}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Refining natural studio lighting and clean canvas contrast...
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#C8E6C9]/60 border border-[#81C784]/60 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
                <span className="text-xs sm:text-sm font-bold text-[#2D422D]">
                  {prompts.imageReceivedSpoken}
                </span>
              </div>

              {/* View Toggle */}
              {studioImageUrl && studioImageUrl !== rawImageUrl && (
                <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('studio')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'studio'
                        ? 'bg-[#81C784] text-white shadow-xs'
                        : 'text-[#455A45] hover:text-[#2D422D]'
                    }`}
                  >
                    Studio AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'raw'
                        ? 'bg-[#81C784] text-white shadow-xs'
                        : 'text-[#455A45] hover:text-[#2D422D]'
                    }`}
                  >
                    Original
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Display Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Display */}
            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-[#E1EBE1] border border-white/80 shadow-[4px_4px_12px_#d1dbd1,-4px_-4px_12px_#ffffff]">
              <img
                src={
                  activeTab === 'studio' && studioImageUrl
                    ? studioImageUrl
                    : rawImageUrl
                }
                alt="Captured Artisan Craft"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1">
                {activeTab === 'studio' && studioImageUrl ? (
                  <>
                    <Wand2 className="w-3 h-3 text-amber-300" />
                    <span>AI Studio Clean Backdrop</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3" />
                    <span>Original Photo</span>
                  </>
                )}
              </div>
            </div>

            {/* Lighting & Enhancement Info + Next Action */}
            <div className="flex flex-col justify-between bg-white/70 rounded-2xl p-4 border border-white/80 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] mb-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Studio Lighting Optimization</span>
                </div>
                <p className="text-xs text-[#2D422D] leading-relaxed font-medium">
                  {lightingNotes ||
                    'Soft natural white lighting with balanced specular highlights for authentic artisan textures.'}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#C8E6C9] text-[#2E7D32] text-[10px] font-extrabold">
                    ✓ High Resolution
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#C8E6C9] text-[#2E7D32] text-[10px] font-extrabold">
                    ✓ Clean Shadow
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#C8E6C9] text-[#2E7D32] text-[10px] font-extrabold">
                    ✓ Marketplace Ready
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/80 flex flex-col gap-2">
                {/* Remove BG Button */}
                <button
                  type="button"
                  onClick={removeBackground}
                  disabled={bgRemoving}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[0_4px_14px_rgba(124,58,237,0.4)]"
                >
                  {bgRemoving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing Background…</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{bgRemovedUrl ? '✓ BG Removed — Re-apply' : '✨ Remove BG (remove.bg AI)'}</span>
                    </>
                  )}
                </button>

                {bgError && (
                  <p className="text-[10px] text-red-600 font-semibold text-center">{bgError}</p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onRetake}
                    className="px-3 py-2 rounded-xl bg-white text-[#455A45] hover:text-[#2D422D] text-xs font-bold border border-white/90 shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{prompts.retakeText}</span>
                  </button>

                  {onProceedToDescription && (
                    <button
                      type="button"
                      onClick={onProceedToDescription}
                      className="flex-1 px-4 py-2 rounded-xl bg-[#81C784] hover:bg-[#4CAF50] text-white text-xs font-black shadow-[3px_3px_8px_#c8d6c8,-3px_-3px_8px_#ffffff] border border-white/50 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <span>{prompts.continueText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
