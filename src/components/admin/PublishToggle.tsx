"use client";

import { useState, useTransition } from "react";
import { togglePublicado } from "@/lib/admin/actions";

/** Liga/desliga a obra no site. A action revalida o papel de admin e as paginas publicas. */
export function PublishToggle({ id, titulo, publicado }: { id: string; titulo: string; publicado: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="toggle-wrap">
      <button
        type="button"
        className={`toggle${publicado ? " on" : ""}`}
        role="switch"
        aria-checked={publicado}
        aria-label={`Publicar ${titulo} no site`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await togglePublicado(id, !publicado);
            if (!r.ok) setError(r.error ?? "Não foi possível alterar.");
          })
        }
      >
        <span aria-hidden="true" className="toggle-dot" />
        {publicado ? "Publicado" : "Rascunho"}
      </button>
      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}
    </span>
  );
}
