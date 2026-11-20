import Link from "next/link";
import { ObraCard } from "@/components/obras/ObraCard";
import { listObras } from "@/lib/obras";
import { withCovers } from "./withCovers";

const MAX = 3;

/** Destaques do Catálogo de Obras: obras prontas marcadas como destaque no Adm. */
export async function FeaturedObras() {
  const obras = await withCovers((await listObras({ destaque: true, status: ["pronta"] })).slice(0, MAX));

  if (obras.length === 0) {
    return (
      <div className="empty-panel">
        <div>
          <b>O catálogo está ganhando obras novas.</b>
          <p>As obras entregues entram por aqui, com fotos e galeria completa. Enquanto isso, fale com a gente.</p>
        </div>
        <Link className="btn" href="/contato">
          Falar com a equipe
        </Link>
      </div>
    );
  }

  return (
    <div className="obra-grid">
      {obras.map((o) => (
        <ObraCard key={o.id} obra={o} />
      ))}
      {obras.length < MAX && (
        <div className="empty-card">
          <div>
            <b>Sua obra aqui</b>
            <p>Conte o que você quer construir ou reformar.</p>
            <Link className="btn sm" href="/contato">
              Pedir orçamento
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
