// Validacao dos formularios do Adm. Pura (sem servidor): as Server Actions a usam
// antes de qualquer escrita, e os limites espelham os check constraints do banco.
import type { Obra } from "@/lib/types";

export const OBRA_TIPOS = ["residencial", "corporativo"] as const;
export const OBRA_STATUS = ["pronta", "em_andamento", "a_venda", "vendido"] as const;
export const LEAD_STATUS = ["nova", "lida", "arquivada"] as const;
export const RECURSO_TIPOS = ["link", "download", "instrucoes"] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];
export type RecursoTipo = (typeof RECURSO_TIPOS)[number];

export const OBRA_LIMITS = { titulo: 200, descricao: 5000, local: 200, preco: 60, area: 60 } as const;
export const RECURSO_LIMITS = { titulo: 200, descricao: 1000, url: 2000 } as const;
export const SLUG_MAX = 80;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function oneOf<T extends string>(list: readonly T[], v: unknown): T | null {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : null;
}

export function parseLeadStatus(v: unknown): LeadStatus | null {
  return oneOf(LEAD_STATUS, v);
}

export function slugify(title: string): string {
  const s = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  return s || "obra";
}

/** `base` se livre; senao base-2, base-3... (respeitando o tamanho maximo). */
export function uniqueSlug(base: string, taken: readonly string[]): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const cand = base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/g, "") + suffix;
    if (!set.has(cand)) return cand;
  }
}

/** Inteiro em [min, max]; "" -> null; invalido -> undefined. */
function intField(v: unknown, min: number, max: number): number | null | undefined {
  const s = str(v).trim();
  if (s === "") return null;
  if (!/^-?\d{1,6}$/.test(s)) return undefined;
  const n = Number(s);
  return n >= min && n <= max ? n : undefined;
}

export type ObraInput = Pick<
  Obra,
  "titulo" | "tipo" | "status" | "local" | "descricao" | "preco" | "area" | "quartos" | "vagas" | "progresso" | "publicado"
>;

export type Validation<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

const tooLong = (label: string, max: number) => `${label} pode ter no máximo ${max} caracteres.`;

export function validateObraInput(raw: Record<string, unknown>): Validation<ObraInput> {
  const errors: Record<string, string> = {};

  const titulo = str(raw.titulo).trim();
  if (!titulo) errors.titulo = "Informe o título.";
  else if (titulo.length > OBRA_LIMITS.titulo) errors.titulo = tooLong("O título", OBRA_LIMITS.titulo);

  const tipo = oneOf(OBRA_TIPOS, raw.tipo);
  if (!tipo) errors.tipo = "Escolha um tipo válido.";
  const status = oneOf(OBRA_STATUS, raw.status);
  if (!status) errors.status = "Escolha um status válido.";

  const text = (key: "local" | "descricao" | "preco" | "area", label: string) => {
    const v = str(raw[key]).trim();
    if (v.length > OBRA_LIMITS[key]) errors[key] = tooLong(label, OBRA_LIMITS[key]);
    return v;
  };
  const local = text("local", "O local");
  const descricao = text("descricao", "A descrição");
  const preco = text("preco", "O preço");
  const area = text("area", "A área");

  const quartos = intField(raw.quartos, 0, 99);
  if (quartos === undefined) errors.quartos = "Informe um número inteiro de 0 a 99.";
  const vagas = intField(raw.vagas, 0, 99);
  if (vagas === undefined) errors.vagas = "Informe um número inteiro de 0 a 99.";
  const progresso = intField(raw.progresso, 0, 100);
  if (progresso === undefined) errors.progresso = "O progresso vai de 0 a 100.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      titulo,
      tipo: tipo!,
      status: status!,
      local,
      descricao,
      preco: preco || null,
      area: area || null,
      quartos: quartos ?? null,
      vagas: vagas ?? null,
      progresso: progresso ?? null,
      // Checkbox HTML: so "on" conta como marcado.
      publicado: raw.publicado === "on",
    },
  };
}

export type RecursoInput = { titulo: string; descricao: string; url: string | null; tipo: RecursoTipo; ordem: number };

export function validateRecursoInput(raw: Record<string, unknown>): Validation<RecursoInput> {
  const errors: Record<string, string> = {};
  const titulo = str(raw.titulo).trim();
  if (!titulo) errors.titulo = "Informe o título.";
  else if (titulo.length > RECURSO_LIMITS.titulo) errors.titulo = tooLong("O título", RECURSO_LIMITS.titulo);
  const descricao = str(raw.descricao).trim();
  if (descricao.length > RECURSO_LIMITS.descricao) errors.descricao = tooLong("A descrição", RECURSO_LIMITS.descricao);
  const tipo = oneOf(RECURSO_TIPOS, raw.tipo);
  if (!tipo) errors.tipo = "Escolha um tipo válido.";

  const urlRaw = str(raw.url).trim();
  let url: string | null = null;
  if (urlRaw) {
    let valid = false;
    if (urlRaw.length <= RECURSO_LIMITS.url && /^https?:\/\//i.test(urlRaw)) {
      try {
        const u = new URL(urlRaw);
        valid = (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.hostname);
      } catch {
        valid = false;
      }
    }
    if (valid) url = urlRaw;
    else errors.url = "Use um endereço que comece com http:// ou https://.";
  }

  const ordem = intField(raw.ordem, 0, 9999);
  if (ordem === undefined) errors.ordem = "Informe um número inteiro de 0 a 9999.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { titulo, descricao, url, tipo: tipo!, ordem: ordem ?? 0 } };
}

/**
 * Posicao dos destaques da Home (`destaque_ordem` 1..n) na ordem escolhida no Adm.
 * Independe de `obras.ordem` (que ordena o catalogo e pode ter empates).
 * `null` se houver id repetido.
 */
export function buildDestaqueUpdates(chosen: readonly string[]): { id: string; destaque_ordem: number }[] | null {
  if (new Set(chosen).size !== chosen.length) return null;
  return chosen.map((id, i) => ({ id, destaque_ordem: i + 1 }));
}
