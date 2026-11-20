-- Testes pgTAP de schema, RLS e Storage.
-- Rodar com: npx supabase@latest test db   (stack local precisa estar de pe: npx supabase@latest start)
-- Tudo roda numa transacao e e desfeito no final (rollback); nada fica no banco.

begin;
create extension if not exists pgtap with schema extensions;

select plan(106);

-- ---------------------------------------------------------------------------
-- Fixtures (como postgres): usuarios de teste, obras publicada/rascunho, fotos.
-- ---------------------------------------------------------------------------
insert into auth.users (id, aud, role, email)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin.teste@example.test'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'user.teste@example.test');

-- Nao existe trigger que crie perfil automaticamente (ninguem nasce admin).
select is(
  (select count(*)::int from public.profiles
    where id in ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002')),
  0,
  'criar usuario em auth.users nao cria perfil automaticamente'
);

insert into public.profiles (id, role) values ('aaaaaaaa-0000-4000-8000-000000000001', 'admin');

insert into public.obras (slug, titulo, descricao, local, tipo, status, ordem, destaque, publicado)
values
  ('teste-publicada', 'Teste Publicada', 'desc', 'Anápolis, GO', 'residencial', 'pronta', 90, false, true),
  ('teste-rascunho', 'Teste Rascunho', 'desc', 'Anápolis, GO', 'corporativo', 'em_andamento', 91, false, false);

insert into public.obra_fotos (obra_id, path, ordem, alt)
select id, slug || '/1-1600.webp', 1, 'foto ' || slug
from public.obras where slug in ('teste-publicada', 'teste-rascunho');

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
select has_table('public', 'profiles', 'tabela profiles existe');
select has_table('public', 'obras', 'tabela obras existe');
select has_table('public', 'obra_fotos', 'tabela obra_fotos existe');
select has_table('public', 'leads', 'tabela leads existe');
select has_table('public', 'recursos_internos', 'tabela recursos_internos existe');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('profiles', 'obras', 'obra_fotos', 'leads', 'recursos_internos')
      and c.relrowsecurity),
  5,
  'RLS habilitado nas 5 tabelas'
);

select columns_are('public', 'obras', array[
  'id', 'slug', 'titulo', 'descricao', 'local', 'tipo', 'status', 'progresso', 'preco', 'area',
  'quartos', 'vagas', 'ordem', 'destaque', 'publicado', 'created_at'
], 'colunas de obras');
select columns_are('public', 'obra_fotos', array['id', 'obra_id', 'path', 'ordem', 'alt'], 'colunas de obra_fotos');
select columns_are('public', 'leads', array['id', 'topico', 'nome', 'whatsapp', 'mensagem', 'status', 'created_at'], 'colunas de leads');
select columns_are('public', 'recursos_internos', array['id', 'titulo', 'descricao', 'url', 'tipo', 'ordem'], 'colunas de recursos_internos');
select has_column('public', 'profiles', 'role', 'profiles.role existe');
select fk_ok('public', 'obra_fotos', 'obra_id', 'public', 'obras', 'id', 'obra_fotos.obra_id -> obras.id');

select is(
  (select prosecdef from pg_proc where oid = 'public.is_admin()'::regprocedure),
  true,
  'is_admin() e SECURITY DEFINER'
);
select ok(
  (select proconfig::text from pg_proc where oid = 'public.is_admin()'::regprocedure) like '%search_path=%',
  'is_admin() tem search_path fixo'
);

-- check constraints
select throws_ok(
  $$insert into public.obras (slug, titulo, tipo, status) values ('x-tipo', 'x', 'industrial', 'pronta')$$,
  '23514', null, 'obras.tipo rejeita valor fora da lista');
select throws_ok(
  $$insert into public.obras (slug, titulo, tipo, status) values ('x-status', 'x', 'residencial', 'demolida')$$,
  '23514', null, 'obras.status rejeita valor fora da lista');
select lives_ok(
  $$insert into public.obras (slug, titulo, tipo, status) values ('x-vendido', 'x', 'residencial', 'vendido')$$,
  'obras.status aceita vendido');
select throws_ok(
  $$insert into public.leads (topico, nome, whatsapp, mensagem) values ('Spam', 'x', '62999999999', 'x')$$,
  '23514', null, 'leads.topico rejeita valor fora da lista');
select throws_ok(
  $$insert into public.leads (topico, nome, whatsapp, mensagem) values ('Dúvidas', repeat('x', 500), '62999999999', 'x')$$,
  '23514', null, 'leads.nome tem limite de tamanho');
