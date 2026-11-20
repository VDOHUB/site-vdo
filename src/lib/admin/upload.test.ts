import { describe, expect, it } from "vitest";
import {
  PHOTO_ERRORS,
  PHOTO_MAX_BYTES,
  fitWithin,
  isUploadPathFor,
  uploadPath,
  validatePhoto,
} from "./upload";

const MiB = 1024 * 1024;

describe("validatePhoto", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "image/avif"])("aceita %s", (type) => {
    expect(validatePhoto({ type, size: 2 * MiB })).toEqual({ ok: true });
  });

  it.each(["application/pdf", "image/svg+xml", "image/gif", "application/x-msdownload", "", "text/html", "IMAGE/JPEG "])(
    "rejeita o tipo %j com mensagem em português",
    (type) => {
      expect(validatePhoto({ type, size: 1000 })).toEqual({ ok: false, error: PHOTO_ERRORS.type });
    },
  );

  it("mensagens exatas", () => {
    expect(PHOTO_ERRORS.type).toBe("Formato não aceito. Envie fotos em JPG, PNG, WebP ou AVIF.");
    expect(PHOTO_ERRORS.size).toBe("A foto passa de 6 MB. Envie uma imagem menor.");
    expect(PHOTO_ERRORS.empty).toBe("O arquivo está vazio.");
  });

  it("limite e 6 MiB, igual ao bucket", () => {
    expect(PHOTO_MAX_BYTES).toBe(6291456);
    expect(validatePhoto({ type: "image/jpeg", size: PHOTO_MAX_BYTES })).toEqual({ ok: true });
    expect(validatePhoto({ type: "image/jpeg", size: PHOTO_MAX_BYTES + 1 })).toEqual({ ok: false, error: PHOTO_ERRORS.size });
    expect(validatePhoto({ type: "image/png", size: 50 * MiB })).toEqual({ ok: false, error: PHOTO_ERRORS.size });
  });

  it("rejeita arquivo vazio ou tamanho invalido", () => {
    expect(validatePhoto({ type: "image/png", size: 0 })).toEqual({ ok: false, error: PHOTO_ERRORS.empty });
    expect(validatePhoto({ type: "image/png", size: Number.NaN })).toEqual({ ok: false, error: PHOTO_ERRORS.empty });
  });
});

describe("fitWithin", () => {
  it("nao amplia imagens pequenas", () => {
    expect(fitWithin(1600, 1200)).toEqual({ width: 1600, height: 1200 });
  });
  it("reduz para no maximo 2400 px de largura mantendo a proporcao", () => {
    expect(fitWithin(4800, 3200)).toEqual({ width: 2400, height: 1600 });
    expect(fitWithin(6000, 4000, 2400)).toEqual({ width: 2400, height: 1600 });
  });
  it("retrato alto tambem respeita a largura", () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 2400, height: 3200 });
  });
});

describe("uploadPath / isUploadPathFor", () => {
  const obra = "0b7c6f1e-3a2b-4c1d-9e8f-1234567890ab";
  const uuid = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  it("monta uploads/<obraId>/<uuid>.<ext>", () => {
    expect(uploadPath(obra, uuid, "image/jpeg")).toBe(`uploads/${obra}/${uuid}.jpg`);
    expect(uploadPath(obra, uuid, "image/webp")).toBe(`uploads/${obra}/${uuid}.webp`);
    expect(uploadPath(obra, uuid, "image/png")).toBe(`uploads/${obra}/${uuid}.png`);
    expect(uploadPath(obra, uuid, "image/avif")).toBe(`uploads/${obra}/${uuid}.avif`);
  });

  it("aceita so caminhos da propria obra", () => {
    expect(isUploadPathFor(obra, `uploads/${obra}/${uuid}.webp`)).toBe(true);
    expect(isUploadPathFor(obra, `uploads/${uuid}/${uuid}.webp`)).toBe(false);
    expect(isUploadPathFor(obra, `uploads/${obra}/../x/${uuid}.webp`)).toBe(false);
    expect(isUploadPathFor(obra, `uploads/${obra}/${uuid}.svg`)).toBe(false);
    expect(isUploadPathFor(obra, `uploads/${obra}/nome.webp`)).toBe(false);
    expect(isUploadPathFor(obra, `dunas-douradas/1-1600.webp`)).toBe(false);
    expect(isUploadPathFor(obra, ` uploads/${obra}/${uuid}.webp`)).toBe(false);
  });
});
