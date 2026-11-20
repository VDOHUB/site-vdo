import { Suspense } from "react";
import { SideNav, SideNavSkeleton } from "@/components/admin/SideNav";
import { getAdmin } from "@/lib/admin/session";

// Casca do painel. A checagem aqui e so uma camada a mais: cada pagina tambem chama
// getAdmin() antes de ler dados, e cada Server Action chama requireAdmin().
async function Gate({ children }: { children: React.ReactNode }) {
  await getAdmin();
  return <>{children}</>;
}

async function Side() {
  const { supabase } = await getAdmin();
  const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "nova");
  return <SideNav novas={count ?? 0} />;
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash">
      <Suspense fallback={<SideNavSkeleton />}>
        <Side />
      </Suspense>
      <div className="pane">
        <Suspense fallback={<p role="status" className="muted-text">Carregando…</p>}>
          <Gate>{children}</Gate>
        </Suspense>
      </div>
    </div>
  );
}
