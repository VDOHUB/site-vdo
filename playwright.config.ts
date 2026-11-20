import { defineConfig } from "@playwright/test";

// Dois modos:
// - padrao (`npm run e2e`): site sem Supabase, porta 3100; ignora o e2e do Adm.
// - Adm (`npm run e2e:admin`, ver scripts/e2e-admin.mjs): Supabase local, porta 3101,
//   so e2e/admin.spec.ts, com usuarios de teste criados no global setup.
const db = process.env.E2E_SUPABASE === "1";
const port = db ? 3101 : 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: db ? ["admin.spec.ts"] : undefined,
  testIgnore: db ? undefined : ["admin.spec.ts", "admin.setup.ts"],
  globalSetup: db ? "./e2e/admin.setup.ts" : undefined,
  fullyParallel: db ? false : undefined,
  workers: db ? 1 : undefined,
  // Dev server frio compila cada rota do Adm na primeira visita: folga maior nas esperas.
  expect: db ? { timeout: 20_000 } : undefined,
  use: { baseURL },
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: baseURL,
    // No modo Adm nunca reaproveita um servidor que pode estar sem as variaveis do Supabase.
    reuseExistingServer: !db,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
