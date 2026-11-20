import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { requireAdmin } from "./auth";

/**
 * requireAdmin() memoizado por requisicao para a renderizacao das telas (layout,
 * barra lateral e pagina checam sem repetir as chamadas ao Auth). Server Actions
 * chamam requireAdmin() direto.
 *
 * `connection()` marca a leitura como de requisicao: a validacao da sessao usa o
 * relogio (expiracao do token), o que o Cache Components nao aceita em pre-renderizacao.
 */
export const getAdmin = cache(async () => {
  await connection();
  return requireAdmin();
});
