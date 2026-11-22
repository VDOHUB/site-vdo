// Lighthouse mobile na Home, contra `next start` (build de produção).
// Uso: npm run build && npm run test:lighthouse   (ou LIGHTHOUSE_URL=... para outro alvo)
import { writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";

const MIN = { performance: 85, accessibility: 95, "best-practices": 90, seo: 95 };
const PORT = process.env.LIGHTHOUSE_PORT || "3200";
const URL_ = process.env.LIGHTHOUSE_URL || `http://localhost:${PORT}/`;

async function waitFor(url, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("servidor não respondeu: " + url);
}

let server;
if (!process.env.LIGHTHOUSE_URL) {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", PORT], { stdio: "ignore" });
  await waitFor(URL_);
}
const profile = mkdtempSync(path.join(tmpdir(), "vdo-lh-"));
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH || chromium.executablePath(),
  userDataDir: profile,
  chromeFlags: ["--headless=new", "--no-sandbox"],
});
let failed = false;
try {
  // O Lighthouse em máquina local oscila bastante entre execuções (variação de 10+ pontos em
  // desempenho): roda LIGHTHOUSE_RUNS vezes (padrão 3) e usa a mediana de cada categoria.
  const RUNS = Number(process.env.LIGHTHOUSE_RUNS || 3);
  const lhrs = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await lighthouse(URL_, { port: chrome.port, output: "json", logLevel: "error", formFactor: "mobile", blockedUrlPatterns: process.env.LIGHTHOUSE_BLOCK ? process.env.LIGHTHOUSE_BLOCK.split(",") : undefined });
    lhrs.push(r.lhr);
  }
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const lhr = lhrs[0];
  if (process.env.LIGHTHOUSE_JSON) writeFileSync(process.env.LIGHTHOUSE_JSON, JSON.stringify(lhrs));
  for (const [id, min] of Object.entries(MIN)) {
    const all = lhrs.map((l) => Math.round((l.categories[id].score ?? 0) * 100));
    const score = median(all);
    const ok = score >= min;
    if (!ok) failed = true;
    console.log(`${ok ? "OK  " : "FAIL"} ${id}: ${score} mediana de [${all.join(", ")}] (mínimo ${min})`);
  }
  const a = lhr.audits;
  console.log(
    `LCP ${a["largest-contentful-paint"].displayValue} | CLS ${a["cumulative-layout-shift"].displayValue} | TBT ${a["total-blocking-time"].displayValue} | peso ${a["total-byte-weight"].displayValue}`,
  );
} finally {
  try { await chrome.kill(); } catch {}
  server?.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
process.exit(failed ? 1 : 0);
