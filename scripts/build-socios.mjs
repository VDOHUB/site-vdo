// Gera as imagens dos sócios (reprodutível). Ferramenta de desenvolvimento: NÃO entra no bundle do site.
//   - public/sobre/socios-{600,1200}.{avif,webp}: foto limpa (quadro do vídeo institucional, sem letterbox)
//   - public/hero/socios-hero-{800,1400}.{avif,webp}: pôster de dupla exposição (sócios recortados + foto de obra
//     dentro das silhuetas, sobre painel creme com arco amarelo)
//   - public/hero/video-poster.webp: poster 16:9 da seção do vídeo
//   - src/lib/hero-blur.generated.ts: placeholder borrado (data URI minúsculo)
//
// Uso: node scripts/build-socios.mjs      (precisa de ffmpeg; vídeo original em HERO_SOURCE)
//
// Recorte (matte) dos sócios: scripts/socios-matte.png (só o canal alfa, 1920x864). Foi gerado uma vez com
// @imgly/background-removal-node (modelo de segmentação de pessoas, roda local). Para refazer:
//   mkdir /tmp/bg && cd /tmp/bg && npm i @imgly/background-removal-node
//   (removeBackground no quadro limpo e salvar o canal alfa em scripts/socios-matte.png)
// O matte é limpo aqui (endurece a borda em 1-2 px e remove manchas isoladas), sem borrão pesado.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const SRC = process.env.HERO_SOURCE || "D:/WinTemp/claude/vdo_media/hero-VIVERDEOBRA_V.3_.mp4";
const T = process.env.SOCIOS_T || "33";
const SCENE = "public/obras/dunas-douradas/13-1600.webp"; // sala integrada: ripado, prateleiras, trilho de luz
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

// ---- matte limpo ----
const FW = 1920, FH = 864;
const raw = await sharp("scripts/socios-matte.png").extractChannel(0).raw().toBuffer();
// 1) leve suavização (1 px) e curva: borda nítida e sem translucidez em capacete/roupa escura
const soft = await sharp(raw, { raw: { width: FW, height: FH, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const alpha = Buffer.alloc(FW * FH);
for (let i = 0; i < alpha.length; i++) alpha[i] = Math.round(sm(0.3, 0.62, soft[i] / 255) * 255);
// 2) remove manchas isoladas: mantém só componentes grandes (>3% do maior)
const label = new Int32Array(FW * FH);
const sizes = [0];
let nl = 0;
for (let s = 0; s < alpha.length; s++) {
  if (alpha[s] < 128 || label[s]) continue;
  nl++; let n = 0; const stack = [s]; label[s] = nl;
  while (stack.length) {
    const p = stack.pop(); n++;
    const x = p % FW, y = (p / FW) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < FW - 1 ? p + 1 : -1, y > 0 ? p - FW : -1, y < FH - 1 ? p + FW : -1]) {
      if (q >= 0 && !label[q] && alpha[q] >= 128) { label[q] = nl; stack.push(q); }
    }
  }
  sizes.push(n);
}
const biggest = Math.max(...sizes);
const keep = new Set(sizes.map((n, i) => (n > biggest * 0.03 ? i : -1)).filter((i) => i > 0));
for (let i = 0; i < alpha.length; i++) if (alpha[i] && !(label[i] ? keep.has(label[i]) : near(i))) alpha[i] = 0;
function near(i) { // pixels de borda (alfa parcial) herdam o rótulo vizinho
  const x = i % FW, y = (i / FW) | 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || yy < 0 || xx >= FW || yy >= FH) continue;
    const l = label[yy * FW + xx];
    if (l && keep.has(l)) return true;
  }
  return false;
}

// 3) conserto pontual: o modelo perde o topo do capacete preto do sócio da direita (reflexo cinza).
//    Une uma cúpula elíptica ao matte nessa região.
const dome = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}"><rect width="100%" height="100%" fill="black"/><ellipse cx="1136" cy="116" rx="100" ry="77" fill="white"/></svg>`))
  .extractChannel(0).raw().toBuffer();
for (let i = 0; i < alpha.length; i++) if (dome[i] > alpha[i]) alpha[i] = dome[i];
if (process.env.SOCIOS_DEBUG) await sharp(alpha, { raw: { width: FW, height: FH, channels: 1 } }).png().toFile(process.env.SOCIOS_DEBUG);
// ---- dupla exposição ----
const W = 1400, H = 1200;
const CREAM = [243, 239, 230], YEL = [240, 179, 35], GRAF = [29, 29, 27];
// recorte dos sócios: região x 380..1500 do quadro (1120 px) -> escala para a largura do painel
const PX = 380, PW = 1120;
const sc = (W * 0.98) / PW;            // quase a largura toda
const pw = Math.round(PW * sc), ph = Math.round(FH * sc);
const offX = Math.round((W - pw) / 2), offY = H - ph;   // alinhados ao rodapé do painel
console.log('buf sizes', pw, ph);
const colorBuf = await sharp(clean).extract({ left: PX, top: 0, width: PW, height: FH }).resize(pw, ph, { kernel: "lanczos3" }).removeAlpha().raw().toBuffer();
const alphaBuf = await sharp(alpha, { raw: { width: FW, height: FH, channels: 1 } }).extract({ left: PX, top: 0, width: PW, height: FH }).resize(pw, ph, { kernel: "lanczos3" }).extractChannel(0).raw().toBuffer();
// cenário (foto de obra) em duotom grafite -> amarelo quente, cobrindo o painel
const sceneBuf = await sharp(SCENE).resize(W, H, { fit: "cover", position: "left" }).greyscale().normalise().extractChannel(0).raw().toBuffer();

