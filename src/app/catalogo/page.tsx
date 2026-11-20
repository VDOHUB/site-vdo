import { Suspense } from "react";
import { CatalogoGrid } from "@/components/obras/CatalogoGrid";
import { ObraGridSkeleton } from "@/components/obras/ObraGridSkeleton";
import { listObras } from "@/lib/obras";

export const metadata = {
  title: "Catálogo de Obras",
  description: "Obras entregues pela Viver de Obra: residenciais e corporativas, com fotos e detalhes.",
};

// Sem `revalidate` (proibido com cacheComponents): a lista roda por requisição dentro do Suspense.
async function Lista() {
  const obras = await listObras({ status: ["pronta"], withFotos: true });
  return <CatalogoGrid obras={obras} />;
}

export default function Page() {
  return (
    <main className="wrap page">
      <header className="page-head">
        <p className="eyebrow">Obras entregues</p>
        <h1>Catálogo de Obras</h1>
        <p>Obras entregues, do projeto à chave na mão. Filtre por tipo e abra para ver a galeria completa.</p>
      </header>
      <Suspense fallback={<ObraGridSkeleton />}>
        <Lista />
      </Suspense>
    </main>
  );
}
