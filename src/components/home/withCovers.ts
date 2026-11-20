import { getObra, type Foto, type Obra } from "@/lib/obras";

/**
 * `listObras` não traz fotos. Para os poucos cards da Home buscamos a obra completa
 * (com `obra_fotos`) e usamos a primeira foto como capa. Se falhar, o card fica sem foto
 * e mostra a superfície neutra.
 */
export async function withCovers(obras: Obra[]): Promise<(Obra & { fotos: Foto[] })[]> {
  return Promise.all(
    obras.map(async (o) => {
      const full = await getObra(o.slug);
      return { ...o, fotos: full?.fotos ?? [] };
    }),
  );
}
