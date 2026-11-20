"use client";

import Link from "next/link";
import { useState } from "react";
import { ObraCard } from "@/components/obras/ObraCard";
import type { Foto, Obra } from "@/lib/types";

type Filtro = "todas" | Obra["tipo"];
const CHIPS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "residencial", label: "Residencial" },
  { value: "corporativo", label: "Corporativo" },
];

/** Filtro Todas/Residencial/Corporativo feito no cliente sobre a lista já buscada. */
export function CatalogoGrid({ obras }: { obras: (Obra & { fotos: Foto[] })[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const visiveis = filtro === "todas" ? obras : obras.filter((o) => o.tipo === filtro);

  return (
    <>
      <div className="chips" role="group" aria-label="Filtrar por tipo de obra">
        {CHIPS.map((c) => (
          <button
            key={c.value}
            type="button"
            className="chip"
            aria-pressed={filtro === c.value}
            onClick={() => setFiltro(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {visiveis.length} {visiveis.length === 1 ? "obra exibida" : "obras exibidas"}
      </p>
      {visiveis.length === 0 ? (
        <div className="empty-panel">
          <div>
            <b>{obras.length === 0 ? "O catálogo está ganhando obras novas." : "Nenhuma obra deste tipo por enquanto."}</b>
            <p>As obras entregues entram por aqui, com fotos e galeria completa. Enquanto isso, fale com a gente.</p>
          </div>
          <Link className="btn" href="/contato">
            Falar com a equipe
          </Link>
        </div>
      ) : (
        <div className="obra-grid">
          {visiveis.map((o) => (
            <ObraCard key={o.id} obra={o} />
          ))}
        </div>
      )}
    </>
  );
}
