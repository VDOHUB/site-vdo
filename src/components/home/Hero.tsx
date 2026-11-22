"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BlurText from "@/components/reactbits/BlurText";
import { hero } from "@/lib/media";
import { useVideoAllowed } from "./useVideoAllowed";

const TITLE = "Obra sem dor de cabeça.";

/** Espera depois do evento load antes de começar o vídeo de fundo (poster primeiro). */
export const VIDEO_START_DELAY_MS = 1500;

/**
 * true só depois do `load` da página + um momento ocioso + um pequeno atraso. O vídeo tem
 * vários MB: começar a baixar/decodificar antes disso disputa rede e CPU com o LCP e o
 * carregamento dos scripts (TBT), e o poster já cobre esse intervalo.
 */
function useAfterLoadIdle(delay: number): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    const go = () => {
      timer = window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, delay);
    };
    const start = () => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(go, { timeout: 3000 });
      else go();
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("load", start);
    };
  }, [delay]);
  return ready;
}

export function Hero() {
  const allowed = useVideoAllowed();
  const afterLoad = useAfterLoadIdle(VIDEO_START_DELAY_MS);
  const videoAllowed = allowed && afterLoad;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-media" aria-hidden="true">
        {/* Poster sempre presente: é o LCP e o fallback sem vídeo (reduced motion / economia de dados). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- poster já otimizado (webp 24 KB), precisa casar 1:1 com o vídeo */}
        <img
          className="hero-poster"
          src={hero.poster}
          srcSet={`${hero.posterSmall} 800w, ${hero.poster} 1600w`}
          sizes="100vw"
          width={1600}
          height={900}
          alt=""
          fetchPriority="high"
          decoding="async"
        />
        {videoAllowed && (
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={hero.poster}
            disablePictureInPicture
            tabIndex={-1}
          >
            {hero.sources.map((s) => (
              <source key={s.src} src={s.src} type={s.type} media={s.media} />
            ))}
          </video>
        )}
      </div>
      <div className="hero-veil" aria-hidden="true" />

      <div className="hero-content">
        <p className="eyebrow hero-in" style={{ animationDelay: "0.05s" }}>
          Construtora boutique · Anápolis, GO
        </p>
        <h1 id="hero-title" className="hero-title" aria-label={TITLE}>
          <BlurText
            as="span"
            text={TITLE}
            trigger="load"
            animateBy="words"
            direction="bottom"
            distance={28}
            blur={14}
            delay={110}
            stepDuration={0.42}
            className="hero-title-words"
          />
        </h1>
        <p className="hero-lead hero-in" style={{ animationDelay: "0.85s" }}>
          Execução de obras com segurança, prazo combinado e acompanhamento de perto. Honestidade,
          transparência e compromisso do primeiro tijolo à entrega.
        </p>
        <div className="hero-cta hero-in" style={{ animationDelay: "1s" }}>
          <Link className="btn pri" href="/catalogo">
            Ver Catálogo de Obras <span aria-hidden="true">→</span>
          </Link>
          <Link className="btn ghost" href="/contato">
            Pedir orçamento
          </Link>
        </div>
      </div>

      {videoAllowed && (
        <button
          type="button"
          className="hero-toggle"
          onClick={toggle}
          aria-label={paused ? "Reproduzir vídeo de fundo" : "Pausar vídeo de fundo"}
        >
          <span aria-hidden="true" className={`hero-toggle-icon${paused ? " is-paused" : ""}`} />
          <span aria-hidden="true">{paused ? "Play" : "Pausar"}</span>
        </button>
      )}

      <noscript>
        <style>{`.hero-title [aria-hidden="true"]{opacity:1!important;filter:none!important;transform:none!important}`}</style>
      </noscript>
    </section>
  );
}
