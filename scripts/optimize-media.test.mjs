import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { optimizeImage, probeVideo } from './optimize-media.mjs';

sharp.cache(false);
const SOURCE_VIDEO = 'D:/WinTemp/claude/vdo_media/hero-VIVERDEOBRA_V.3_.mp4';

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

test('hero-1080.mp4 < 25 MB e mesma duração do original', async () => {
  const out = 'public/hero/hero-1080.mp4';
  assert.ok(existsSync(out), 'hero-1080.mp4 não existe');
  assert.ok((await stat(out)).size < 25 * 1024 * 1024);
  const [a, b] = await Promise.all([probeVideo(out), probeVideo(SOURCE_VIDEO)]);
  assert.ok(Math.abs(a.durationSec - b.durationSec) <= 0.5, `${a.durationSec} vs ${b.durationSec}`);
  assert.ok(a.width <= 1920 && a.height <= 1080);
});
