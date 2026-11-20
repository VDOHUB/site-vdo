import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteObraButton } from "@/components/admin/DeleteObraButton";
import { ObraForm } from "@/components/admin/ObraForm";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { getAdmin } from "@/lib/admin/session";
import { isUuid } from "@/lib/admin/validation";
import type { Foto, Obra } from "@/lib/types";

export const metadata = { title: "Editar obra" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nova?: string }> };

async function Editor({ params, searchParams }: Props) {
  const { supabase } = await getAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const { data } = await supabase.from("obras").select("*, obra_fotos(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { obra_fotos, ...obra } = data as Obra & { obra_fotos: Foto[] | null };
  const fotos = [...(obra_fotos ?? [])].sort((a, b) => a.ordem - b.ordem);

  return (
    <>
      <div className="pane-head">
        <h1>{obra.titulo}</h1>
        {obra.publicado && (
          <Link className="btn sm" href={`/catalogo/${obra.slug}`} target="_blank" rel="noopener noreferrer">
            Ver no site ↗
          </Link>
        )}
      </div>
      {sp.nova === "1" && (
        <p className="adm-note" role="status">
          Obra criada. Agora adicione as fotos: a primeira vira a capa.
        </p>
      )}
      <ObraForm key={obra.id} obra={obra} />
      <section className="adm-section" aria-labelledby="fotos-title">
        <h2 id="fotos-title">Fotos</h2>
        <PhotoManager obraId={obra.id} fotos={fotos} />
      </section>
      <section className="adm-section danger" aria-labelledby="excluir-title">
        <h2 id="excluir-title">Excluir obra</h2>
        <p className="muted-text">Remove a obra, as fotos enviadas pelo Adm e a página dela no site. Não dá para desfazer.</p>
        <DeleteObraButton id={obra.id} titulo={obra.titulo} />
      </section>
    </>
  );
}

export default function Page(props: Props) {
  return (
    <>
      <nav className="crumbs" aria-label="Navegação">
        <Link href="/admin/obras">← Obras e imóveis</Link>
      </nav>
      <Suspense fallback={<p role="status" className="muted-text">Carregando obra…</p>}>
        <Editor {...props} />
      </Suspense>
    </>
  );
}
