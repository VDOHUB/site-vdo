import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "./env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a anon key + sessao do cookie: todas as consultas passam pelo RLS.
 * Assincrono porque `cookies()` e assincrono no Next 16.
 */
export async function createServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = supabasePublicEnv();
  // Leitura de requisicao: com sessao no cookie o supabase-js consulta o relogio
  // (expiracao do token), o que o Cache Components nao aceita fora dela.
  await connection();
  const cookieStore = await cookies();
  return createSsrServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado de um Server Component: nao da para gravar cookie aqui.
          // O middleware renova a sessao, entao pode ser ignorado.
        }
      },
    },
  });
}

/**
 * true se `userId` tem perfil com role 'admin'. A leitura de `profiles` passa pelo
 * RLS (dono ou admin), entao so responde true para o proprio usuario da sessao
 * ou quando quem pergunta ja e admin. Qualquer erro conta como "nao admin".
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { role?: string }).role === "admin";
}
