/**
 * Module 3 — Background Remover & Studio Eraser
 * Runs the async client-side removal engine (never blocks the UI thread),
 * then offers a one-tap AI studio pass through the existing enhance-image
 * endpoint so the artisan can upgrade the clean cut-out to a full studio-shot.
 */

import { useEffect, useRef, useState } from 'react';
import { Check, ImageOff, Loader2, Sparkles } from 'lucide-react';
import { SupportedLanguageCode } from '../../types';
import { removeBackgroundFromDataUrl } from './removeBackground';

interface BackgroundRemoverProps {
  language: SupportedLanguageCode;
  sourceDataUrl: string;
  onComplete: (cleanDataUrl: string) => void;
  onSkip?: () => void;
  craftType?: string;
  productTitle?: string;
}

export default function BackgroundRemover({
  language,
  sourceDataUrl,
  onComplete,
  onSkip,
  craftType,
  productTitle,
}: BackgroundRemoverProps) {
  const [progress, setProgress] = useState(0);
  const [cleanUrl, setCleanUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !sourceDataUrl) return;
    startedRef.current = true;

    const run = async () => {
      setProcessing(true);
      setError(null);
      try {
        const cleaned = await removeBackgroundFromDataUrl(
          sourceDataUrl,
          {},
          { onProgress: (p) => setProgress(Math.round(p * 100)) }
        );
        setCleanUrl(cleaned);
        onComplete(cleaned);
      } catch (err) {
        setError('Background removal failed — using original capture.');
        setCleanUrl(sourceDataUrl);
        onComplete(sourceDataUrl);
      } finally {
        setProcessing(false);
      }
    };
    run();
  }, [sourceDataUrl, onComplete]);

  const runAiStudio = async () => {
    setAiEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawImageUrl: cleanUrl, craftType, productTitle }),
      });
      const data = await res.json();
      const enhanced = data.enhancedImageUrl || cleanUrl;
      setCleanUrl(enhanced);
      onComplete(enhanced);
    } catch {
      // keep the clean cut-out; AI pass is optional
    } finally {
      setAiEnhancing(false);
    }
  };

  return (
    <div className="iso-surface rounded-2xl p-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1.5">Original capture</p>
          <div className="rounded-lg overflow-hidden aspect-square bg-slate-100">
            <img src={sourceDataUrl} alt="Original" className="w-full h-full object-cover" />
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1.5">Studio background</p>
          <div className="rounded-lg overflow-hidden aspect-square bg-slate-100 relative">
            {cleanUrl ? (
              <img src={cleanUrl} alt="Cleaned" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                {processing ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-xs">{progress}%</span>
                  </>
                ) : (
                  <ImageOff size={22} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {processing && (
        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && !processing && <p className="text-amber-600 text-xs mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={runAiStudio}
          disabled={!cleanUrl || processing || aiEnhancing}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 px-3 py-2 text-xs font-semibold"
        >
          {aiEnhancing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          AI Studio Enhance
        </button>
        <button
          onClick={() => cleanUrl && onComplete(cleanUrl)}
          disabled={!cleanUrl || processing}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-2 text-xs font-semibold"
        >
          <Check size={13} />
          Use This Photo
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="rounded-lg border border-slate-200 text-slate-500 px-3 py-2 text-xs font-medium hover:bg-slate-50"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}