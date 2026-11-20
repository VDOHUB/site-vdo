import { Suspense } from "react";
import { RecursoCard, NovoRecurso, type Recurso } from "@/components/admin/Recursos";
import { getAdmin } from "@/lib/admin/session";

export const metadata = { title: "Recursos internos" };

async function Lista() {
  const { supabase } = await getAdmin();
  const { data, error } = await supabase
    .from("recursos_internos")
    .select("id, titulo, descricao, url, tipo, ordem")
    .order("ordem", { ascending: true })
    .order("titulo", { ascending: true });
  if (error) return <p className="form-error" role="alert">Não foi possível carregar os recursos agora.</p>;
  const recursos = (data ?? []) as Recurso[];
  return (
    <div className="tools">
      {recursos.map((r) => (
        <RecursoCard key={r.id} recurso={r} />
      ))}
      <NovoRecurso proximaOrdem={recursos.reduce((m, r) => Math.max(m, r.ordem), 0) + 1} />
    </div>
  );
}

export default function Page() {
  return (
    <>
      <div className="pane-head">
        <h1>Recursos internos</h1>
      </div>
      <p className="muted-text">Atalhos para as ferramentas da equipe. Só administradores veem esta página.</p>
      <Suspense fallback={<p role="status" className="muted-text">Carregando recursos…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}
