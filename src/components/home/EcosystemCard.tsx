import type { CSSProperties, ReactNode } from "react";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

type Props = {
  title: string;
  text: string;
  href: string;
  /** Marca do produto: wordmark tipográfico ou logo. */
  mark: ReactNode;
  /** Linha de rodapé à esquerda (domínio, nome da área). */
  meta?: string;
  /** Verbo da ação à direita. */
  action?: string;
};

const SURFACE = {
  "--spotlight-card-surface": "var(--card)",
  "--spotlight-card-border": "rgba(243, 239, 230, 0.09)",
  "--spotlight-card-shadow": "0 30px 60px -40px rgba(0, 0, 0, 0.8)",
} as CSSProperties;

/** Card do ecossistema VDO com luz que segue o cursor (React Bits SpotlightCard). */
export function EcosystemCard({ title, text, href, mark, meta, action = "Abrir" }: Props) {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className="eco-card"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <SpotlightCard
        className="eco-card-body"
        style={SURFACE}
        spotlightColor="#f0b323"
        intensity={0.16}
        spotlightSize={320}
        borderGlow={0.7}
        proximity={60}
      >
        <div className="eco-card-mark">{mark}</div>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="eco-card-go">
          <span>{meta ?? title}</span>
          <span className="eco-card-action">
            {action} <span aria-hidden="true">{external ? "↗" : "→"}</span>
          </span>
        </div>
      </SpotlightCard>
    </a>
  );
}
