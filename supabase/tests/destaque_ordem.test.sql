-- pgTAP: coluna obras.destaque_ordem (0003). Roda em transacao com rollback.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, aud, role, email)
values
  ('aaaaaaaa-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', 'admin.dest@example.test'),
  ('bbbbbbbb-0000-4000-8000-0000000000d2', 'authenticated', 'authenticated', 'user.dest@example.test');
insert into public.profiles (id, role) values ('aaaaaaaa-0000-4000-8000-0000000000d1', 'admin');
insert into public.obras (slug, titulo, tipo, status, publicado)
values ('dest-a', 'Dest A', 'residencial', 'pronta', true);

select has_column('public', 'obras', 'destaque_ordem', 'obras.destaque_ordem existe');
select col_type_is('public', 'obras', 'destaque_ordem', 'integer', 'destaque_ordem e integer');
select col_is_null('public', 'obras', 'destaque_ordem', 'destaque_ordem aceita null');
select is((select destaque_ordem from public.obras where slug = 'dest-a'), null::int, 'padrao e null');
select throws_ok(
  $$update public.obras set destaque_ordem = 0 where slug = 'dest-a'$$,
  '23514', null, 'destaque_ordem rejeita 0');

-- admin escreve
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select lives_ok($$update public.obras set destaque = true, destaque_ordem = 2 where slug = 'dest-a'$$,
  'admin: grava destaque_ordem');
reset role;
select is((select destaque_ordem from public.obras where slug = 'dest-a'), 2, 'admin: valor aplicado');

-- anon e usuario comum nao alteram (RLS: 0 linhas)
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$update public.obras set destaque_ordem = 9 where slug = 'dest-a'$$,
  '42501', null, 'anon: sem permissao de update');
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-0000000000d2","role":"authenticated"}', true);
update public.obras set destaque_ordem = 9 where slug = 'dest-a';
reset role;
select is((select destaque_ordem from public.obras where slug = 'dest-a'), 2, 'usuario comum: update nao aplicado');

select * from finish();
rollback;
