import { SITE } from "./site";
import type { Obra } from "./types";

/** Progresso 0-100 arredondado; `null` quando não informado (a barra some). */
export function clampProgress(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function imovelPreco(preco: string | null): string {
  return preco?.trim() ? preco : "Sob consulta";
}

/** Link de WhatsApp do imóvel; só imóveis à venda têm contato. */
export function imovelContactHref(obra: Pick<Obra, "status" | "titulo">): string | null {
  if (obra.status !== "a_venda") return null;
  return SITE.whatsappUrl(`Olá, tenho interesse no imóvel ${obra.titulo}`);
}
