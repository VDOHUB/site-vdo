import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "./env";

/** Cliente Supabase para Client Components (anon key + sessao; sujeito ao RLS). */
export function createBrowserClient(): SupabaseClient {
  const { url, anonKey } = supabasePublicEnv();
  return createSsrBrowserClient(url, anonKey);
}
