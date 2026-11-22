"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import ScrollVelocity from "@/components/reactbits/ScrollVelocity";

const WORDS = [
  "Execução de obras",
  "Honestidade",
  "Transparência",
  "Compromisso",
  "Prazo de entrega",
  "Obra sem dor de cabeça",
];

/** Faixa de valores que corre devagar e acelera com a rolagem (React Bits ScrollVelocity). */
export function ValuesMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  // A faixa fica abaixo da dobra: só liga a animação (laço de quadros + ResizeObserver) quando
  // está perto de aparecer. Antes disso mostra a linha estática, com a mesma altura.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLive(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const line = (
    <span className="marquee-line">
      {WORDS.map((w, i) => (
        <Fragment key={w}>
          <span className={i % 2 ? "is-accent" : undefined}>{w}</span>
          <span className="marquee-dot">✦</span>
        </Fragment>
      ))}
    </span>
  );

  return (
    <div className="marquee" aria-hidden="true" ref={ref}>
      {!live ? (
        <div className="marquee-scroller marquee-static" style={{ fontFamily: "var(--font-display)" }}>
          {line}
        </div>
      ) : (
      <ScrollVelocity
        texts={[line]}
        velocity={38}
        numCopies={4}
        damping={50}
        stiffness={400}
        velocityMapping={{ input: [0, 1000], output: [0, 2.5] }}
        fadeEdges
        scrollerStyle={{ fontFamily: "var(--font-display)", filter: "none" }}
        scrollerClassName="marquee-scroller"
        parallaxClassName="marquee-parallax"
      />
      )}
    </div>
  );
}
