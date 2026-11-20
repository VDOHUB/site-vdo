"use client";

import { useState, useTransition } from "react";
import { deleteObra } from "@/lib/admin/actions";

export function DeleteObraButton({ id, titulo }: { id: string; titulo: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="form-actions">
      <button
        type="button"
        className="btn danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Excluir "${titulo}" e todas as fotos? Não dá para desfazer.`)) return;
          start(async () => {
            setError(null);
            const r = await deleteObra(id); // em sucesso a action redireciona para a lista
            if (r && !r.ok) setError(r.error ?? "Não foi possível excluir.");
          });
        }}
      >
        {pending ? "Excluindo…" : "Excluir obra"}
      </button>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
