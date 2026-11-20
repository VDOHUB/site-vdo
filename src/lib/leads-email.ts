import "server-only";

type EmailLead = { topico: string; nome: string; whatsapp: string; mensagem: string };

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Monta o aviso. O assunto usa so o topico (lista fechada), nunca texto livre. */
export function buildLeadEmail(l: EmailLead): { subject: string; html: string; text: string } {
  const subject = `Novo contato pelo site: ${l.topico.replace(/[\r\n]+/g, " ")}`;
  const html =
    `<h2>Novo contato pelo site</h2>` +
    `<p><strong>Assunto:</strong> ${escapeHtml(l.topico)}</p>` +
    `<p><strong>Nome:</strong> ${escapeHtml(l.nome)}</p>` +
    `<p><strong>WhatsApp:</strong> ${escapeHtml(l.whatsapp)}</p>` +
    `<p><strong>Mensagem:</strong></p><p style="white-space:pre-wrap">${escapeHtml(l.mensagem)}</p>`;
  const text = `Novo contato pelo site\nAssunto: ${l.topico}\nNome: ${l.nome}\nWhatsApp: ${l.whatsapp}\n\n${l.mensagem}`;
  return { subject, html, text };
}

/** Envia via API do Resend. Sem chaves configuradas: nao faz nada. Lanca em falha. */
export async function sendLeadEmail(l: EmailLead): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_NOTIFY_EMAIL;
  if (!key || !to) return;
  const from = process.env.LEADS_FROM_EMAIL || "Viver de Obra <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...buildLeadEmail(l) }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Resend respondeu ${res.status}`);
}