console.log('lens', colorBuf.length / (pw * ph), alphaBuf.length / (pw * ph), sceneBuf.length / (W * H));
// áreas dos rostos (preservadas nítidas), em coordenadas do quadro -> canvas
const fx = (x) => (x - PX) * sc + offX, fy = (y) => y * sc + offY;
const faces = [
  { cx: fx(733), cy: fy(255 - 108), rx: 108 * sc, ry: 150 * sc }, // sócio da esquerda (rosto e cabelo)
  { cx: fx(1135), cy: fy(300 - 108), rx: 130 * sc, ry: 200 * sc }, // sócio da direita (capacete e rosto)
];
const faceK = (x, y) => {
  let m = 0;
  for (const f of faces) {
    const d = Math.hypot((x - f.cx) / f.rx, (y - f.cy) / f.ry);
    m = Math.max(m, 1 - sm(0.8, 1.25, d));
  }
  return m;
};

const out = Buffer.alloc(W * H * 3);
// arco amarelo atrás dos sócios (forma gráfica do pôster)
const arc = { cx: W * 0.5, top: H * 0.07, r: W * 0.4 };
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 3;
    // fundo: creme + arco amarelo (borda nítida, anti-serrilhada)
    const dx = Math.abs(x - arc.cx);
    const inCircle = Math.hypot(dx, y - (arc.top + arc.r));
    const inArc = y >= arc.top + arc.r ? 1 - sm(arc.r - 1, arc.r + 1, dx) : 1 - sm(arc.r - 1, arc.r + 1, inCircle);
    let bg = [0, 1, 2].map((c) => CREAM[c] * (1 - inArc) + YEL[c] * inArc);
    // cenário fantasma suave no creme (textura arquitetônica, bem leve)
    const s0 = sceneBuf[y * W + x] / 255;
    // pessoa
    const px = x - offX, py = y - offY;
    let a = 0, P = [0, 0, 0];
    if (px >= 0 && py >= 0 && px < pw && py < ph) {
      const q = py * pw + px;
      a = alphaBuf[q] / 255;
      P = [colorBuf[q * 3], colorBuf[q * 3 + 1], colorBuf[q * 3 + 2]];
    }
    if (a > 0) {
      const k = faceK(x, y);
      const lumP = (0.3 * P[0] + 0.59 * P[1] + 0.11 * P[2]) / 255;
      // duotom: grafite -> amarelo quente conforme a luminância do cenário
      const t = Math.pow(s0, 0.9);
      const S = [0, 1, 2].map((c) => GRAF[c] * (1 - t) + (c === 0 ? 255 : c === 1 ? 214 : 120) * t);
      // cenário modulado pela luz da pessoa (mantém volume) e misturado mais forte no corpo, menos no rosto
      const strength = 0.62 * (1 - k) * (0.55 + 0.45 * Math.min(1, y / (H * 0.55)));
      const inner = [0, 1, 2].map((c) => S[c] * (0.5 + 0.7 * lumP));
      const px3 = [0, 1, 2].map((c) => P[c] * (1 - strength) + inner[c] * strength);
      for (let c = 0; c < 3; c++) bg[c] = bg[c] * (1 - a) + px3[c] * a;
    }
    for (let c = 0; c < 3; c++) out[p + c] = Math.max(0, Math.min(255, Math.round(bg[c])));
  }
}
const comp = sharp(out, { raw: { width: W, height: H, channels: 3 } });
for (const w of [800, 1400]) {
  const r = comp.clone().resize({ width: w, kernel: "lanczos3" });
  await r.clone().avif({ quality: 60, effort: 6 }).toFile(`public/hero/socios-hero-${w}.avif`);
  await r.clone().webp({ quality: 82, effort: 6 }).toFile(`public/hero/socios-hero-${w}.webp`);
}
const blur = await comp.clone().resize(24).webp({ quality: 40 }).toBuffer();
writeFileSync("src/lib/hero-blur.generated.ts",
  `// Gerado por scripts/build-socios.mjs. Não editar.\nexport const HERO_BLUR = "data:image/webp;base64,${blur.toString("base64")}";\n`);
if (process.env.SOCIOS_PREVIEW) writeFileSync(process.env.SOCIOS_PREVIEW, await comp.clone().png().toBuffer());
rmSync(tmp, { recursive: true, force: true });
console.log("ok");
