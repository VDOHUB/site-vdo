import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import Link from "next/link";
import { Suspense } from "react";
import { EcosystemSection } from "@/components/home/EcosystemSection";
import { FeaturedObras } from "@/components/home/FeaturedObras";
import { Hero } from "@/components/home/Hero";
import { LiveObras } from "@/components/home/LiveObras";
import { VideoSection } from "@/components/home/VideoSection";
import { ValuesMarquee } from "@/components/home/ValuesMarquee";
import { ObraGridSkeleton } from "@/components/obras/ObraGridSkeleton";
import { sociosFoto } from "@/lib/media";
import { localBusinessJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Frescor dos dados: com `cacheComponents` o Next 16 proíbe `export const revalidate`
// (erro de build). As listas de obras usam cookies (createServerClient) e ficam dentro de
// <Suspense>, então rodam a cada requisição sobre a casca estática: edições do Adm aparecem
// na hora. Se um dia forem cacheadas com "use cache", usar cacheLife + revalidateTag no Adm.

const VALORES =["Honestidade", "Transparência", "Compromisso"];

export default function Home() {
  return (
    <main className="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <VideoSection />
      <ValuesMarquee />

      <section className="band" aria-labelledby="destaques-title">
        <div className="wrap">
          <div className="shead">
            <div>
              <p className="eyebrow">Catálogo de Obras</p>
              <h2 id="destaques-title">Obras que falam por nós.</h2>
            </div>
            <Link className="btn" href="/catalogo">
              Ver todas <span aria-hidden="true">→</span>
            </Link>
          </div>
          <Suspense fallback={<ObraGridSkeleton />}>
            <FeaturedObras />
          </Suspense>
        </div>
      </section>

      <section className="band band-tight" aria-labelledby="agora-title">
        <div className="wrap">
          <div className="shead">
            <div>
              <p className="eyebrow">Acontecendo agora</p>
              <h2 id="agora-title">Obras em andamento e imóveis à venda.</h2>
            </div>
            <div className="shead-links">
              <Link className="btn" href="/andamento">
                Em andamento
              </Link>
              <Link className="btn" href="/imoveis">
                Imóveis à venda
              </Link>
            </div>
          </div>
          <Suspense fallback={<ObraGridSkeleton />}>
            <LiveObras />
          </Suspense>
        </div>
      </section>

      <EcosystemSection />

      <section className="band" aria-labelledby="sobre-title">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Quem somos</p>
            <h2 id="sobre-title" className="split-title">
              Dois sócios. Uma equipe de obra inteira.
            </h2>
            <p className="muted-text">
              O Viver de Obra Engenharia é composto por dois sócios e uma vasta equipe de obra, que busca
              entregar seu melhor para seus clientes durante todo o processo.
            </p>
            <ul className="vals">
              {VALORES.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
            <Link className="btn" href="/sobre">
              Conhecer a empresa
            </Link>
          </div>
          <figure className="split-media">
            <picture>
              <source type="image/avif" srcSet={sociosFoto.avif.join(", ")} sizes="(max-width: 820px) 100vw, 560px" />
              <source type="image/webp" srcSet={sociosFoto.webp.join(", ")} sizes="(max-width: 820px) 100vw, 560px" />
              <img src={sociosFoto.fallback} width={sociosFoto.width} height={sociosFoto.height} alt={sociosFoto.alt} loading="lazy" decoding="async" />
            </picture>
          </figure>
        </div>
      </section>

      <section className="band band-tight" aria-labelledby="cta-title">
        <div className="wrap">
          <div className="cta-box">
            <div>
              <h2 id="cta-title">Vamos fazer obra sem dor de cabeça?</h2>
              <p>
                Conte o que você quer construir ou reformar. Respondemos de segunda a sábado, das 8h às 18h.
              </p>
            </div>
            <div className="cta-actions">
              <Link className="btn ink" href="/contato">
                Pedir orçamento
              </Link>
              <a
                className="btn ink-ghost"
                href={SITE.whatsappUrl("Olá! Vim pelo site e quero conversar sobre uma obra.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="wa-ico" /> Falar no WhatsApp <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
