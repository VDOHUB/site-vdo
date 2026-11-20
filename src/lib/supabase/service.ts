import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave de servico (ignora o RLS). Somente servidor: nunca importar
 * de Client Components. A chave nunca e logada.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL (veja .env.example)");
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (veja .env.example)");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
