// Variaveis publicas do Supabase. Referencias literais a process.env.NEXT_PUBLIC_*
// para que o Next as embuta no bundle do navegador.
export function supabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL (veja .env.example)");
  if (!anonKey) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY (veja .env.example)");
  return { url, anonKey };
}
