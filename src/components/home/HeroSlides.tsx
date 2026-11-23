"use client";

import { useEffect, useState } from "react";
import { HERO_SLIDES, HERO_SLIDE_SECONDS } from "@/lib/media";

/** Demais slides do topo: só entram depois do load + ocioso, para não disputar rede com o LCP (1º slide). */
export function HeroSlides() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const go = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") ric(() => !cancelled && setReady(true), { timeout: 3000 });
      else window.setTimeout(() => !cancelled && setReady(true), 1200);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", go);
    };
  }, []);

  if (!ready) return null;
  return (
    <>
      {HERO_SLIDES.slice(1).map((s, i) => (
        <picture key={s.src} className="hero-slide" style={{ animationDelay: `${(i + 1) * HERO_SLIDE_SECONDS - 1.2}s` }}>
          <source type="image/avif" srcSet={`${s.src}.avif`} />
          <img src={`${s.src}.webp`} alt="" width={1600} height={1067} loading="lazy" decoding="async" />
        </picture>
      ))}
    </>
  );
}
