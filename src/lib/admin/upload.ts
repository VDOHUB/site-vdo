// Regras de foto do Adm. Sem dependencias de servidor: usado no navegador (antes do
// upload) e no servidor (ao registrar a foto). O bucket "obras" aplica os mesmos limites.

export const PHOTO_MAX_BYTES = 6 * 1024 * 1024; // = file_size_limit do bucket (6291456)
export const PHOTO_MAX_WIDTH = 2400;

export const PHOTO_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;
export type PhotoType = keyof typeof PHOTO_TYPES;

export const PHOTO_ERRORS = {
  type: "Formato não aceito. Envie fotos em JPG, PNG, WebP ou AVIF.",
  size: "A foto passa de 6 MB. Envie uma imagem menor.",
  empty: "O arquivo está vazio.",
} as const;

export function isPhotoType(type: string): type is PhotoType {
  return Object.prototype.hasOwnProperty.call(PHOTO_TYPES, type);
}

export function validatePhoto(file: { type: string; size: number }): { ok: true } | { ok: false; error: string } {
  if (!isPhotoType(file.type)) return { ok: false, error: PHOTO_ERRORS.type };
  if (!Number.isFinite(file.size) || file.size <= 0) return { ok: false, error: PHOTO_ERRORS.empty };
  if (file.size > PHOTO_MAX_BYTES) return { ok: false, error: PHOTO_ERRORS.size };
  return { ok: true };
}

/** Dimensoes para caber em `maxWidth` de largura, sem ampliar. */
export function fitWithin(width: number, height: number, maxWidth = PHOTO_MAX_WIDTH): { width: number; height: number } {
  if (width <= maxWidth) return { width, height };
  return { width: maxWidth, height: Math.round((height * maxWidth) / width) };
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UPLOAD_RE = new RegExp(`^uploads/(${UUID})/${UUID}\\.(jpg|png|webp|avif)$`);

/** Caminho no bucket: uploads/<obraId>/<uuid>.<ext> (o que `photoUrl` resolve para o Storage). */
export function uploadPath(obraId: string, uuid: string, type: PhotoType): string {
  return `uploads/${obraId}/${uuid}.${PHOTO_TYPES[type]}`;
}

/** true so para uploads/<obraId>/<uuid>.<ext de imagem> desta obra exata. */
export function isUploadPathFor(obraId: string, path: string): boolean {
  const m = UPLOAD_RE.exec(path);
  return Boolean(m && m[1] === obraId.toLowerCase());
}