select throws_ok(
  $$insert into public.profiles (id, role) values ('bbbbbbbb-0000-4000-8000-000000000002', 'editor')$$,
  '23514', null, 'profiles.role so aceita admin');
select throws_ok(
  $$insert into public.recursos_internos (titulo, tipo, url) values ('x', 'link', 'javascript:alert(1)')$$,
  '23514', null, 'recursos_internos.url so aceita http(s)');

-- seed
select is(
  (select count(*)::int from public.obras
    where slug in ('dunas-douradas', 'agencia-bussola') and publicado and destaque and status = 'pronta'),
  2, 'seed: Dunas Douradas e Agencia Bussola prontas, publicadas e em destaque');
select ok(
  (select count(*) from public.obra_fotos f join public.obras o on o.id = f.obra_id
    where o.slug = 'dunas-douradas' and f.path like 'dunas-douradas/%-1600.webp') > 0,
  'seed: fotos de Dunas Douradas apontam para o Storage');
select is(
  (select count(*)::int from public.recursos_internos
    where titulo in ('Gerador de Contratos', 'Planilhas e Agente NF', 'VDO Hub Admin', 'VDO Club')),
  4, 'seed: 4 recursos internos iniciais');

-- ---------------------------------------------------------------------------
-- Anonimo
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(public.is_admin(), false, 'anon: is_admin() = false');
select is(
  (select count(*)::int from public.obras where slug = 'teste-publicada'), 1,
  'anon: le obra publicada');
select is(
  (select count(*)::int from public.obras where slug = 'teste-rascunho'), 0,
  'anon: nao le obra nao publicada');
select is(
  (select count(*)::int from public.obras where not publicado), 0,
  'anon: nenhuma obra nao publicada visivel');
select is(
  (select count(*)::int from public.obra_fotos where path = 'teste-publicada/1-1600.webp'), 1,
  'anon: le fotos de obra publicada');
select is(
  (select count(*)::int from public.obra_fotos where path = 'teste-rascunho/1-1600.webp'), 0,
  'anon: nao le fotos de obra nao publicada');
select throws_ok($$select * from public.leads$$, '42501', null, 'anon: nao le leads');
select throws_ok($$select * from public.recursos_internos$$, '42501', null, 'anon: nao le recursos_internos');
select throws_ok($$select * from public.profiles$$, '42501', null, 'anon: nao le profiles');

select lives_ok(
  $$insert into public.leads (topico, nome, whatsapp, mensagem, status)
    values ('Orçamento', 'Anon Nova', '62999990001', 'quero um orcamento', 'nova')$$,
  'anon: insere lead com status nova');
select lives_ok(
  $$insert into public.leads (topico, nome, whatsapp, mensagem, created_at)
    values ('Sugestões', 'Anon Default', '62999990002', 'sugestao', '2000-01-01')$$,
  'anon: insere lead sem status (default nova)');
select throws_ok(
  $$insert into public.leads (topico, nome, whatsapp, mensagem, status)
    values ('Dúvidas', 'Anon Lida', '62999990003', 'x', 'lida')$$,
  '42501', null, 'anon: lead com status lida e rejeitado');
select throws_ok(
  $$insert into public.leads (topico, nome, whatsapp, mensagem, status)
    values ('Dúvidas', 'Anon Arq', '62999990004', 'x', 'arquivada')$$,
  '42501', null, 'anon: lead com status arquivada e rejeitado');
select throws_ok($$update public.leads set status = 'lida'$$, '42501', null, 'anon: nao atualiza leads');
select throws_ok($$delete from public.leads$$, '42501', null, 'anon: nao apaga leads');
select throws_ok($$truncate public.leads$$, '42501', null, 'anon: nao trunca leads');

select throws_ok(
  $$insert into public.obras (slug, titulo, tipo, status) values ('anon-obra', 'x', 'residencial', 'pronta')$$,
  '42501', null, 'anon: nao insere obras');
select throws_ok($$update public.obras set titulo = 'hack'$$, '42501', null, 'anon: nao atualiza obras');
select throws_ok($$delete from public.obras$$, '42501', null, 'anon: nao apaga obras');
select throws_ok($$delete from public.obra_fotos$$, '42501', null, 'anon: nao apaga obra_fotos');
select throws_ok(
  $$insert into public.recursos_internos (titulo, tipo) values ('x', 'instrucoes')$$,
  '42501', null, 'anon: nao insere recursos_internos');
select throws_ok(
  $$insert into public.profiles (id, role) values ('bbbbbbbb-0000-4000-8000-000000000002', 'admin')$$,
  '42501', null, 'anon: nao insere profiles');

reset role;

