import Link from "next/link";
import { Suspense } from "react";
import { ObraForm } from "@/components/admin/ObraForm";
import { getAdmin } from "@/lib/admin/session";

export const metadata = { title: "Nova obra" };

async function Form() {
  await getAdmin();
  return <ObraForm />;
}

export default function Page() {
  return (
    <>
      <nav className="crumbs" aria-label="Navegação">
        <Link href="/admin/obras">← Obras e imóveis</Link>
      </nav>
      <div className="pane-head">
        <h1>Nova obra</h1>
      </div>
      <p className="muted-text">Preencha os dados e salve. Em seguida você adiciona as fotos.</p>
      <Suspense fallback={<p role="status" className="muted-text">Carregando…</p>}>
        <Form />
      </Suspense>
    </>
  );
}
