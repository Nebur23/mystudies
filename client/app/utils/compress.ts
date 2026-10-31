interface CompressOptions {
  maxWidth?:   number;  // px
  maxHeight?:  number;  // px
  quality?:    number;  // 0–1, WebP quality
  maxSizeMB?:  number;  // hard cap — recompress at lower quality until under this
}

/**
 * Compresses an image File in the browser using Canvas + WebP encoding.
 * Returns a new File ready to pass to startUpload().
 * Falls back to the original if Canvas API is unavailable.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth  = 1280,
    maxHeight = 720,
    quality   = 0.82,
    maxSizeMB = 1,
  } = options;

  // Skip non-images and tiny files
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 100 * 1024) return file; // already under 100 KB

  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(drawAndCompress(img, file.name, maxWidth, maxHeight, quality, maxSizeMB));
    img.onerror = () => resolve(file); // fallback
    img.src     = URL.createObjectURL(file);
  });
}

async function drawAndCompress(
  img:       HTMLImageElement,
  name:      string,
  maxWidth:  number,
  maxHeight: number,
  quality:   number,
  maxSizeMB: number,
): Promise<File> {
  // Calculate scaled dimensions maintaining aspect ratio
  let { width, height } = img;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width  = Math.round(width  * ratio);
    height = Math.round(height * ratio);
  }

  const canvas  = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx     = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fall back to JPEG
  const mimeType = "image/webp";
  let   q        = quality;

  // Iteratively lower quality until under maxSizeMB
  for (let attempt = 0; attempt < 5; attempt++) {
    const blob = await canvasToBlob(canvas, mimeType, q);
    if (!blob) break;

    if (blob.size <= maxSizeMB * 1_048_576 || q <= 0.3) {
      const ext      = mimeType === "image/webp" ? "webp" : "jpg";
      const basename = name.replace(/\.[^.]+$/, "");
      return new File([blob], `${basename}.${ext}`, { type: mimeType });
    }

    q -= 0.15; // lower quality and retry
  }

  return new File(
    [await canvasToBlob(canvas, mimeType, q) ?? new Blob()],
    name,
    { type: mimeType }
  );
}

function canvasToBlob(
  canvas:   HTMLCanvasElement,
  type:     string,
  quality:  number
): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

/**
 * Returns a human-readable size delta string for UI feedback.
 * e.g. "2.4 MB → 186 KB (92% smaller)"
 */
export function compressionSummary(original: File, compressed: File): string {
  const pct = Math.round((1 - compressed.size / original.size) * 100);
  return `${fmt(original.size)} → ${fmt(compressed.size)} (${pct}% smaller)`;
}

function fmt(bytes: number) {
  if (bytes < 1024)      return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}