import Image from "next/image";
import Link from "next/link";
import TiltedCard from "@/components/reactbits/TiltedCard";
import { photoUrl } from "@/lib/obras";
import type { Foto, Obra } from "@/lib/types";

export const STATUS_LABEL: Record<Obra["status"], string> = {
  pronta: "Pronta",
  em_andamento: "Em andamento",
  a_venda: "À venda",
  vendido: "Vendido",
};

function details(obra: Obra): string | null {
  const parts = [
    obra.area,
    obra.quartos != null ? `${obra.quartos} ${obra.quartos === 1 ? "quarto" : "quartos"}` : null,
    obra.vagas != null ? `${obra.vagas} ${obra.vagas === 1 ? "vaga" : "vagas"}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Card 4:5 de obra com inclinação 3D (React Bits TiltedCard). Leva para `/catalogo/<slug>`.
 * `fotos` é opcional: `listObras` não traz fotos; sem foto o card usa uma superfície neutra.
 */
export function ObraCard({ obra }: { obra: Obra & { fotos?: Foto[] } }) {
  const cover = obra.fotos?.[0];
  const progresso = obra.progresso != null ? Math.max(0, Math.min(100, Math.round(obra.progresso))) : null;
  const ficha = obra.status === "a_venda" || obra.status === "vendido" ? details(obra) : null;
  const sold = obra.status === "vendido";

  return (
    <Link href={`/catalogo/${obra.slug}`} className={`obra-card${sold ? " is-sold" : ""}`}>
      <TiltedCard
        containerHeight="100%"
        containerWidth="100%"
        imageHeight="100%"
        imageWidth="100%"
        radius={18}
        perspective={900}
        rotateAmplitude={7}
        scaleOnHover={1.02}
        glare={0.18}
        shadow={0.55}
        showTooltip={false}
        gyroscope={false}
        intro={false}
        className="obra-card-tilt"
      >
        <div className="obra-card-media">
          {cover ? (
            // `unoptimized`: photoUrl já entrega variantes pré-dimensionadas (800/1600 webp) das fotos
            // seed, e os uploads do Adm vêm direto de URLs públicas do Supabase Storage; assim não
            // passamos pelo otimizador do Next nem precisamos de `images.remotePatterns`.
            <Image
              src={photoUrl(cover.path, 800)}
              alt={cover.alt || obra.titulo}
              fill
              unoptimized
              sizes="(max-width: 720px) 100vw, 380px"
              className="obra-card-img"
            />
          ) : (
            <div className="obra-card-placeholder" aria-hidden="true">
              <span>VDO</span>
            </div>
          )}
        </div>
        <div className="obra-card-tags">
          <span className={`pill pill-${obra.status}`}>{STATUS_LABEL[obra.status]}</span>
        </div>
        {sold && (
          <div className="obra-card-ribbon" aria-hidden="true">
            Vendido
          </div>
        )}
        <div className="obra-card-cap">
          <h3>{obra.titulo}</h3>
          <small>{obra.local}</small>
          {obra.status === "em_andamento" && progresso != null && (
            <div className="obra-card-progress">
              <div
                className="progress"
                role="progressbar"
                aria-label={`Andamento de ${obra.titulo}`}
                aria-valuenow={progresso}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${progresso}%` }} />
              </div>
              <small>{progresso}% concluído</small>
            </div>
          )}
          {(obra.status === "a_venda" || sold) && (ficha || obra.preco) && (
            <small className="obra-card-meta">
              {[ficha, obra.preco].filter(Boolean).join(" · ")}
            </small>
          )}
        </div>
      </TiltedCard>
    </Link>
  );
}
