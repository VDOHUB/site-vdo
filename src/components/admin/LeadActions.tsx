"use client";

import { useState, useTransition } from "react";
import { setLeadStatus } from "@/lib/admin/actions";
import type { LeadStatus } from "@/lib/admin/validation";

const ACOES: Record<LeadStatus, { to: LeadStatus; label: string }[]> = {
  nova: [
    { to: "lida", label: "Marcar como lida" },
    { to: "arquivada", label: "Arquivar" },
  ],
  lida: [
    { to: "nova", label: "Marcar como nova" },
    { to: "arquivada", label: "Arquivar" },
  ],
  arquivada: [{ to: "lida", label: "Desarquivar" }],
};

export function LeadActions({ id, status, nome }: { id: string; status: LeadStatus; nome: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="msg-actions" role="group" aria-label={`Ações da mensagem de ${nome}`}>
      {ACOES[status].map((a) => (
        <button
          key={a.to}
          type="button"
          className="btn sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await setLeadStatus(id, a.to);
              if (!r.ok) setError(r.error ?? "Não foi possível alterar.");
            })
          }
        >
          {a.label}
        </button>
      ))}
      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
