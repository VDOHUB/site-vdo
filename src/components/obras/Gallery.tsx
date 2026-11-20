"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { photoUrl } from "@/lib/photo";
import type { Foto } from "@/lib/types";

/** Grade de miniaturas com lightbox acessível (setas, Esc, foco devolvido, rolagem travada). */
export function Gallery({ fotos }: { fotos: Foto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const total = fotos.length;
  const isOpen = index !== null;

  const close = useCallback(() => {
    setIndex(null);
    trigger.current?.focus();
  }, []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + total) % total)), [total]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        // foco preso dentro do diálogo
        const nodes = Array.from(document.querySelectorAll<HTMLElement>(".lightbox button"));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close, step]);

  if (total === 0) {
    return (
      <div className="empty-panel">
        <div>
          <b>Fotos desta obra em breve.</b>
          <p>Estamos preparando o registro fotográfico. Fale com a gente para ver mais deste projeto.</p>
        </div>
      </div>
    );
  }

  const current = index !== null ? fotos[index] : null;

  return (
    <>
      <ul className="gallery-grid">
        {fotos.map((f, i) => (
          <li key={f.id}>
            <button
              type="button"
              className="gallery-thumb"
              aria-label={`Ampliar foto ${i + 1} de ${total}${f.alt ? `: ${f.alt}` : ""}`}
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setIndex(i);
              }}
            >
              <Image src={photoUrl(f.path, 800)} alt={f.alt} fill unoptimized sizes="(max-width: 720px) 50vw, 380px" />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Galeria de fotos">
          <button type="button" className="lightbox-backdrop" tabIndex={-1} aria-hidden="true" onClick={close} />
          <figure className="lightbox-fig">
            <Image src={photoUrl(current.path, 1600)} alt={current.alt} fill unoptimized sizes="100vw" />
          </figure>
          <p className="lightbox-count" aria-live="polite">
            {(index ?? 0) + 1} / {total}
          </p>
          <button ref={closeBtn} type="button" className="lightbox-btn lightbox-close" aria-label="Fechar galeria" onClick={close}>
            ×
          </button>
          {total > 1 && (
            <>
              <button type="button" className="lightbox-btn lightbox-prev" aria-label="Foto anterior" onClick={() => step(-1)}>
                ‹
              </button>
              <button type="button" className="lightbox-btn lightbox-next" aria-label="Próxima foto" onClick={() => step(1)}>
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
