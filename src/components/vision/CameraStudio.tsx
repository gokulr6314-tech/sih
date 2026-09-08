/**
 * Module 3 — Smart Camera Studio
 * Live camera preview with a real-time luminance engine:
 *  - Default natural (non-mirrored) orientation so camera movement matches real life.
 *  - Quick flip mirror & switch camera (back/front) controls.
 *  - Dashed SVG framing guide + corner brackets for artisan centering.
 *  - Live dark / ideal / glare banner + luminance meter.
 *  - One-tap capture with visual flash feedback returns the raw data-URL and lighting sample.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, FlipHorizontal, Lightbulb, RefreshCw, Scan, X } from 'lucide-react';
import { SupportedLanguageCode } from '../../types';
import { analyzeVideoLuminance, LightingSample, emptyLightingSample } from './lightingDetector';

interface CameraStudioProps {
  language: SupportedLanguageCode;
  onCaptured: (rawDataUrl: string, lighting: LightingSample) => void;
  onCancel?: () => void;
  captureLabel?: string;
}

export default function CameraStudio({
  onCaptured,
  onCancel,
  captureLabel = 'Capture Photo',
}: CameraStudioProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSampleRef = useRef(0);
  const capturedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [lighting, setLighting] = useState<LightingSample>(emptyLightingSample);
  const [isMirrored, setIsMirrored] = useState(false); // Default false for natural real-world movement
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flash, setFlash] = useState(false);

  const releaseCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    releaseCamera();
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      setCameraActive(true);
      capturedRef.current = false;

      const sampleLoop = () => {
        rafRef.current = requestAnimationFrame(sampleLoop);
        const now = Date.now();
        if (now - lastSampleRef.current < 200) return;
        if (capturedRef.current) return;
        lastSampleRef.current = now;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const sample = analyzeVideoLuminance(videoRef.current, sampleCanvasRef.current);
          setLighting(sample);
        }
      };
      rafRef.current = requestAnimationFrame(sampleLoop);
    } catch (err: any) {
      setPermissionError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied by browser.'
          : 'Camera unavailable on this device.'
      );
    }
  }, [facingMode, releaseCamera]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      releaseCamera();
    };
  }, [facingMode, startCamera, releaseCamera]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    // Auto-mirror front camera, keep back camera unmirrored
    if (nextMode === 'user') {
      setIsMirrored(true);
    } else {
      setIsMirrored(false);
    }
  };

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    capturedRef.current = true;

    // Trigger visual flash
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match what the user saw on screen
      if (isMirrored) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      let finalLighting: LightingSample;
      try {
        finalLighting = analyzeVideoLuminance(video, sampleCanvasRef.current);
      } catch {
        finalLighting = {
          luminance: 150,
          status: 'ideal',
          message: 'Captured successfully',
          centered: true,
          timestamp: Date.now(),
        };
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      releaseCamera();
      onCaptured(dataUrl, finalLighting);
    } catch (err) {
      console.error('Camera capture error:', err);
    }
  }, [isMirrored, onCaptured, releaseCamera]);

  const statusColor =
    lighting.status === 'ideal'
      ? 'text-emerald-500'
      : lighting.status === 'dark' || lighting.status === 'glare'
      ? 'text-amber-500'
      : 'text-slate-500';

  return (
    <div className="iso-surface rounded-2xl p-3 overflow-hidden">
      {/* Hidden offscreen sampling canvas */}
      <canvas ref={sampleCanvasRef} className="hidden" aria-hidden="true" />

      <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-square mb-3">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
          style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
        />

        {/* Visual Flash effect upon capture */}
        {flash && (
          <div className="absolute inset-0 bg-white z-20 animate-pulse pointer-events-none" />
        )}

        {/* Dashed centering guide */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect
            x="18"
            y="18"
            width="64"
            height="64"
            fill="none"
            stroke={lighting.centered ? '#10b981' : 'rgba(255,255,255,0.85)'}
            strokeWidth="0.6"
            strokeDasharray="3 2.2"
            strokeLinecap="round"
          />
          {[
            [18, 18],
            [82, 18],
            [18, 82],
            [82, 82],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.2" fill="#22c55e" />
          ))}
        </svg>

        {/* Top Controls: Mirror Toggle & Camera Switch */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={() => setIsMirrored((prev) => !prev)}
            title={isMirrored ? 'Normal View (Unmirror)' : 'Mirror View'}
            className={`p-1.5 rounded-full backdrop-blur-md text-white transition-colors ${
              isMirrored ? 'bg-emerald-600/90' : 'bg-black/50 hover:bg-black/70'
            }`}
          >
            <FlipHorizontal size={15} />
          </button>
          <button
            type="button"
            onClick={toggleCameraFacing}
            title="Switch Front/Back Camera"
            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Close Camera Button */}
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              releaseCamera();
              onCancel();
            }}
            aria-label="Close camera"
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white z-10 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {permissionError ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/90 z-10">
            <div className="text-center">
              <Camera className="mx-auto mb-3 text-slate-400" size={36} />
              <p className="text-slate-200 text-sm mb-3">{permissionError}</p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
              >
                Retry Camera
              </button>
            </div>
          </div>
        ) : !cameraActive ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
            <div className="text-center">
              <Lightbulb className="mx-auto mb-3 text-amber-400 animate-pulse" size={34} />
              <p className="text-slate-200 text-sm">Starting camera…</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            lighting.status === 'ideal'
              ? 'bg-emerald-500/10 text-emerald-600'
              : lighting.status === 'dark' || lighting.status === 'glare'
              ? 'bg-amber-500/10 text-amber-600'
              : 'bg-slate-500/10 text-slate-500'
          }`}
        >
          <Scan size={13} />
          {lighting.message || 'Point the camera at your product…'}
        </div>
        <span className={`ml-auto text-xs font-semibold ${statusColor}`}>{lighting.luminance}</span>
      </div>

      {/* Luminance meter in optimal band */}
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-amber-400 mb-3 overflow-hidden">
        {lighting.status !== 'none' && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded-full transition-all duration-150"
            style={{ left: `${Math.min(100, Math.max(0, (lighting.luminance / 255) * 100))}%` }}
          />
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!cameraActive || Boolean(permissionError)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 text-white px-4 py-2.5 text-sm font-semibold transition-all shadow-md"
        >
          <Camera size={16} />
          {captureLabel}
        </button>
      </div>
    </div>
  );
}