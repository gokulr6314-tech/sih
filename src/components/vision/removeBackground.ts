/**
 * Module 3 — Client-side Background Removal
 * Deterministic, privacy-first approach using border-sampling + edge-differencing:
 *   1. Downscale to a working resolution (keeps memory sane on low-end phones).
 *   2. Sample the image border ring to infer the backdrop color.
 *   3. Alpha-matte every pixel by color distance to the backdrop (soft feathered).
 *   4. Composite onto a clean "studio" backdrop (frosted neutrals).
 * Heavy looping is chunked across micro-tasks (requestAnimationFrame yields)
 * so the artisan's UI thread always stays responsive.
 *
 * Swap-in note: to upgrade to @imgly/background-removal (ONNX, ~25s first run),
 * keep this module's signature and route `removeBackgroundFromDataUrl` to
 * `removeBackground(img, '/models', { progress })` from that package.
 */

export interface BackgroundRemovalOptions {
  backdropColor?: string;
  maxDimension?: number;
  distanceThreshold?: number;
  feather?: number;
}

export interface RemovalCallbacks {
  onProgress?: (progress: number) => void;
}

const DEFAULT_BACKDROP = '#F7F5EF';

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode captured image.'));
    img.src = dataUrl;
  });
}

function computeBackdropColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): [number, number, number] {
  const ring = ctx.getImageData(0, 0, width, height);
  const data = ring.data;
  const insetX = Math.max(1, Math.round(width * 0.06));
  const insetY = Math.max(1, Math.round(height * 0.06));

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const push = (idx: number) => {
    // Ignore already-transparent pixels
    if (data[idx + 3] < 40) return;
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
    count += 1;
  };

  for (let x = 0; x < width; x += 2) {
    push((0 * width + x) * 4);
    push(((height - 1) * width + x) * 4);
  }
  for (let y = insetY; y < height - insetY; y += 2) {
    push((y * width + insetX) * 4);
    push((y * width + (width - 1 - insetX)) * 4);
  }

  if (count === 0) return [245, 244, 238];
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function yieldToUI(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => resolve());
    else window.setTimeout(() => resolve(), 0);
  });
}

export async function removeBackgroundFromDataUrl(
  dataUrl: string,
  options: BackgroundRemovalOptions = {},
  callbacks: RemovalCallbacks = {}
): Promise<string> {
  const maxDimension = options.maxDimension ?? 900;
  const threshold = options.distanceThreshold ?? 62;
  const feather = options.feather ?? 28;
  const backdrop = options.backdropColor || DEFAULT_BACKDROP;

  const img = await loadImage(dataUrl);

  let scale = 1;
  if (img.width > maxDimension || img.height > maxDimension) {
    scale = maxDimension / Math.max(img.width, img.height);
  }
  const outWidth = Math.round(img.width * scale);
  const outHeight = Math.round(img.height * scale);

  const working = document.createElement('canvas');
  working.width = outWidth;
  working.height = outHeight;
  const ctx = working.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, outWidth, outHeight);

  const world = ctx.getImageData(0, 0, outWidth, outHeight);
  const data = world.data;
  const backdropColor = computeBackdropColor(ctx, outWidth, outHeight);

  const rowsPerChunk = Math.max(16, Math.ceil(outHeight / 24));
  for (let startY = 0; startY < outHeight; startY += rowsPerChunk) {
    const endY = Math.min(outHeight, startY + rowsPerChunk);
    for (let y = startY; y < endY; y += 1) {
      for (let x = 0; x < outWidth; x += 1) {
        const idx = (y * outWidth + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (data[idx + 3] === 0) continue;

        const dist = colorDistance([r, g, b], backdropColor);
        let alpha = 1;
        if (dist < threshold) {
          alpha = 0;
        } else if (dist < threshold + feather) {
          alpha = (dist - threshold) / feather;
        }
        data[idx + 3] = Math.round(alpha * 255);
      }
    }
    if (callbacks.onProgress) {
      callbacks.onProgress(Math.min(0.95, (endY / outHeight) * 0.95));
    }
    await yieldToUI();
  }

  ctx.putImageData(world, 0, 0);

  // Composite the alpha matte over a clean studio backdrop.
  const studio = document.createElement('canvas');
  studio.width = outWidth;
  studio.height = outHeight;
  const studioCtx = studio.getContext('2d')!;
  studioCtx.fillStyle = backdrop;
  studioCtx.fillRect(0, 0, outWidth, outHeight);
  studioCtx.drawImage(working, 0, 0);

  if (callbacks.onProgress) callbacks.onProgress(1);

  // JPEG keeps the resulting file small for slow rural networks.
  return studio.toDataURL('image/jpeg', 0.92);
}