/** Square region of the source image, in natural image pixels. */
export type CropRect = { sx: number; sy: number; side: number };

/**
 * Resize + JPEG-compress an image File to a small data URL suitable for
 * localStorage (~20-40 KB at 240px square / 80% quality). Uses a centered
 * square crop.
 */
export async function compressAvatar(
  file: File,
  maxDim = 240,
  quality = 0.82
): Promise<string> {
  const img = await loadImageFromFile(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  return cropAvatar(
    img,
    {
      sx: (img.naturalWidth - side) / 2,
      sy: (img.naturalHeight - side) / 2,
      side,
    },
    maxDim,
    quality
  );
}

/**
 * Draw the given square region of an already-loaded image into a small
 * square JPEG data URL. Never upscales beyond the source region.
 */
export function cropAvatar(
  img: HTMLImageElement,
  crop: CropRect,
  maxDim = 240,
  quality = 0.82
): string {
  const target = Math.max(1, Math.round(Math.min(maxDim, crop.side)));
  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  // JPEG has no alpha — paint white first so transparent PNGs don't go black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, target, target);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, crop.sx, crop.sy, crop.side, crop.side, 0, 0, target, target);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return loadImage(await readAsDataUrl(file));
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
