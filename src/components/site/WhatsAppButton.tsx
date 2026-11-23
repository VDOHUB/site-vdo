"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";

/** Botão flutuante do WhatsApp em todas as páginas públicas (não aparece no /admin). */
export function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <a
      className="wa-fab"
      href={SITE.whatsappUrl("Olá! Vim pelo site e quero conversar sobre uma obra.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
}
