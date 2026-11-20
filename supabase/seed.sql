-- Seed do ambiente local (aplicado por `supabase start` e `supabase db reset`).
-- Nao cria usuarios nem admins: o primeiro admin e criado manualmente (ver DEPLOY.md).
-- As fotos apontam para caminhos no bucket "obras" (<slug>/<n>-1600.webp), os mesmos
-- nomes gerados em public/obras/<slug>/ pelo pipeline de midia; o upload para o
-- Storage e feito a parte (os arquivos nao sao enviados por este seed).
-- Descricao e local sao provisorios, ate o Carlos informar os definitivos.

insert into public.obras (slug, titulo, descricao, local, tipo, status, ordem, destaque, publicado)
values
  ('dunas-douradas', 'Dunas Douradas',
   'Projeto residencial entregue pela Viver de Obra.', 'Anápolis, GO',
   'residencial', 'pronta', 1, true, true),
  ('agencia-bussola', 'Agência Bússola',
   'Projeto corporativo entregue pela Viver de Obra.', 'Anápolis, GO',
   'corporativo', 'pronta', 2, true, true)
on conflict (slug) do nothing;

-- Dunas Douradas (19 fotos)
insert into public.obra_fotos (obra_id, ordem, path, alt)
select o.id, f.ordem, f.path, f.alt
from public.obras o
cross join (values
  (1, 'dunas-douradas/1-1600.webp', 'Dunas Douradas, projeto residencial, foto 1'),
  (2, 'dunas-douradas/2-1600.webp', 'Dunas Douradas, projeto residencial, foto 2'),
  (3, 'dunas-douradas/3-1600.webp', 'Dunas Douradas, projeto residencial, foto 3'),
  (4, 'dunas-douradas/4-1600.webp', 'Dunas Douradas, projeto residencial, foto 4'),
  (5, 'dunas-douradas/5-1600.webp', 'Dunas Douradas, projeto residencial, foto 5'),
  (6, 'dunas-douradas/6-1600.webp', 'Dunas Douradas, projeto residencial, foto 6'),
  (7, 'dunas-douradas/7-1600.webp', 'Dunas Douradas, projeto residencial, foto 7'),
  (8, 'dunas-douradas/8-1600.webp', 'Dunas Douradas, projeto residencial, foto 8'),
  (9, 'dunas-douradas/9-1600.webp', 'Dunas Douradas, projeto residencial, foto 9'),
  (10, 'dunas-douradas/10-1600.webp', 'Dunas Douradas, projeto residencial, foto 10'),
  (11, 'dunas-douradas/11-1600.webp', 'Dunas Douradas, projeto residencial, foto 11'),
  (12, 'dunas-douradas/12-1600.webp', 'Dunas Douradas, projeto residencial, foto 12'),
  (13, 'dunas-douradas/13-1600.webp', 'Dunas Douradas, projeto residencial, foto 13'),
  (14, 'dunas-douradas/14-1600.webp', 'Dunas Douradas, projeto residencial, foto 14'),
  (15, 'dunas-douradas/15-1600.webp', 'Dunas Douradas, projeto residencial, foto 15'),
  (16, 'dunas-douradas/16-1600.webp', 'Dunas Douradas, projeto residencial, foto 16'),
  (17, 'dunas-douradas/17-1600.webp', 'Dunas Douradas, projeto residencial, foto 17'),
  (18, 'dunas-douradas/18-1600.webp', 'Dunas Douradas, projeto residencial, foto 18'),
  (19, 'dunas-douradas/19-1600.webp', 'Dunas Douradas, projeto residencial, foto 19')
) as f(ordem, path, alt)
where o.slug = 'dunas-douradas'
on conflict (obra_id, path) do nothing;

-- Agência Bússola (20 fotos)
insert into public.obra_fotos (obra_id, ordem, path, alt)
select o.id, f.ordem, f.path, f.alt
from public.obras o
cross join (values
  (1, 'agencia-bussola/1-1600.webp', 'Agência Bússola, projeto corporativo, foto 1'),
  (2, 'agencia-bussola/2-1600.webp', 'Agência Bússola, projeto corporativo, foto 2'),
  (3, 'agencia-bussola/3-1600.webp', 'Agência Bússola, projeto corporativo, foto 3'),
  (4, 'agencia-bussola/4-1600.webp', 'Agência Bússola, projeto corporativo, foto 4'),
  (5, 'agencia-bussola/5-1600.webp', 'Agência Bússola, projeto corporativo, foto 5'),
  (6, 'agencia-bussola/6-1600.webp', 'Agência Bússola, projeto corporativo, foto 6'),
  (7, 'agencia-bussola/7-1600.webp', 'Agência Bússola, projeto corporativo, foto 7'),
  (8, 'agencia-bussola/8-1600.webp', 'Agência Bússola, projeto corporativo, foto 8'),
  (9, 'agencia-bussola/9-1600.webp', 'Agência Bússola, projeto corporativo, foto 9'),
  (10, 'agencia-bussola/10-1600.webp', 'Agência Bússola, projeto corporativo, foto 10'),
  (11, 'agencia-bussola/11-1600.webp', 'Agência Bússola, projeto corporativo, foto 11'),
  (12, 'agencia-bussola/12-1600.webp', 'Agência Bússola, projeto corporativo, foto 12'),
  (13, 'agencia-bussola/13-1600.webp', 'Agência Bússola, projeto corporativo, foto 13'),
  (14, 'agencia-bussola/14-1600.webp', 'Agência Bússola, projeto corporativo, foto 14'),
  (15, 'agencia-bussola/15-1600.webp', 'Agência Bússola, projeto corporativo, foto 15'),
  (16, 'agencia-bussola/16-1600.webp', 'Agência Bússola, projeto corporativo, foto 16'),
  (17, 'agencia-bussola/17-1600.webp', 'Agência Bússola, projeto corporativo, foto 17'),
  (18, 'agencia-bussola/18-1600.webp', 'Agência Bússola, projeto corporativo, foto 18'),
  (19, 'agencia-bussola/19-1600.webp', 'Agência Bússola, projeto corporativo, foto 19'),
  (20, 'agencia-bussola/20-1600.webp', 'Agência Bússola, projeto corporativo, foto 20')
) as f(ordem, path, alt)
where o.slug = 'agencia-bussola'
on conflict (obra_id, path) do nothing;

-- Recursos internos do Adm. URLs desconhecidas ficam nulas e sao preenchidas no Adm.
insert into public.recursos_internos (titulo, descricao, url, tipo, ordem)
select v.titulo, v.descricao, v.url, v.tipo, v.ordem
from (values
  ('Gerador de Contratos', 'Aplicação web para gerar contratos.', null, 'link', 1),
  ('Planilhas e Agente NF',
   'O Agente NF é um programa de desktop (.exe) e não roda no navegador. Peça o instalador e as planilhas à equipe e siga as instruções de uso.',
   null, 'instrucoes', 2),
  ('VDO Hub Admin', 'Administração do VDO Hub.', 'https://vdohub.viverdeobra.com/admin', 'link', 3),
  ('VDO Club', 'Plataforma do VDO Club.', null, 'link', 4)
) as v(titulo, descricao, url, tipo, ordem)
where not exists (select 1 from public.recursos_internos r where r.titulo = v.titulo);
