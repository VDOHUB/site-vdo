import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { Gallery } from "@/components/obras/Gallery";
import { STATUS_LABEL } from "@/components/obras/ObraCard";
import { getObra as fetchObra } from "@/lib/obras";

// Uma consulta por requisição, compartilhada entre generateMetadata e Detalhe.
const getObra = cache(fetchObra);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const obra = await getObra(slug);
  return obra ? { title: obra.titulo, description: obra.descricao.slice(0, 160) } : { title: "Obra não encontrada", robots: { index: false } };
}

async function Detalhe({ params }: Props) {
  const { slug } = await params;
  const obra = await getObra(slug);
  if (!obra) notFound();

  return (
    <>
      <nav aria-label="Navegação" className="crumbs">
        <Link href="/catalogo">← Catálogo de Obras</Link>
      </nav>
      <header className="page-head">
        <p className="eyebrow">{obra.tipo === "corporativo" ? "Corporativo" : "Residencial"}</p>
        <h1>{obra.titulo}</h1>
        <p>
          <span className={`pill pill-${obra.status}`}>{STATUS_LABEL[obra.status]}</span>{" "}
          <span className="obra-local">{obra.local}</span>
        </p>
      </header>
      {obra.descricao && <p className="obra-desc">{obra.descricao}</p>}
      <Gallery fotos={obra.fotos} />
    </>
  );
}

export default function Page(props: Props) {
  return (
    <main className="wrap page">
      <Suspense fallback={<p role="status">Carregando obra…</p>}>
        <Detalhe {...props} />
      </Suspense>
    </main>
  );
}
