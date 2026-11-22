-- 0003_destaque_ordem: ordem dos destaques da Home independente da ordem do catalogo.
--
-- `ordem` continua ordenando /catalogo, /andamento e /imoveis. A Home ordena os destaques
-- por `destaque_ordem` (1..n, definido em "Destaques da Home" no Adm); null = sem posicao.
-- Grants e RLS de obras ja cobrem a coluna: leitura publica so de obras publicadas,
-- escrita so de admin.
alter table public.obras
  add column destaque_ordem integer check (destaque_ordem is null or destaque_ordem >= 1);
