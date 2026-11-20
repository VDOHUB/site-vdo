// Global setup do e2e do Adm (so no modo E2E_SUPABASE=1, contra o Supabase LOCAL).
// Cria um admin e um usuario comum com senhas aleatorias geradas a cada execucao
// (nunca fixas, nunca impressas) e os apaga no teardown.
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.E2E_SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Rode pelo `npm run e2e:admin` (Supabase local).");
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) throw new Error("e2e do Adm so roda contra o Supabase local.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const E2E_PREFIX = "Teste E2E";

export async function cleanupObras(sb: SupabaseClient) {
  const { data } = await sb.from("obras").select("id").like("titulo", `${E2E_PREFIX}%`);
  for (const { id } of (data ?? []) as { id: string }[]) {
    const { data: files } = await sb.storage.from("obras").list(`uploads/${id}`);
    if (files?.length) await sb.storage.from("obras").remove(files.map((f) => `uploads/${id}/${f.name}`));
    await sb.from("obras").delete().eq("id", id);
  }
  await sb.from("leads").delete().like("nome", "E2E %");
}

async function createUser(sb: SupabaseClient, kind: string) {
  const email = `e2e-${kind}-${randomBytes(6).toString("hex")}@example.test`;
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`falha ao criar usuario de teste (${kind})`);
  return { id: data.user.id, email, password };
}

export default async function globalSetup() {
  const sb = serviceClient();
  await cleanupObras(sb);
  const admin = await createUser(sb, "admin");
  const user = await createUser(sb, "user");
  const { error } = await sb.from("profiles").insert({ id: admin.id, role: "admin" });
  if (error) throw new Error("falha ao criar perfil admin de teste");

  // Repassado aos workers pelo ambiente do processo (nao vai para disco nem para o log).
  process.env.E2E_ADMIN_EMAIL = admin.email;
  process.env.E2E_ADMIN_PASSWORD = admin.password;
  process.env.E2E_USER_EMAIL = user.email;
  process.env.E2E_USER_PASSWORD = user.password;

  return async () => {
    await cleanupObras(sb);
    await sb.auth.admin.deleteUser(admin.id); // profiles cai junto (on delete cascade)
    await sb.auth.admin.deleteUser(user.id);
  };
}
