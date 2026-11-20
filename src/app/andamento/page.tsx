import Link from "next/link";
import { Suspense } from "react";
import { ObraCard } from "@/components/obras/ObraCard";
import { ObraGridSkeleton } from "@/components/obras/ObraGridSkeleton";
import { listObras } from "@/lib/obras";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Em andamento",
  description: "Acompanhe as obras da Viver de Obra que estão em execução agora.",
};

async function Lista() {
  const obras = await listObras({ status: ["em_andamento"], withFotos: true });
  if (obras.length === 0) {
    return (
      <div className="empty-panel">
        <div>
          <b>Nenhuma obra em andamento publicada agora.</b>
          <p>O dia a dia dos canteiros sai primeiro no Instagram. Quando uma obra entrar aqui, você acompanha o avanço dela.</p>
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

export default function Page() {
  return (
    <main className="wrap page">
      <header className="page-head">
        <p className="eyebrow">Acontecendo agora</p>
        <h1>Em andamento</h1>
        <p>
          Obras em execução e o quanto cada uma já avançou. Quer uma assim? <Link href="/contato">Peça um orçamento</Link>.
        </p>
      </header>
      <Suspense fallback={<ObraGridSkeleton />}>
        <Lista />
      </Suspense>
    </main>
  );
}
