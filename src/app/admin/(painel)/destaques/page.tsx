import { Suspense } from "react";
import { DestaquesEditor } from "@/components/admin/DestaquesEditor";
import { getAdmin } from "@/lib/admin/session";

export const metadata = { title: "Destaques da Home" };

async function Editor() {
  const { supabase } = await getAdmin();
  // So obras prontas e publicadas aparecem nos destaques da Home.
  const { data, error } = await supabase
    .from("obras")
    .select("id, titulo, local, destaque, destaque_ordem, ordem")
    .eq("status", "pronta")
    .eq("publicado", true)
    // Ordem atual da Home (destaque_ordem; nulls por ultimo), depois a do catalogo.
    .order("destaque_ordem", { ascending: true, nullsFirst: false })
    .order("ordem", { ascending: true });
  if (error) return <p className="form-error" role="alert">Não foi possível carregar as obras agora.</p>;
  const obras = (data ?? []) as { id: string; titulo: string; local: string; destaque: boolean; destaque_ordem: number | null; ordem: number }[];
  return <DestaquesEditor obras={obras} />;
}

export default function Page() {
  return (
    <>
      <div className="pane-head">
        <h1>Destaques da Home</h1>
      </div>
      <p className="muted-text">Escolha quais obras aparecem na página inicial e em que ordem. A Home mostra as 3 primeiras.</p>
      <Suspense fallback={<p role="status" className="muted-text">Carregando…</p>}>
        <Editor />
      </Suspense>
    </>
  );
}
