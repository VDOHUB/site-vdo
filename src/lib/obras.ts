import { unstable_rethrow } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Foto, Obra } from "./types";

export type { Foto, Obra } from "./types";
export { photoUrl } from "./photo";

export type ObraFilter = {
  status?: Obra["status"][];
  tipo?: Obra["tipo"];
  destaque?: boolean;
  /** "destaque_ordem": posicao definida em Destaques da Home (nulls por ultimo), depois `ordem`. */
  orderBy?: "ordem" | "destaque_ordem";
};

/** Sem Supabase configurado (build, testes) a camada devolve vazio em vez de lancar. */
function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export type ObraComFotos = Obra & { fotos: Foto[] };

function sortFotos(fotos: Foto[] | null | undefined): Foto[] {
  return [...(fotos ?? [])].sort((a, b) => a.ordem - b.ordem);
}

/**
 * Lista obras publicadas. Com `withFotos: true` traz as fotos na MESMA consulta
 * (`obra_fotos(*)` embutido), ordenadas por `ordem`, em `fotos`.
 */
export async function listObras(filter: ObraFilter & { withFotos: true }): Promise<ObraComFotos[]>;
export async function listObras(filter?: ObraFilter & { withFotos?: false }): Promise<Obra[]>;
export async function listObras(
  filter: ObraFilter & { withFotos?: boolean } = {},
): Promise<Obra[] | ObraComFotos[]> {
  if (!hasSupabase()) return [];
  try {
    const supabase = await createServerClient();
    let q = supabase
      .from("obras")
      // `as string`: sem tipos gerados do banco, o parser de select do supabase-js não lida com a união.
      .select((filter.withFotos ? "*, obra_fotos(*)" : "*") as string)
      .eq("publicado", true);
    if (filter.status?.length) q = q.in("status", filter.status);
    if (filter.tipo) q = q.eq("tipo", filter.tipo);
    if (filter.destaque !== undefined) q = q.eq("destaque", filter.destaque);
    if (filter.orderBy === "destaque_ordem") q = q.order("destaque_ordem", { ascending: true, nullsFirst: false });
    const { data, error } = await q.order("ordem", { ascending: true });
    if (error) {
      console.error("[obras] listObras failed", error);
      return [];
    }
    if (!filter.withFotos) return (data ?? []) as unknown as Obra[];
    return ((data ?? []) as unknown as (Obra & { obra_fotos: Foto[] | null })[])
      .filter((o) => o.publicado !== false)
      .map(({ obra_fotos, ...obra }) => ({ ...obra, fotos: sortFotos(obra_fotos) }));
  } catch (e) {
    // Sinais internos do Next (prerender/postpone) não são erro de dados: deixa subir.
    unstable_rethrow(e);
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
    const fotos = sortFotos(obra_fotos);
    return { ...obra, fotos };
  } catch (e) {
    unstable_rethrow(e);
    console.error("[obras] getObra failed", e);
    return null;
  }
}
