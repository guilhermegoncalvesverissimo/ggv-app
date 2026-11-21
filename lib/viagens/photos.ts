/**
 * Shrinks a picked photo in the browser before upload: a phone photo is
 * 3–8 MB (and Vercel functions take at most 4.5 MB per request), so we send a
 * ~1600px JPEG for viewing plus a ~480px one for the grid.
 */

export type PreparedPhoto = {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir esta imagem"));
    };
    img.src = url;
  });
}

function toJpeg(
  img: HTMLImageElement,
  maxDim: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  // Browsers apply the EXIF orientation when drawing an <img>, so portrait
  // photos come out upright.
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas indisponível"));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve({ blob, width, height }) : reject(new Error("Falha ao comprimir"))),
      "image/jpeg",
      quality
    )
  );
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const img = await loadImage(file);
  try {
    const full = await toJpeg(img, 1600, 0.82);
    const thumb = await toJpeg(img, 480, 0.75);
    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height };
  } finally {
    URL.revokeObjectURL(img.src);
  }
}
