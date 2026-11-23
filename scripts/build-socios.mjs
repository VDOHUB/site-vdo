// Gera as imagens dos sócios (reprodutível):
//   - public/sobre/socios-{600,1200}.{avif,webp}: foto limpa (quadro do vídeo institucional, sem letterbox)
//   - public/hero/socios-hero-{800,1400}.{avif,webp}: dupla exposição (sócios + foto de obra) que se
//     dissolve no grafite do site
//   - public/hero/video-poster.webp: poster 16:9 da seção do vídeo
//   - src/lib/hero-blur.generated.ts: placeholder borrado (data URI minúsculo)
// Uso: node scripts/build-socios.mjs   (precisa de ffmpeg; vídeo original em HERO_SOURCE)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const SRC = process.env.HERO_SOURCE || "D:/WinTemp/claude/vdo_media/hero-VIVERDEOBRA_V.3_.mp4";
const T = process.env.SOCIOS_T || "33";
const SCENE_T = process.env.SCENE_T || "88"; // canteiro: estaca e retroescavadeira, sem texto
const tmp = mkdtempSync(path.join(tmpdir(), "vdo-socios-"));
const frame = path.join(tmp, "f.png");
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", T, "-i", SRC, "-frames:v", "1", frame]);

// Quadro 1920x1080 com faixas pretas (108 px em cima e embaixo): fica só a imagem útil.
const sceneFrame = path.join(tmp, "s.png");
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", SCENE_T, "-i", SRC, "-frames:v", "1", sceneFrame]);
const clean = await sharp(frame).extract({ left: 0, top: 108, width: 1920, height: 864 }).toBuffer();

// ---- poster do vídeo institucional (quadro 16:9 completo, com as faixas do próprio vídeo) ----
await sharp(frame).resize({ width: 1280 }).webp({ quality: 70, effort: 6 }).toFile("public/hero/video-poster.webp");

// ---- foto limpa para /sobre (recorte nos dois sócios) ----
const pair = await sharp(clean).extract({ left: 300, top: 0, width: 1260, height: 864 }).toBuffer();
for (const w of [600, 1200]) {
  const r = sharp(pair).resize({ width: w, kernel: "lanczos3" });
  await r.clone().avif({ quality: 52, effort: 6 }).toFile(`public/sobre/socios-${w}.avif`);
  await r.clone().webp({ quality: 74, effort: 6 }).toFile(`public/sobre/socios-${w}.webp`);
}

// ---- dupla exposição ----
const W = 1400, H = 1100;
const BG = [23, 23, 22];
const PX = 380, PW = 1120;             // recorte horizontal dos sócios no quadro
const scale = (H * 0.86) / 864;        // sócios ocupam 86% da altura; o resto dissolve no grafite
const pw = Math.round(PW * scale);   // largura do recorte já escalado
const left = W - pw;                   // alinhado à direita; sobra cenário à esquerda
const ph = Math.round(864 * scale);
const partner = await sharp(clean).extract({ left: PX, top: 0, width: PW, height: 864 }).resize(pw, ph, { kernel: "lanczos3" }).toBuffer();
const partnerFull = await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([{ input: partner, left, top: 0 }]).removeAlpha().toColourspace("srgb").raw().toBuffer();

// Máscara dos sócios: polígonos/elipses em coordenadas do quadro limpo (1920x864), suavizados.
const ex = (x) => (x - PX) * scale + left; // x do quadro -> canvas
const ey = (y) => y * scale;                 // y do quadro limpo -> canvas
const poly = (pts) => pts.map(([x, y]) => `${ex(x).toFixed(1)},${ey(y - 108).toFixed(1)}`).join(" ");
const ell = (cx, cy, rx, ry) => `<ellipse cx="${ex(cx).toFixed(1)}" cy="${ey(cy - 108).toFixed(1)}" rx="${(rx * scale).toFixed(1)}" ry="${(ry * scale).toFixed(1)}"/>`;
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="black"/><g fill="white">
${ell(733, 260, 66, 102)}
<polygon points="${poly([[665,340],[805,340],[900,400],[955,480],[968,600],[905,700],[905,975],[575,975],[580,800],[530,580],[560,470],[640,380]])}"/>
<polygon points="${poly([[535,590],[580,800],[500,800],[430,790],[470,690]])}"/>
${ell(480, 865, 95, 85)}
${ell(1135, 232, 96, 74)}
${ell(1130, 385, 76, 90)}
<polygon points="${poly([[1050,440],[1215,430],[1330,520],[1440,780],[1450,975],[925,975],[950,760],[980,560],[1020,470]])}"/>
</g></svg>`;
const maskRaw = await sharp(Buffer.from(maskSvg)).blur(10).removeAlpha().extractChannel(0).raw().toBuffer();

// Cenário (foto de obra): preto e branco com leve tom quente, cobrindo o canvas.
const sceneRaw = await sharp(sceneFrame).extract({ left: 0, top: 108, width: 1920, height: 864 }).resize(W, H, { fit: "cover", position: "centre" })
  .modulate({ saturation: 0.1, brightness: 1.05 }).linear(1.2, -14).removeAlpha().toColourspace("srgb").raw().toBuffer();

const out = Buffer.alloc(W * H * 3);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x, p = i * 3;
    const m = maskRaw[i] / 255;
    // fade: dissolve para o grafite à esquerda, embaixo e (leve) em cima
    const fx = smooth(0.0, 0.42, x / W);
    const fb = 1 - smooth(0.6, 0.86, y / H);
    const ft = smooth(0.0, 0.16, y / H);
    const fr = 1 - smooth(0.86, 1.0, x / W);
    const F = fx * fb * ft * fr;
    for (let c = 0; c < 3; c++) {
      const P = Math.min(1, partnerFull[p + c] / 255 * 1.04);
      const Sg = sceneRaw[p + c] / 255;
      const tint = c === 0 ? 1.0 : c === 1 ? 0.88 : 0.62; // tom amarelado
      const S = Sg * tint;
      const screen = P + S * 0.85 - P * S * 0.85;      // dupla exposição dentro dos sócios
      const inside = P * 0.45 + screen * 0.55;
      const bg = BG[c] / 255;
      const ghost = bg + (S * 0.9) * 0.55 * smooth(0.1, 0.6, x / W); // cenário fantasma fora dos sócios
      const mix = ghost * (1 - m) + inside * m;
      const v = bg + (mix - bg) * F;
      out[p + c] = Math.max(0, Math.min(255, Math.round(v * 255)));
    }
  }
}
const comp = sharp(out, { raw: { width: W, height: H, channels: 3 } });
writeFileSync(path.join(tmp, "preview.png"), await comp.clone().png().toBuffer());
for (const w of [800, 1400]) {
  const r = comp.clone().resize({ width: w, kernel: "lanczos3" });
  await r.clone().avif({ quality: 50, effort: 6 }).toFile(`public/hero/socios-hero-${w}.avif`);
  await r.clone().webp({ quality: 72, effort: 6 }).toFile(`public/hero/socios-hero-${w}.webp`);
}
const blur = await comp.clone().resize(24).webp({ quality: 40 }).toBuffer();
writeFileSync("src/lib/hero-blur.generated.ts",
  `// Gerado por scripts/build-socios.mjs. Não editar.\nexport const HERO_BLUR = "data:image/webp;base64,${blur.toString("base64")}";\n`);
if (process.env.SOCIOS_PREVIEW) writeFileSync(process.env.SOCIOS_PREVIEW, await comp.clone().png().toBuffer());
rmSync(tmp, { recursive: true, force: true });
console.log("ok");
