-- 0004: leads so entram pelo servidor (service_role), nunca direto pelo navegador.
-- O formulario de Contato chama uma Server Action que valida e grava com a chave de servico;
-- a insercao direta por anon/authenticated (API publica do Supabase) deixa de existir.

drop policy if exists "leads: qualquer um insere como nova" on public.leads;
revoke insert on table public.leads from anon, authenticated;

-- Tabelas, sequencias e funcoes futuras nao nascem acessiveis a anon/authenticated:
-- cada migracao passa a conceder explicitamente o que precisar.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
