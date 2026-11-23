// Pipeline de mídia: extrai do zip (não confiável) apenas o necessário para uma pasta
// FORA do projeto e gera saídas otimizadas (imagens AVIF/WebP e vídeo do hero).
// Uso: node scripts/optimize-media.mjs [--zip <caminho>] [--work <dir>] [--only images|video]
// Variáveis de ambiente (vídeo): CRF1080 (padrão 28), CRF720 (30), CRFWEBM (38) ajustam a qualidade;
// HERO_ONLY=<hero-1080.mp4|hero-720.mp4|hero-1080.webm> reencoda só esse arquivo.
// Teste: HERO_SOURCE=<mp4 original> sobrescreve o caminho do vídeo fonte.
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import yauzl from 'yauzl';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_IMG = 400 * 1024;

/** Gera .avif e .webp por largura. Arquivos: <baseName>-<width>.<ext> */
export async function optimizeImage(srcPath, outDir, widths, baseName = path.parse(srcPath).name) {
  await mkdir(outDir, { recursive: true });
  const results = [];
  for (const width of widths) {
    const base = sharp(srcPath).rotate().resize({ width });
    for (const ext of ['avif', 'webp']) {
      const file = path.join(outDir, `${baseName}-${width}.${ext}`);
      let q = ext === 'avif' ? 55 : 78;
      for (;;) {
        const clone = base.clone();
        await (ext === 'avif' ? clone.avif({ quality: q, effort: 4 }) : clone.webp({ quality: q })).toFile(file);
        if ((await stat(file)).size < MAX_IMG || q <= 30) break;
        q -= 8;
      }
      results.push({ file, width });
    }
  }
  return results;
}

function run(cmd, args, binary = false) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out = [];
    let err = '';
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (c) => {
      if (c !== 0) return reject(new Error(`${cmd} saiu ${c}: ${err.slice(-500)}`));
      const buf = Buffer.concat(out);
      resolve(binary ? buf : buf.toString());
    });
  });
}

export async function probeVideo(file) {
  const out = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]);
  const j = JSON.parse(out);
  return { durationSec: Number(j.format.duration), width: j.streams[0].width, height: j.streams[0].height };
}

const destName = (w) => `${w.key}-${w.source.replace(/[^\w.-]/g, '_')}`;

/** Extrai entradas cujo nome termina em "/<source>" e contém folderMatch (nomes do zip têm mojibake). */
async function extractFromZip(zipPath, wanted, workDir) {
  await mkdir(workDir, { recursive: true });
  const found = new Map();
  await new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err);
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.on('entry', (entry) => {
        const w = wanted.find((x) => entry.fileName.endsWith('/' + x.source) &&
          (!x.folderMatch || entry.fileName.includes(x.folderMatch)));
        if (!w) return zip.readEntry();
        const dest = path.join(workDir, destName(w));
        found.set(w.key, dest);
        zip.openReadStream(entry, (e, rs) => {
          if (e) return reject(e);
          pipeline(rs, createWriteStream(dest)).then(() => zip.readEntry(), reject);
        });
      });
      zip.readEntry();
    });
  });
  for (const x of wanted) if (!found.has(x.key)) throw new Error(`Não encontrado no zip: ${x.source}`);
  return found;
}

async function encodeHero(src, outDir) {
  await mkdir(outDir, { recursive: true });
  const common = ['-y', '-hide_banner', '-loglevel', 'error', '-i', src];
  const h264 = ['-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
  const aac = ['-c:a', 'aac', '-b:a', '112k', '-ac', '2'];
  const opus = ['-c:a', 'libopus', '-b:a', '96k', '-ac', '2'];
  const env = process.env;
  const jobs = [
    ['hero-1080.mp4', ['-vf', 'scale=-2:1080', ...h264, '-crf', env.CRF1080 || '28', ...aac]],
    ['hero-720.mp4', ['-vf', 'scale=-2:720', ...h264, '-crf', env.CRF720 || '30', ...aac]],
    ['hero-1080.webm', ['-vf', 'scale=-2:1080', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', env.CRFWEBM || '38',
      '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', ...opus]],
  ];
  const only = env.HERO_ONLY;
  for (const [name, args] of jobs) {
    if (only && only !== name) continue;
    console.log('ffmpeg', name);
    await run('ffmpeg', [...common, ...args, path.join(outDir, name)]);
  }
  // O poster do vídeo vem de scripts/build-socios.mjs (video-poster.webp).
}

async function main() {
  const args = process.argv.slice(2);
  const get = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
  const zip = get('--zip', 'D:/Downloads/OneDrive_2026-11-20.zip');
  const work = get('--work', 'D:/WinTemp/claude/vdo_media');
  const only = get('--only', 'all');
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'scripts/media-manifest.json'), 'utf8'));

  const wanted = [];
  if (only !== 'images') wanted.push({ key: 'hero', source: manifest.hero.source });
  if (only !== 'video')
    for (const o of manifest.obras)
      for (const i of o.images) wanted.push({ key: `${o.slug}-${i.order}`, source: i.source, folderMatch: o.folderMatch });

  const found = new Map();
  const missing = wanted.filter((w) => {
    const dest = path.join(work, destName(w));
    if (existsSync(dest)) { found.set(w.key, dest); return false; }
    return true;
  });
  if (missing.length) for (const [k, v] of await extractFromZip(zip, missing, work)) found.set(k, v);

  if (only !== 'video')
    for (const o of manifest.obras)
      for (const i of o.images)
        await optimizeImage(found.get(`${o.slug}-${i.order}`), path.join(ROOT, 'public/obras', o.slug), [800, 1600], String(i.order));
  if (only !== 'images') await encodeHero(found.get('hero'), path.join(ROOT, 'public/hero'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