-- ---------------------------------------------------------------------------
-- Autenticado sem perfil admin
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is(public.is_admin(), false, 'usuario: is_admin() = false');
select is(
  (select count(*)::int from public.obras where slug = 'teste-publicada'), 1,
  'usuario: le obra publicada');
select is(
  (select count(*)::int from public.obras where slug = 'teste-rascunho'), 0,
  'usuario: nao le obra nao publicada');
select is(
  (select count(*)::int from public.obra_fotos where path = 'teste-rascunho/1-1600.webp'), 0,
  'usuario: nao le fotos de obra nao publicada');
select is((select count(*)::int from public.leads), 0, 'usuario: nao le leads');
select is((select count(*)::int from public.recursos_internos), 0, 'usuario: nao le recursos_internos');
select is((select count(*)::int from public.profiles), 0, 'usuario: nao le perfil de outros');

select throws_ok(
  $$insert into public.obras (slug, titulo, tipo, status) values ('user-obra', 'x', 'residencial', 'pronta')$$,
  '42501', null, 'usuario: nao insere obras');
select lives_ok($$update public.obras set titulo = 'hack' where slug = 'teste-publicada'$$,
  'usuario: update em obras roda sem erro (0 linhas)');
select lives_ok($$delete from public.obras where slug = 'teste-publicada'$$,
  'usuario: delete em obras roda sem erro (0 linhas)');
select throws_ok(
  $$insert into public.obra_fotos (obra_id, path) select id, 'x/1.webp' from public.obras where slug = 'teste-publicada'$$,
  '42501', null, 'usuario: nao insere obra_fotos');
select lives_ok($$delete from public.obra_fotos where path = 'teste-publicada/1-1600.webp'$$,
  'usuario: delete em obra_fotos roda sem erro (0 linhas)');
select throws_ok(
  $$insert into public.recursos_internos (titulo, tipo) values ('x', 'instrucoes')$$,
  '42501', null, 'usuario: nao insere recursos_internos');
select lives_ok($$update public.leads set status = 'arquivada'$$,
  'usuario: update em leads roda sem erro (0 linhas)');
select throws_ok(
  $$insert into public.profiles (id, role) values ('bbbbbbbb-0000-4000-8000-000000000002', 'admin')$$,
  '42501', null, 'usuario: nao se autopromove (insert em profiles)');
select lives_ok(
  $$update public.profiles set id = 'bbbbbbbb-0000-4000-8000-000000000002'
     where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  'usuario: update em profiles roda sem erro (0 linhas)');
select throws_ok($$truncate public.obras$$, '42501', null, 'usuario: nao trunca obras');
select throws_ok(
  $$insert into public.leads (topico, nome, whatsapp, mensagem, status)
    values ('Dúvidas', 'User Lida', '62999990005', 'x', 'lida')$$,
  '42501', null, 'usuario: lead com status lida e rejeitado');

reset role;

-- efeitos das tentativas do usuario comum (verificado como postgres)
select is((select titulo from public.obras where slug = 'teste-publicada'), 'Teste Publicada',
  'usuario: titulo da obra nao mudou');
select is((select count(*)::int from public.obra_fotos where path = 'teste-publicada/1-1600.webp'), 1,
  'usuario: foto nao foi apagada');
select is((select count(*)::int from public.leads where status <> 'nova' and nome like 'Anon%'), 0,
  'usuario: status dos leads nao mudou');
