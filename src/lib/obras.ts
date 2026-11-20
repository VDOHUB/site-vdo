import { createServerClient } from "@/lib/supabase/server";
import type { Foto, Obra } from "./types";

export type { Foto, Obra } from "./types";

export type ObraFilter = {
  status?: Obra["status"][];
  tipo?: Obra["tipo"];
  destaque?: boolean;
};

const WIDTHS = [800, 1600] as const;

/** Sem Supabase configurado (build, testes) a camada devolve vazio em vez de lancar. */
function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function listObras(filter: ObraFilter = {}): Promise<Obra[]> {
  if (!hasSupabase()) return [];
  try {
    const supabase = await createServerClient();
    let q = supabase.from("obras").select("*").eq("publicado", true);
    if (filter.status?.length) q = q.in("status", filter.status);
    if (filter.tipo) q = q.eq("tipo", filter.tipo);
    if (filter.destaque !== undefined) q = q.eq("destaque", filter.destaque);
    const { data, error } = await q.order("ordem", { ascending: true });
    if (error) {
      console.error("[obras] listObras failed", error);
      return [];
    }
    return (data ?? []) as Obra[];
  } catch (e) {
    console.error("[obras] listObras failed", e);
    return [];
  }
}

export async function getObra(slug: string): Promise<(Obra & { fotos: Foto[] }) | null> {
  if (!hasSupabase()) return null;
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("obras")
      .select("*, obra_fotos(*)")
      .eq("slug", slug)
      .eq("publicado", true)
      .maybeSingle();
    if (error) {
      console.error("[obras] getObra failed", error);
      return null;
    }
    if (!data) return null;
    const { obra_fotos, ...obra } = data as Obra & { obra_fotos: Foto[] | null };
    if (!obra.publicado) return null;
    const fotos = [...(obra_fotos ?? [])].sort((a, b) => a.ordem - b.ordem);
    return { ...obra, fotos };
  } catch (e) {
    console.error("[obras] getObra failed", e);
    return null;
  }
}

export function photoUrl(path: string, width: number): string {
  // Neutraliza traversal e caminho absoluto: normaliza para relativo sem "..".
  path = path
    .split("/")
    .filter((seg) => seg !== "" && seg !== "." && seg !== "..")
    .join("/");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (path.startsWith("uploads/") && base) {
    return `${base}/storage/v1/object/public/obras/${path}`;
  }
  const m = /^(.+)\/(\d+)-\d+\.[a-z0-9]+$/i.exec(path);
  if (!m) return `/obras/${path}`;
  const w = WIDTHS.reduce((best, c) =>
    Math.abs(c - width) < Math.abs(best - width) ? c : best,
  );
  return `/obras/${m[1]}/${m[2]}-${w}.webp`;
}
