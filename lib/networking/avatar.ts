/**
 * Resize + JPEG-compress an image File to a small data URL suitable for
 * localStorage (~20-40 KB at 240px square / 80% quality).
 */
export async function compressAvatar(
  file: File,
  maxDim = 240,
  quality = 0.82
): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const { width, height } = scaleDown(img.width, img.height, maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Draw the image cropped to a square center if non-square, so the bubble
  // looks consistent regardless of source aspect ratio.
  const sourceSide = Math.min(img.width, img.height);
  const sx = (img.width - sourceSide) / 2;
  const sy = (img.height - sourceSide) / 2;
  ctx.drawImage(img, sx, sy, sourceSide, sourceSide, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function scaleDown(
  w: number,
  h: number,
  maxDim: number
): { width: number; height: number } {
  // We're cropping to square, so target is always maxDim × maxDim — but cap
  // by the source so we never upscale.
  const target = Math.min(maxDim, w, h);
  return { width: target, height: target };
}
