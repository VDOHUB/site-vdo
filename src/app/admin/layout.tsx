import type { Metadata } from "next";

// Todo o /admin fica fora dos buscadores. As telas leem cookies (sessao) dentro de
// <Suspense>, entao sao renderizadas por requisicao, e o proxy marca as respostas
// como `Cache-Control: private, no-store`.
export const metadata: Metadata = {
  title: { default: "Adm Viver de Obra", template: "%s · Adm Viver de Obra" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm">{children}</div>;
}
