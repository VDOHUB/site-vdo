"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

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
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.19 1.6 6.01L4 29l8.12-1.57a12 12 0 0 0 3.92.66C22.68 28.09 28 22.7 28 16.06 28 9.4 22.68 3 16.04 3Zm0 22.05c-1.2 0-2.38-.32-3.4-.93l-.24-.15-4.82.93.97-4.7-.16-.25a9.07 9.07 0 0 1-1.4-4.86c0-5.03 4.1-9.1 9.17-9.1 5.03 0 9.12 4.07 9.12 9.1 0 5.04-4.1 9.96-9.24 9.96Zm5.04-6.8c-.28-.14-1.63-.8-1.88-.9-.25-.09-.43-.14-.62.14-.18.28-.71.9-.87 1.08-.16.19-.32.21-.6.07-.27-.14-1.16-.43-2.2-1.36a8.2 8.2 0 0 1-1.52-1.9c-.16-.28-.02-.43.12-.57.12-.12.28-.32.41-.48.14-.16.18-.28.28-.46.09-.19.05-.35-.02-.5-.07-.14-.62-1.5-.85-2.05-.22-.54-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.35-.25.28-.96.94-.96 2.29 0 1.35.99 2.65 1.12 2.83.14.19 1.94 2.97 4.7 4.16.66.28 1.17.45 1.57.58.66.21 1.26.18 1.73.11.53-.08 1.63-.67 1.86-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.19-.53-.33Z"
        />
      </svg>
    </a>
  );
}
