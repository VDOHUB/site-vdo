import Image from "next/image";
import { ACCESS } from "@/lib/site";
import { EcosystemCard } from "./EcosystemCard";

function access(label: string) {
  return ACCESS.find((a) => a.label === label);
}

export function EcosystemSection() {
  const hub = access("VDO Hub");
  const club = access("VDO Club");
  const adm = access("Adm Viver de Obra");

  return (
    <section id="ecossistema" className="band band-alt" aria-labelledby="eco-title">
      <div className="wrap">
        <div className="shead">
          <div>
            <p className="eyebrow">Ecossistema Viver de Obra</p>
            <h2 id="eco-title">Mais que obra. Um sistema inteiro.</h2>
          </div>
          <p>Produtos e ferramentas criados pela VDO. Cada um com a sua entrada.</p>
        </div>
        <div className="eco-grid">
          <EcosystemCard
            title="Sala comercial por assinatura"
            text="Escritório pronto, com café, fechadura digital e área do cliente. Você assina e usa."
            href={hub?.href ?? null}
            meta="vdohub.viverdeobra.com"
            mark={
              <Image
                src="/brand/logo-vdo-hub.png"
                alt="VDO Hub"
                width={500}
                height={500}
                className="eco-logo"
                sizes="112px"
              />
            }
          />
          <EcosystemCard
            title="Clube de arquitetos e fornecedores"
            text="Rede selecionada, com cadastro aprovado, avaliações e orçamentos entre quem projeta e quem fornece."
            href={club?.href ?? null}
            meta={club?.href ? "Entrar no Club" : "Em breve"}
            mark={
              <Image
                src="/brand/logo-vdo-club.png"
                alt="VDO Club"
                width={360}
                height={192}
                className="eco-logo"
                sizes="104px"
              />
            }
          />
          <EcosystemCard
            title="Contratos e planilhas"
            text="Geração de contratos e acompanhamento de custos a partir das notas fiscais. Área restrita à equipe."
            href={adm?.href ?? "/admin"}
            meta="Adm Viver de Obra"
            action="Entrar"
            mark={<span className="wordmark">Automação</span>}
          />
        </div>
      </div>
    </section>
  );
}
