import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isAdmin } from "@/lib/supabase/server";

/**
 * Porta do Adm. Chamada no inicio de TODA Server Action e de toda leitura de dados das
 * telas protegidas (o proxy e so a primeira barreira; actions sao POSTs publicos).
 *
 * - Identidade: `auth.getUser()` (valida o token no servidor de Auth); nunca getSession()
 *   nem o conteudo do cookie.
 * - Papel: `isAdmin(user.id)` com o id devolvido pelo getUser.
 * - Sem sessao -> /admin/login; logado sem papel admin -> /admin/negado.
 *
 * Devolve o cliente da sessao (anon key + cookie): toda escrita continua passando pelo RLS.
 */
export async function requireAdmin(): Promise<{ supabase: SupabaseClient; userId: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/admin/login");
  let supabase: SupabaseClient;
  let userId: string | null = null;
  try {
    supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) userId = data.user.id;
  } catch {
    redirect("/admin/login");
  }
  if (!userId) redirect("/admin/login");
  if (!(await isAdmin(userId))) redirect("/admin/negado");
  return { supabase: supabase!, userId };
}
