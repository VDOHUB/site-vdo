// Validacao do formulario de contato. Sem dependencias de servidor (usavel no cliente).
export const TOPICOS = ["Orçamento", "Dúvidas", "Sugestões"] as const;
export type Topico = (typeof TOPICOS)[number];

// Limites iguais aos check constraints de public.leads.
export const LIMITS = { nome: 120, mensagem: 5000 } as const;

export type LeadInput = {
  topico: Topico;
  nome: string;
  whatsapp: string; // somente digitos (10 a 11)
  mensagem: string;
  /** Honeypot: preenchido so por robos. */
  website: string;
};

export type LeadValues = { topico: string; nome: string; whatsapp: string; mensagem: string };

export type LeadState = {
  status: "idle" | "ok" | "error";
  errors?: Record<string, string>;
  /** Valores enviados (sem o honeypot), devolvidos em erro para o formulario nao limpar. */
  values?: LeadValues;
};

export type LeadValidation =
  | { ok: true; data: LeadInput }
  | { ok: false; errors: Record<string, string> };

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function validateLead(input: unknown): LeadValidation {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: { form: "Dados inválidos." } };
  }
  const o = input as Record<string, unknown>;
  const website = str(o.website);
  // Honeypot: nao valida o resto; quem chama trata como sucesso silencioso.
  if (website.trim() !== "") {
    return { ok: true, data: { topico: "Orçamento", nome: "", whatsapp: "", mensagem: "", website } };
  }

  const errors: Record<string, string> = {};
  const topico = str(o.topico);
  if (!(TOPICOS as readonly string[]).includes(topico)) errors.topico = "Escolha um assunto.";
  const nome = str(o.nome).trim();
  if (!nome) errors.nome = "Informe seu nome.";
  else if (nome.length > LIMITS.nome) errors.nome = `O nome pode ter no máximo ${LIMITS.nome} caracteres.`;
  let whatsapp = str(o.whatsapp).replace(/\D/g, "");
  // Codigo do pais (+55): 12 a 13 digitos comecando com 55.
  if ((whatsapp.length === 12 || whatsapp.length === 13) && whatsapp.startsWith("55")) {
    whatsapp = whatsapp.slice(2);
  }
  if (whatsapp.length < 10 || whatsapp.length > 11) {
    errors.whatsapp = "Informe um WhatsApp com DDD (10 ou 11 dígitos).";
  }
  const mensagem = str(o.mensagem).trim();
  if (!mensagem) errors.mensagem = "Escreva sua mensagem.";
  else if (mensagem.length > LIMITS.mensagem) {
    errors.mensagem = `A mensagem pode ter no máximo ${LIMITS.mensagem} caracteres.`;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { topico: topico as Topico, nome, whatsapp, mensagem, website: "" } };
}
