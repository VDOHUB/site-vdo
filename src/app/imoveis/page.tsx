import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { Suspense } from "react";
import { ImovelCard } from "@/components/obras/ImovelCard";
import { ObraGridSkeleton } from "@/components/obras/ObraGridSkeleton";
import { listObras } from "@/lib/obras";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Imóveis à venda",
  description: "Imóveis à venda da Viver de Obra, com ficha completa e contato direto por WhatsApp.",
};

async function Lista() {
  const obras = await listObras({ status: ["a_venda", "vendido"], withFotos: true });
  if (obras.length === 0) {
    return (
      <div className="empty-panel">
        <div>
          <b>Nenhum imóvel à venda no momento.</b>
          <p>Novos imóveis entram aqui assim que ficam disponíveis. Fale com a gente para saber em primeira mão.</p>
        </div>
        <a
          className="btn pri"
          href={SITE.whatsappUrl("Olá, quero saber dos próximos imóveis à venda")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon className="wa-ico" /> Falar no WhatsApp <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }
  // À venda primeiro, vendidos depois (ordem original preservada dentro de cada grupo).
  const ordenadas = [...obras.filter((o) => o.status === "a_venda"), ...obras.filter((o) => o.status === "vendido")];
  return (
    <div className="obra-grid">
      {ordenadas.map((o) => (
        <ImovelCard key={o.id} obra={o} />
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <main className="wrap page">
      <header className="page-head">
        <p className="eyebrow">Oportunidades</p>
        <h1>Imóveis à venda</h1>
        <p>Imóveis construídos pela Viver de Obra, com ficha completa e atendimento direto pelo WhatsApp.</p>
      </header>
      <Suspense fallback={<ObraGridSkeleton />}>
        <Lista />
      </Suspense>
    </main>
  );
}
