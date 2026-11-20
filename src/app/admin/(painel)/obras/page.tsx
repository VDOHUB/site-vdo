import Link from "next/link";
import { Suspense } from "react";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { STATUS_LABEL } from "@/components/obras/ObraCard";
import { getAdmin } from "@/lib/admin/session";
import type { Obra } from "@/lib/types";

export const metadata = { title: "Obras e imóveis" };

type Row = Pick<Obra, "id" | "slug" | "titulo" | "status" | "tipo" | "local" | "publicado"> & {
  obra_fotos: { count: number }[];
};

async function Tabela() {
  const { supabase } = await getAdmin();
  const { data, error } = await supabase
    .from("obras")
    .select("id, slug, titulo, status, tipo, local, publicado, obra_fotos(count)")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return <p className="form-error" role="alert">Não foi possível carregar as obras agora.</p>;
  const obras = (data ?? []) as unknown as Row[];
  if (!obras.length) {
    return <p className="adm-empty">Nenhuma obra cadastrada ainda. Clique em “+ Nova obra” para começar.</p>;
  }
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            <th scope="col">Título</th>
            <th scope="col">Status</th>
            <th scope="col">Tipo · Local</th>
            <th scope="col">Fotos</th>
            <th scope="col">No site</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((o) => (
            <tr key={o.id}>
              <td>
                <Link className="tbl-link" href={`/admin/obras/${o.id}`}>
                  {o.titulo}
                </Link>
              </td>
              <td>
                <span className={`pill pill-${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </td>
              <td className="muted-cell">
                {o.tipo === "corporativo" ? "Corporativo" : "Residencial"}
                {o.local ? ` · ${o.local}` : ""}
              </td>
              <td>{o.obra_fotos?.[0]?.count ?? 0}</td>
              <td>
                <PublishToggle id={o.id} titulo={o.titulo} publicado={o.publicado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <div className="pane-head">
        <h1>Obras e imóveis</h1>
        <Link className="btn pri" href="/admin/obras/nova">
          + Nova obra
        </Link>
      </div>
      <Suspense fallback={<p role="status" className="muted-text">Carregando obras…</p>}>
        <Tabela />
      </Suspense>
    </>
  );
}