select is((select count(*)::int from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002'), 0,
  'usuario: continua sem perfil admin');
select is((select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 1,
  'usuario: perfil do admin intacto');
select is(
  (select count(*)::int from public.leads where nome like 'Anon%' and status = 'nova'
     and created_at > now() - interval '1 hour'),
  2, 'leads do anon gravados como nova e com created_at do servidor');

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is(public.is_admin(), true, 'admin: is_admin() = true');
select is((select count(*)::int from public.obras where slug = 'teste-rascunho'), 1,
  'admin: le obra nao publicada');
select is((select count(*)::int from public.obra_fotos where path = 'teste-rascunho/1-1600.webp'), 1,
  'admin: le fotos de obra nao publicada');
select ok((select count(*) from public.leads where nome like 'Anon%') = 2, 'admin: le leads');
select ok((select count(*) from public.recursos_internos) >= 4, 'admin: le recursos_internos');
select is((select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 1,
  'admin: le o proprio perfil');

select lives_ok(
  $$insert into public.obras (slug, titulo, tipo, status, publicado) values ('admin-obra', 'Admin', 'corporativo', 'a_venda', false)$$,
  'admin: insere obra');
select lives_ok($$update public.obras set publicado = true, titulo = 'Admin 2' where slug = 'admin-obra'$$,
  'admin: atualiza obra');
select is((select titulo from public.obras where slug = 'admin-obra' and publicado), 'Admin 2',
  'admin: update de obra aplicado');
select lives_ok(
  $$insert into public.obra_fotos (obra_id, path, ordem, alt) select id, 'admin-obra/1-1600.webp', 1, 'x' from public.obras where slug = 'admin-obra'$$,
  'admin: insere obra_fotos');
select lives_ok($$update public.obra_fotos set ordem = 2 where path = 'admin-obra/1-1600.webp'$$,
  'admin: atualiza obra_fotos');
select lives_ok($$delete from public.obra_fotos where path = 'admin-obra/1-1600.webp'$$,
  'admin: apaga obra_fotos');
select lives_ok($$delete from public.obras where slug = 'admin-obra'$$, 'admin: apaga obra');
select is((select count(*)::int from public.obras where slug = 'admin-obra'), 0, 'admin: delete de obra aplicado');

select lives_ok($$update public.leads set status = 'lida' where nome = 'Anon Nova'$$, 'admin: marca lead como lida');
select is((select status from public.leads where nome = 'Anon Nova'), 'lida', 'admin: status do lead mudou');
select lives_ok($$delete from public.leads where nome = 'Anon Default'$$, 'admin: apaga lead');
select is((select count(*)::int from public.leads where nome = 'Anon Default'), 0, 'admin: delete de lead aplicado');

select lives_ok(
  $$insert into public.recursos_internos (titulo, descricao, url, tipo, ordem) values ('Teste', 'x', 'https://example.com', 'link', 99)$$,
  'admin: insere recurso');
select lives_ok($$update public.recursos_internos set descricao = 'y' where titulo = 'Teste'$$, 'admin: atualiza recurso');
select lives_ok($$delete from public.recursos_internos where titulo = 'Teste'$$, 'admin: apaga recurso');

reset role;

-- ---------------------------------------------------------------------------
-- Storage: bucket obras
-- ---------------------------------------------------------------------------
select is((select public from storage.buckets where id = 'obras'), true, 'storage: bucket obras e publico');
select is((select file_size_limit from storage.buckets where id = 'obras'), 6291456::bigint,
  'storage: limite de 6 MB no bucket obras');
select is(
  (select allowed_mime_types from storage.buckets where id = 'obras'),
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  'storage: mime types permitidos no bucket obras');

-- anon
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('obras', 'anon/x.webp', null)$$,
  '42501', null, 'storage anon: nao envia arquivo');
reset role;

-- usuario comum
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('obras', 'user/x.webp', 'bbbbbbbb-0000-4000-8000-000000000002')$$,
  '42501', null, 'storage usuario: nao envia arquivo');
reset role;

-- admin
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('obras', 'teste-admin/1-1600.webp', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  'storage admin: envia arquivo');
select lives_ok(
  $$update storage.objects set metadata = '{"x":1}'::jsonb where bucket_id = 'obras' and name = 'teste-admin/1-1600.webp'$$,
  'storage admin: atualiza arquivo');
select is((select count(*)::int from storage.objects where bucket_id = 'obras' and name = 'teste-admin/1-1600.webp'), 1,
  'storage admin: lista arquivos do bucket');
reset role;

-- usuario comum e anon nao alteram nem listam o arquivo do admin
-- A Storage API liga storage.allow_delete_query antes de apagar (o trigger
-- storage.protect_delete bloqueia DELETE direto); simulamos o mesmo caminho para
-- que o que decide o delete seja o RLS.
select set_config('storage.allow_delete_query', 'true', true);
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);
select lives_ok($$update storage.objects set name = 'roubado.webp' where bucket_id = 'obras'$$,
  'storage usuario: update roda sem erro (0 linhas)');
select lives_ok($$delete from storage.objects where bucket_id = 'obras'$$,
  'storage usuario: delete roda sem erro (0 linhas)');
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*)::int from storage.objects where bucket_id = 'obras'), 0,
  'storage anon: nao lista objetos (leitura so por URL publica)');
reset role;

select is((select count(*)::int from storage.objects where bucket_id = 'obras' and name = 'teste-admin/1-1600.webp'), 1,
  'storage: arquivo do admin intacto apos tentativas do usuario');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$delete from storage.objects where bucket_id = 'obras' and name = 'teste-admin/1-1600.webp'$$,
  'storage admin: apaga arquivo');
reset role;
select is((select count(*)::int from storage.objects where bucket_id = 'obras' and name = 'teste-admin/1-1600.webp'), 0,
  'storage admin: delete aplicado');

select * from finish();
rollback;
