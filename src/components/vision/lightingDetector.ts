/**
 * Module 3 — Computer Vision & Smart Camera Suite
 * Deterministic luminance analysis for live capture guidance.
 *
 * Y = 0.299·R + 0.587·G + 0.114·B
 *  Y < 80   → too dark
 *  Y > 220  → glare (blown-out highlights)
 *  80 ≤ Y ≤ 220 → optimal studio lighting
 */

export type LightingStatus = 'none' | 'dark' | 'ideal' | 'glare';

export interface LightingSample {
  luminance: number;
  status: LightingStatus;
  message: string;
  centered: boolean;
  timestamp: number;
}

function classifyLuminance(y: number): LightingStatus {
  if (y < 80) return 'dark';
  if (y > 220) return 'glare';
  return 'ideal';
}

export function messageForStatus(status: LightingStatus): string {
  switch (status) {
    case 'dark':
      return 'Lighting too dark — move closer to a window or lamp.';
    case 'glare':
      return 'Glare detected — soften the light to reveal craft detail.';
    case 'ideal':
      return 'Perfect lighting — hold steady.';
    default:
      return '';
  }
}

export function emptyLightingSample(): LightingSample {
  return {
    luminance: 0,
    status: 'none',
    message: 'Point the camera at your product…',
    centered: false,
    timestamp: 0,
  };
}

/**
 * Samples the live video frame, computing average Y-luminance plus a
 * center-vs-border brightness delta to advise item centering.
 */
export function analyzeVideoLuminance(
  video: HTMLVideoElement | null,
  canvas?: HTMLCanvasElement | null
): LightingSample {
  if (!video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return { ...emptyLightingSample(), timestamp: Date.now() };
  }
  const width = 320;
  const height = Math.max(1, Math.round((width / video.videoWidth) * video.videoHeight || width));
  if (height < 1) {
    return { ...emptyLightingSample(), timestamp: Date.now() };
  }

  const targetCanvas = canvas || document.createElement('canvas');
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { ...emptyLightingSample(), timestamp: Date.now() };
  }

  targetCanvas.width = width;
  targetCanvas.height = height;
  ctx.drawImage(video, 0, 0, width, height);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return { ...emptyLightingSample(), timestamp: Date.now() };
  }

  const data = imageData.data;
  let totalY = 0;
  let centerY = 0;
  let borderY = 0;
  const count = width * height;
  let centerCount = 0;
  let borderCount = 0;

  const centerLeft = Math.floor(width * 0.3);
  const centerRight = Math.ceil(width * 0.7);
  const centerTop = Math.floor(height * 0.3);
  const centerBottom = Math.ceil(height * 0.7);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalY += lum;

      const inCenter =
        x >= centerLeft && x <= centerRight && y >= centerTop && y <= centerBottom;
      if (inCenter) {
        centerY += lum;
        centerCount += 1;
      } else {
        borderY += lum;
        borderCount += 1;
      }
    }
  }

  const luminance = totalY / count;
  const status = classifyLuminance(luminance);
  const avgCenter = centerCount > 0 ? centerY / centerCount : 0;
  const avgBorder = borderCount > 0 ? borderY / borderCount : 0;

  // Subject is considered centered when the center is meaningfully brighter
  // (lit subject) than the surrounding backdrop.
  const centered = avgCenter > avgBorder + 28 && status !== 'none';

  return {
    luminance: Math.round(luminance),
    status,
    message: messageForStatus(status),
    centered,
    timestamp: Date.now(),
  };
}