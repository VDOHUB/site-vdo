import Link from "next/link";
import { Suspense } from "react";
import { LeadActions } from "@/components/admin/LeadActions";
import { getAdmin } from "@/lib/admin/session";
import type { LeadStatus } from "@/lib/admin/validation";

export const metadata = { title: "Mensagens" };

type Lead = { id: string; topico: string; nome: string; whatsapp: string; mensagem: string; status: LeadStatus; created_at: string };

const FILTROS = {
  caixa: { label: "Caixa de entrada", status: ["nova", "lida"] },
  arquivadas: { label: "Arquivadas", status: ["arquivada"] },
  todas: { label: "Todas", status: ["nova", "lida", "arquivada"] },
} as const;
type Filtro = keyof typeof FILTROS;

const STATUS_LABEL: Record<LeadStatus, string> = { nova: "Nova", lida: "Lida", arquivada: "Arquivada" };
const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function waLink(digits: string) {
  const d = digits.replace(/\D/g, "");
  return `https://wa.me/55${d}`;
}

async function Lista({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { supabase } = await getAdmin();
  const sp = await searchParams;
  const filtro: Filtro = sp.filtro && sp.filtro in FILTROS ? (sp.filtro as Filtro) : "caixa";
  const { data, error } = await supabase
    .from("leads")
    .select("id, topico, nome, whatsapp, mensagem, status, created_at")
    .in("status", [...FILTROS[filtro].status])
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <nav className="tabs" aria-label="Filtrar mensagens">
        {(Object.keys(FILTROS) as Filtro[]).map((k) => (
          <Link key={k} href={k === "caixa" ? "/admin/mensagens" : `/admin/mensagens?filtro=${k}`} aria-current={k === filtro ? "page" : undefined}>
            {FILTROS[k].label}
          </Link>
        ))}
      </nav>
      {error ? (
        <p className="form-error" role="alert">Não foi possível carregar as mensagens agora.</p>
      ) : !data?.length ? (
        <p className="adm-empty">Nenhuma mensagem aqui.</p>
      ) : (
        <ul className="inbox">
          {(data as Lead[]).map((l) => (
            <li key={l.id} className={`msg${l.status === "nova" ? " is-new" : ""}`} data-lead={l.id}>
              <div className="msg-body">
                <p className="msg-head">
                  <b>{l.topico}</b> · {l.nome}
                  <span className={`pill lead-${l.status}`}>{STATUS_LABEL[l.status]}</span>
                </p>
                <p className="msg-meta">
                  <time dateTime={l.created_at}>{fmt.format(new Date(l.created_at))}</time> ·{" "}
                  <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer">
                    WhatsApp {l.whatsapp}
                  </a>
                </p>
                <p className="msg-text">{l.mensagem}</p>
              </div>
              <LeadActions id={l.id} status={l.status} nome={l.nome} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page(props: { searchParams: Promise<{ filtro?: string }> }) {
  return (
    <>
      <div className="pane-head">
        <h1>Mensagens do site</h1>
      </div>
      <Suspense fallback={<p role="status" className="muted-text">Carregando mensagens…</p>}>
        <Lista searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
