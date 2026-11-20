import { ObraCard } from "@/components/obras/ObraCard";
import { listObras } from "@/lib/obras";
import { SITE } from "@/lib/site";
import { withCovers } from "./withCovers";

const MAX = 3;

/** Faixa "Acontecendo agora": obras em andamento primeiro, depois imóveis à venda. */
export async function LiveObras() {
  const all = await listObras({ status: ["em_andamento", "a_venda"] });
  const ordered = [
    ...all.filter((o) => o.status === "em_andamento"),
    ...all.filter((o) => o.status === "a_venda"),
  ].slice(0, MAX);
  const obras = await withCovers(ordered);

  if (obras.length === 0) {
    return (
      <div className="empty-panel">
        <div>
          <b>Nenhuma obra publicada neste momento.</b>
          <p>O dia a dia dos canteiros sai primeiro no Instagram. Imóveis à venda aparecem aqui assim que entram.</p>
        </div>
        <a className="btn" href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">
          Ver no Instagram <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

  return (
    <div className="obra-grid">
      {obras.map((o) => (
        <ObraCard key={o.id} obra={o} />
      ))}
    </div>
  );
}
