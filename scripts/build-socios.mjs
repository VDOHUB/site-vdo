// Gera as imagens dos sócios a partir de um quadro do vídeo institucional (reprodutível).
//   - public/sobre/socios-{600,1200}.{avif,webp}: foto limpa (usada em /sobre e no "Quem somos" da Home)
//   - public/hero/video-poster.webp: poster 16:9 da seção do vídeo
// Uso: node scripts/build-socios.mjs      (precisa de ffmpeg; vídeo original em HERO_SOURCE)
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const SRC = process.env.HERO_SOURCE || "D:/WinTemp/claude/vdo_media/hero-VIVERDEOBRA_V.3_.mp4";
const T = process.env.SOCIOS_T || "33";
const tmp = mkdtempSync(path.join(tmpdir(), "vdo-socios-"));
const frame = path.join(tmp, "f.png");
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", T, "-i", SRC, "-frames:v", "1", frame]);

// Quadro 1920x1080 com faixas pretas (108 px em cima e embaixo): fica só a imagem útil.
const clean = await sharp(frame).extract({ left: 0, top: 108, width: 1920, height: 864 }).toBuffer();

// ---- poster do vídeo institucional (quadro 16:9 completo) ----
await sharp(frame).resize({ width: 1280 }).webp({ quality: 70, effort: 6 }).toFile("public/hero/video-poster.webp");

// ---- foto limpa para /sobre ----
const pair = await sharp(clean).extract({ left: 300, top: 0, width: 1260, height: 864 }).toBuffer();
for (const w of [600, 1200]) {
  const r = sharp(pair).resize({ width: w, kernel: "lanczos3" });
  await r.clone().avif({ quality: 52, effort: 6 }).toFile(`public/sobre/socios-${w}.avif`);
  await r.clone().webp({ quality: 74, effort: 6 }).toFile(`public/sobre/socios-${w}.webp`);
}

rmSync(tmp, { recursive: true, force: true });
console.log("ok");
