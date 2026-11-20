// E2E do Adm contra o Supabase LOCAL (Docker).
//   1) npx supabase@latest start
//   2) npm run e2e:admin            (repasse argumentos do Playwright depois de --)
//   3) npx supabase@latest stop
// Le URL e chaves locais de `supabase status -o env` em tempo de execucao: nada de chave
// no repositorio. Os usuarios de teste sao criados no global setup com senhas aleatorias.
import { execSync, spawnSync } from "node:child_process";

let out;
try {
  out = execSync("npx supabase@latest status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
} catch {
  console.error("Supabase local nao esta de pe. Rode: npx supabase@latest start");
  process.exit(1);
}
const env = {};
for (const line of out.split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line.trim());
  if (m) env[m[1]] = m[2];
}
if (!env.API_URL || !env.ANON_KEY || !env.SERVICE_ROLE_KEY) {
  console.error("Nao foi possivel ler API_URL/ANON_KEY/SERVICE_ROLE_KEY de `supabase status`.");
  process.exit(1);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL)) {
  console.error("Recusado: o e2e do Adm so roda contra o Supabase local.");
  process.exit(1);
}

const r = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    E2E_SUPABASE: "1",
    NEXT_PUBLIC_SUPABASE_URL: env.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
    // So o processo de teste usa (global setup cria/apaga usuarios); o app nao le esta variavel.
    E2E_SUPABASE_SERVICE_KEY: env.SERVICE_ROLE_KEY,
  },
});
process.exit(r.status ?? 1);
