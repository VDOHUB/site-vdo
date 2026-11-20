import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { optimizeImage, probeVideo } from './optimize-media.mjs';

sharp.cache(false);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_VIDEO = process.env.HERO_SOURCE || 'D:/WinTemp/claude/vdo_media/hero-VIVERDEOBRA_V.3_.mp4';
const HERO_MP4 = path.join(ROOT, 'public/hero/hero-1080.mp4');

test('optimizeImage gera avif e webp nas larguras pedidas, todos < 400 KB', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vdo-img-'));
  try {
    const w = 2400, h = 1600;
    const raw = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3;
        raw[i] = (x / w) * 255;
        raw[i + 1] = (y / h) * 255;
        raw[i + 2] = ((x + y) % 256);
      }
    const src = path.join(dir, 'fixture.jpg');
    await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg().toFile(src);

    const out = path.join(dir, 'out');
    const res = await optimizeImage(src, out, [800, 1600]);
    assert.equal(res.length, 4);
    for (const width of [800, 1600])
      for (const ext of ['avif', 'webp']) {
        const f = res.find((r) => r.width === width && r.file.endsWith('.' + ext));
        assert.ok(f, `faltou ${width} ${ext}`);
        const s = await stat(f.file);
        assert.ok(s.size > 0 && s.size < 400 * 1024, `${f.file} ${s.size}`);
        assert.equal((await sharp(f.file).metadata()).width, width);
      }
    assert.equal((await readdir(out)).length, 4);
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test('hero-1080.mp4 < 25 MB e duração igual à registrada no manifesto', async () => {
  assert.ok(existsSync(HERO_MP4), 'hero-1080.mp4 não existe');
  assert.ok((await stat(HERO_MP4)).size < 25 * 1024 * 1024);
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'scripts/media-manifest.json'), 'utf8'));
  const a = await probeVideo(HERO_MP4);
  assert.ok(Math.abs(a.durationSec - manifest.hero.sourceDurationSec) <= 0.5, `${a.durationSec} vs ${manifest.hero.sourceDurationSec}`);
  assert.ok(a.width <= 1920 && a.height <= 1080);
});

test('duração igual à do vídeo original (se disponível)', async (t) => {
  if (!existsSync(SOURCE_VIDEO)) return t.skip('source video missing: run `node scripts/optimize-media.mjs` first or set HERO_SOURCE');
  const [a, b] = await Promise.all([probeVideo(HERO_MP4), probeVideo(SOURCE_VIDEO)]);
  assert.ok(Math.abs(a.durationSec - b.durationSec) <= 0.5, `${a.durationSec} vs ${b.durationSec}`);
});
