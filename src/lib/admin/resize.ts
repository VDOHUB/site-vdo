// SO NAVEGADOR (usa canvas). Prepara a foto antes do upload: reduz para no maximo
// 2400 px de largura e 6 MB, reencodando em WebP (JPEG se o navegador nao gerar WebP).
// O reencode tambem descarta metadados EXIF (ex.: localizacao GPS da camera).
import { PHOTO_ERRORS, PHOTO_MAX_BYTES, fitWithin, isPhotoType, validatePhoto, type PhotoType } from "./upload";

const QUALITIES = [0.86, 0.78, 0.7, 0.6, 0.5];

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImage(file: File): Promise<{ ok: true; blob: Blob; type: PhotoType } | { ok: false; error: string }> {
  if (!isPhotoType(file.type)) return { ok: false, error: PHOTO_ERRORS.type };
  if (file.size <= 0) return { ok: false, error: PHOTO_ERRORS.empty };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { ok: false, error: "Não foi possível ler esta imagem. Tente outro arquivo." };
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { ok: false, error: "Seu navegador não conseguiu processar a imagem." };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob: Blob | null = null;
  for (const q of QUALITIES) {
    blob = await toBlob(canvas, "image/webp", q);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", q);
    if (blob && blob.size <= PHOTO_MAX_BYTES) break;
  }
  if (!blob) return { ok: false, error: "Seu navegador não conseguiu processar a imagem." };
  const check = validatePhoto({ type: blob.type, size: blob.size });
  if (!check.ok) return check;
  return { ok: true, blob, type: blob.type as PhotoType };
}
