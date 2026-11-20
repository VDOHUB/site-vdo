"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

// Mesma mensagem para e-mail inexistente, senha errada ou conta sem confirmacao:
// a tela nao revela se o e-mail existe. Nada de e-mail/senha em log.
const GENERIC = "E-mail ou senha incorretos.";
const RATE = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
const DOWN = "O Adm está indisponível no momento. Tente mais tarde.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const emailRaw = formData.get("email");
  const passRaw = formData.get("password");
  const email = typeof emailRaw === "string" ? emailRaw.trim().slice(0, 320) : "";
  const password = typeof passRaw === "string" ? passRaw : "";
  if (!email || !password || password.length > 1000) return { error: GENERIC, email };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: DOWN, email };

  let destino: string;
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error?.status === 429 ? RATE : GENERIC, email };
    // Papel lido com a sessao recem-criada (RLS: o usuario so ve o proprio perfil).
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    destino = (profile as { role?: string } | null)?.role === "admin" ? "/admin/obras" : "/admin/negado";
  } catch {
    console.error("[adm] login indisponivel");
    return { error: DOWN, email };
  }
  // Destinos fixos (sem parametro "next"): nada de redirecionamento aberto.
  redirect(destino);
}

/** Sair: encerra a sessao do proprio usuario (nao exige admin). */
export async function logout(): Promise<void> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createServerClient();
      await supabase.auth.signOut();
    } catch {
      // sem sessao: nada a fazer
    }
  }
  redirect("/admin/login");
}
