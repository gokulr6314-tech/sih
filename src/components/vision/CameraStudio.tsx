/**
 * Module 3 — Smart Camera Studio
 * Live camera preview with a real-time luminance engine:
 *  - Dashed SVG framing guide + corner brackets for artisan centering.
 *  - Live dark / ideal / glare banner + luminance meter.
 *  - One-tap capture returns the raw data-URL with the recorded lighting sample.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Lightbulb, Scan, X } from 'lucide-react';
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

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
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

      const sampleLoop = () => {
        rafRef.current = requestAnimationFrame(sampleLoop);
        const now = Date.now();
        if (now - lastSampleRef.current < 180) return;
        if (capturedRef.current) return;
        lastSampleRef.current = now;
        if (videoRef.current && sampleCanvasRef.current && videoRef.current.readyState >= 2) {
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
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      releaseCamera();
    };
  }, [startCamera, releaseCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    capturedRef.current = true;

    const width = video.videoWidth || 800;
    const height = video.videoHeight || 600;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const finalLighting = analyzeVideoLuminance(video, sampleCanvasRef.current!);
    onCaptured(canvas.toDataURL('image/jpeg', 0.9), finalLighting);
  }, [onCaptured]);

  const statusColor =
    lighting.status === 'ideal' ? 'text-emerald-500' : lighting.status === 'dark' || lighting.status === 'glare' ? 'text-amber-500' : 'text-slate-500';

  return (
    <div className="iso-surface rounded-2xl p-3 overflow-hidden">
      <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-square mb-3">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Dashed ±10% centering guide */}
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

        {permissionError ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center">
              <Camera className="mx-auto mb-3 text-slate-400" size={36} />
              <p className="text-slate-200 text-sm mb-3">{permissionError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
              >
                Retry Camera
              </button>
            </div>
          </div>
        ) : !cameraActive ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Lightbulb className="mx-auto mb-3 text-amber-400 animate-pulse" size={34} />
              <p className="text-slate-200 text-sm">Starting camera…</p>
            </div>
          </div>
        ) : null}

        {onCancel && (
          <button
            onClick={() => {
              releaseCamera();
              onCancel();
            }}
            aria-label="Close camera"
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <X size={16} />
          </button>
        )}
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

      {/* Luminance meter in the optimal band */}
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-amber-400 mb-3 overflow-hidden">
        {lighting.status !== 'none' && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded-full"
            style={{ left: `${Math.min(100, Math.max(0, (lighting.luminance / 255) * 100))}%` }}
          />
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCapture}
          disabled={!cameraActive || Boolean(permissionError)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <Camera size={16} />
          {captureLabel}
        </button>
      </div>
    </div>
  );
}