import Link from "next/link";
import { HERO_SLIDES, HERO_SLIDE_SECONDS } from "@/lib/media";
import { HeroSlides } from "./HeroSlides";

const TITLE = "Obra sem dor de cabeça.";

/**
 * Topo da Home: slideshow em tela cheia (fotos das obras entregues, em fade infinito) com um
 * escurecimento sempre presente atrás do texto e uma camada de tom que alterna entre escuro e claro.
 */
export function Hero() {
  const first = HERO_SLIDES[0];
  return (
    <section className="hero" aria-labelledby="hero-title" style={{ ["--slide-s" as string]: `${HERO_SLIDE_SECONDS}s` }}>
      <div className="hero-media" aria-hidden="true">
        {/* 1º slide = LCP: no HTML, prioridade alta. Os outros chegam depois do load (HeroSlides). */}
        <picture className="hero-slide is-first" style={{ animationDelay: "-1.2s" }}>
          <source type="image/avif" srcSet={`${first.src}.avif`} />
          <img src={`${first.src}.webp`} alt="" width={1600} height={1067} fetchPriority="high" decoding="async" />
        </picture>
        <HeroSlides />
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-tone" aria-hidden="true" />

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
