-- 0001_init: schema do site Viver de Obra + RLS.
--
-- Modelo de acesso:
--   anon          le obras publicadas e suas fotos; insere leads (sempre 'nova').
--   authenticated sem perfil admin: mesmos direitos do anon (nenhuma escrita extra).
--   admin         (profiles.role = 'admin', via is_admin()) le e escreve tudo.
--   service_role  ignora RLS (usado so no servidor).
-- Nao ha auto-cadastro nem trigger que crie perfil: o primeiro admin e criado
-- manualmente (insert em profiles com a chave de servico ou pelo SQL editor).

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table public.obras (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  titulo text not null check (char_length(titulo) between 1 and 200),
  descricao text not null default '',
  local text not null default '',
  tipo text not null check (tipo in ('residencial', 'corporativo')),
  status text not null check (status in ('pronta', 'em_andamento', 'a_venda', 'vendido')),
  progresso int check (progresso between 0 and 100),
  preco text,
  area text,
  quartos int check (quartos >= 0),
  vagas int check (vagas >= 0),
  ordem int not null default 0,
  destaque boolean not null default false,
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);
create index obras_publicado_ordem_idx on public.obras (publicado, ordem);

create table public.obra_fotos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  path text not null check (char_length(path) between 1 and 500),
  ordem int not null default 0,
  alt text not null default '',
  unique (obra_id, path)
);
create index obra_fotos_obra_ordem_idx on public.obra_fotos (obra_id, ordem);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  topico text not null check (topico in ('Orçamento', 'Dúvidas', 'Sugestões')),
  nome text not null check (char_length(nome) between 1 and 120),
  whatsapp text not null check (char_length(whatsapp) between 1 and 30),
  mensagem text not null check (char_length(mensagem) between 1 and 5000),
  status text not null default 'nova' check (status in ('nova', 'lida', 'arquivada')),
  created_at timestamptz not null default now()
);
create index leads_status_created_idx on public.leads (status, created_at desc);

create table public.recursos_internos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 200),
  descricao text not null default '',
  -- So http(s): evita javascript:/data: nos links abertos pelo Adm.
  url text check (url is null or url ~* '^https?://'),
  tipo text not null check (tipo in ('link', 'download', 'instrucoes')),
  ordem int not null default 0
);

-- ---------------------------------------------------------------------------
-- is_admin(): SECURITY DEFINER para ler profiles sem depender do RLS do chamador.
-- ---------------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- created_at de lead e sempre o horario do servidor (cliente nao escolhe).
create function public.leads_set_created_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := now();
  return new;
end;
$$;
create trigger leads_set_created_at
  before insert on public.leads
  for each row execute function public.leads_set_created_at();

-- ---------------------------------------------------------------------------
-- Privilegios (defesa em profundidade alem do RLS).
-- O Supabase concede ALL (inclusive TRUNCATE, que ignora RLS) a anon/authenticated
-- por padrao; aqui fica so o necessario.
-- ---------------------------------------------------------------------------
revoke all on table public.profiles, public.obras, public.obra_fotos, public.leads, public.recursos_internos
  from anon, authenticated;

grant select on table public.obras, public.obra_fotos to anon;
grant insert on table public.leads to anon;

grant select, insert, update, delete on table
  public.profiles, public.obras, public.obra_fotos, public.leads, public.recursos_internos
  to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.obras enable row level security;
alter table public.obra_fotos enable row level security;
alter table public.leads enable row level security;
alter table public.recursos_internos enable row level security;

-- profiles: dono le o proprio; admin le e gerencia. Sem policy de escrita para nao-admin
-- (ninguem se autopromove).
create policy "profiles: dono ou admin le" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: admin insere" on public.profiles
  for insert to authenticated with check ((select public.is_admin()));
create policy "profiles: admin atualiza" on public.profiles
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "profiles: admin apaga" on public.profiles
  for delete to authenticated using ((select public.is_admin()));

-- obras
create policy "obras: publicadas para todos, tudo para admin" on public.obras
  for select to anon, authenticated
  using (publicado or (select public.is_admin()));
create policy "obras: admin insere" on public.obras
  for insert to authenticated with check ((select public.is_admin()));
create policy "obras: admin atualiza" on public.obras
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "obras: admin apaga" on public.obras
  for delete to authenticated using ((select public.is_admin()));

-- obra_fotos: visivel se a obra e publicada
create policy "obra_fotos: de obras publicadas para todos, tudo para admin" on public.obra_fotos
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.obras o where o.id = obra_id and o.publicado)
  );
create policy "obra_fotos: admin insere" on public.obra_fotos
  for insert to authenticated with check ((select public.is_admin()));
create policy "obra_fotos: admin atualiza" on public.obra_fotos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "obra_fotos: admin apaga" on public.obra_fotos
  for delete to authenticated using ((select public.is_admin()));

-- leads: qualquer um insere como 'nova'; so admin le, muda status e apaga.
create policy "leads: qualquer um insere como nova" on public.leads
  for insert to anon, authenticated
  with check (status = 'nova');
create policy "leads: admin insere qualquer status" on public.leads
  for insert to authenticated with check ((select public.is_admin()));
create policy "leads: admin le" on public.leads
  for select to authenticated using ((select public.is_admin()));
create policy "leads: admin atualiza" on public.leads
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "leads: admin apaga" on public.leads
  for delete to authenticated using ((select public.is_admin()));

-- recursos_internos: so admin
create policy "recursos_internos: admin le" on public.recursos_internos
  for select to authenticated using ((select public.is_admin()));
create policy "recursos_internos: admin insere" on public.recursos_internos
  for insert to authenticated with check ((select public.is_admin()));
create policy "recursos_internos: admin atualiza" on public.recursos_internos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "recursos_internos: admin apaga" on public.recursos_internos
  for delete to authenticated using ((select public.is_admin()));
