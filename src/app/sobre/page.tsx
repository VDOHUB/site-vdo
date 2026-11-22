import Image from "next/image";
import { photoUrl } from "@/lib/photo";

export const metadata = {
  title: "Sobre",
  description:
    "Conheça a Viver de Obra Engenharia: dois sócios e uma equipe de obra dedicada, com honestidade, transparência e compromisso do primeiro tijolo à entrega.",
};

const VALORES = ["Honestidade", "Transparência", "Compromisso"];

// TODO(cliente): textos PLACEHOLDER dos servicos, a confirmar com o Carlos.
// Editar so este array; os cards e a pagina se ajustam sozinhos.
const SERVICOS: { titulo: string; texto: string }[] = [
  {
    titulo: "Execução de obras",
    texto: "Construção do projeto à entrega, com equipe de obra dedicada e acompanhamento de perto em cada etapa.",
  },
  {
    titulo: "Reformas",
    texto: "Reformas residenciais e comerciais com planejamento, prazo combinado e transparência nos custos.",
  },
  {
    titulo: "Impermeabilização",
    texto: "Soluções contra infiltrações, com diagnóstico da causa antes de executar o serviço.",
  },
];

export default function Page() {
  return (
    <main className="wrap page">
      <div className="split">
        <div>
          <p className="eyebrow">Sobre a Viver de Obra</p>
          <h1 className="split-title" style={{ maxWidth: "20ch" }}>
            Engenharia que cuida do cliente do começo ao fim.
          </h1>
          <p className="muted-text" style={{ marginBottom: 14 }}>
            Somos uma empresa especializada em execução de obras, para quem quer um serviço de qualidade,
            com segurança e compromisso no prazo de entrega.
          </p>
          <p className="muted-text">
            O Viver de Obra Engenharia é composto por dois sócios e uma vasta equipe de obra, que busca
            entregar seu melhor para seus clientes, prezando sempre honestidade, transparência e
            compromisso durante todo o processo.
          </p>
          <ul className="vals">
            {VALORES.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
        <figure className="split-media">
          <Image
            src={photoUrl("dunas-douradas/14-1600.webp", 1600)}
            alt="Sala de estar integrada do projeto residencial Dunas Douradas, executado pela Viver de Obra"
            width={1600}
            height={1067}
            sizes="(max-width: 820px) 100vw, 560px"
            priority
          />
        </figure>
      </div>

      <section aria-labelledby="servicos-title" style={{ marginTop: 72 }}>
        <p className="eyebrow">Serviços</p>
        <h2 id="servicos-title" className="sr-only">
          Serviços
        </h2>
        <ul className="svc-grid">
          {SERVICOS.map((s) => (
            <li key={s.titulo} className="svc-card">
              <h3>{s.titulo}</h3>
              <p>{s.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
