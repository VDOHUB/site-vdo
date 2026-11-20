"use server";

import { validateLead, type LeadState } from "@/lib/leads";
import { sendLeadEmail } from "@/lib/leads-email";
import { createServiceClient } from "@/lib/supabase/service";

const GENERIC_ERROR = "Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.";

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const v = validateLead({
    topico: formData.get("topico"),
    nome: formData.get("nome"),
    whatsapp: formData.get("whatsapp"),
    mensagem: formData.get("mensagem"),
    website: formData.get("website"),
  });
  if (!v.ok) return { status: "error", errors: v.errors };
  // Honeypot: finge sucesso, sem gravar nem enviar e-mail.
  if (v.data.website.trim() !== "") return { status: "ok" };

  const { topico, nome, whatsapp, mensagem } = v.data;

  // 1) Grava primeiro: o lead nunca se perde por falha de e-mail.
  let id: string | undefined;
  try {
    const { data, error } = await createServiceClient()
      .from("leads")
      .insert({ topico, nome, whatsapp, mensagem, status: "nova" })
      .select("id")
      .single();
    if (error || !data) throw new Error("insert falhou");
    id = (data as { id: string }).id;
  } catch {
    console.error("[leads] falha ao gravar lead");
    return { status: "error", errors: { form: GENERIC_ERROR } };
  }

  // 2) Aviso por e-mail: best effort; falha so e logada (sem conteudo do lead).
  try {
    await sendLeadEmail({ topico, nome, whatsapp, mensagem });
  } catch {
    console.error(`[leads] falha ao enviar e-mail do lead ${id}`);
  }
  return { status: "ok" };
}
