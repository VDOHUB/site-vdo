"use client";

import { Fragment } from "react";
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
    <div className="marquee" aria-hidden="true">
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
    </div>
  );
}
