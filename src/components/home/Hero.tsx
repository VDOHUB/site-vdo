import Link from "next/link";
import { HERO_BLUR } from "@/lib/hero-blur.generated";
import { heroImage } from "@/lib/media";

const TITLE = "Obra sem dor de cabeça.";

/** Topo da Home: imagem estática (dupla exposição dos sócios) + título, texto e chamadas. Sem JS. */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-art" style={{ backgroundImage: `url(${HERO_BLUR})` }}>
        <picture>
          <source type="image/avif" srcSet={heroImage.avif.join(", ")} sizes="(max-width: 860px) 100vw, 48vw" />
          <source type="image/webp" srcSet={heroImage.webp.join(", ")} sizes="(max-width: 860px) 100vw, 48vw" />
          {/* LCP: prioridade alta, dimensões fixas (sem CLS). */}
          <img
            className="hero-img"
            src={heroImage.fallback}
            width={heroImage.width}
            height={heroImage.height}
            alt={heroImage.alt}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>

      <div className="hero-content">
        <p className="eyebrow hero-in">Construtora boutique · Anápolis, GO</p>
        <h1 id="hero-title" className="hero-title" aria-label={TITLE}>
          {TITLE.split(" ").map((w, i) => (
            <span key={i}>
              <span className="hero-word" style={{ animationDelay: `${i * 0.06}s` }}>
                {w}
              </span>{" "}
            </span>
          ))}
        </h1>
        <p className="hero-lead hero-in">
          Execução de obras com segurança, prazo combinado e acompanhamento de perto. Honestidade,
          transparência e compromisso do primeiro tijolo à entrega.
        </p>
        <div className="hero-cta hero-in">
          <Link className="btn pri" href="/catalogo">
            Ver Catálogo de Obras <span aria-hidden="true">→</span>
          </Link>
          <Link className="btn ghost" href="/contato">
            Pedir orçamento
          </Link>
        </div>
      </div>
    </section>
  );
}
