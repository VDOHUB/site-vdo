-- Seed do ambiente local (aplicado por `supabase start` e `supabase db reset`).
-- Nao cria usuarios nem admins: o primeiro admin e criado manualmente (ver DEPLOY.md).
-- As fotos apontam para caminhos no bucket "obras" (<slug>/<n>-1600.webp), os mesmos
-- nomes gerados em public/obras/<slug>/ pelo pipeline de midia; o upload para o
-- Storage e feito a parte (os arquivos nao sao enviados por este seed).
-- Descricao e local sao provisorios, ate o Carlos informar os definitivos.

insert into public.obras (slug, titulo, descricao, local, tipo, status, ordem, destaque, destaque_ordem, publicado)
values
  ('dunas-douradas', 'Dunas Douradas',
   'Projeto residencial entregue pela Viver de Obra.', 'Anápolis, GO',
   'residencial', 'pronta', 1, true, 1, true),
  ('agencia-bussola', 'Agência Bússola',
   'Projeto corporativo entregue pela Viver de Obra.', 'Anápolis, GO',
   'corporativo', 'pronta', 2, true, 2, true)
on conflict (slug) do nothing;

-- Dunas Douradas (19 fotos)
insert into public.obra_fotos (obra_id, ordem, path, alt)
select o.id, f.ordem, f.path, f.alt
from public.obras o
cross join (values
  (1, 'dunas-douradas/1-1600.webp', 'Quarto de casal com painel de madeira ripada, cabeceira cinza e abajures'),
  (2, 'dunas-douradas/2-1600.webp', 'Cama de casal com roupa de cama branca e painel de madeira clara ao fundo'),
  (3, 'dunas-douradas/3-1600.webp', 'Detalhe da cabeceira estofada cinza, travesseiros brancos e luminária articulada'),
  (4, 'dunas-douradas/4-1600.webp', 'Banheiro com bancada branca, armário de madeira e revestimento de mármore branco'),
  (5, 'dunas-douradas/5-1600.webp', 'Box de banho com vidro, parede rosa, nicho embutido e chuveiro de teto'),
  (6, 'dunas-douradas/6-1600.webp', 'Sala de estar com painel ripado, prateleiras decorativas e uma mulher lendo na poltrona verde'),
  (7, 'dunas-douradas/7-1600.webp', 'Sala de TV com painel de mármore, marcenaria ripada e aparador com plantas'),
  (8, 'dunas-douradas/8-1600.webp', 'Sala com poltrona de couro, sofá cinza, plantas e divisória de vidro com esquadria preta'),
  (9, 'dunas-douradas/9-1600.webp', 'Home office com bancada branca comprida, cadeira de madeira e sofá-cama'),
  (10, 'dunas-douradas/10-1600.webp', 'Bancada de trabalho branca com gavetas, painel de madeira e divisória de vidro canelado'),
  (11, 'dunas-douradas/11-1600.webp', 'Sala de estar com sofá cinza, painel de TV em mármore e prateleiras com plantas'),
  (12, 'dunas-douradas/12-1600.webp', 'Poltrona de couro marrom com pufe, divisória de vidro preto e marcenaria de madeira'),
  (13, 'dunas-douradas/13-1600.webp', 'Sala integrada com mesa de jantar redonda, sofá cinza, trilhos de luz e prateleiras'),
  (14, 'dunas-douradas/14-1600.webp', 'Sala de estar e jantar integradas com marcenaria ripada, trilho de iluminação e mesa redonda'),
  (15, 'dunas-douradas/15-1600.webp', 'Sala de jantar com cortinas translúcidas, painel ripado e cozinha integrada ao fundo'),
  (16, 'dunas-douradas/16-1600.webp', 'Mesa de jantar redonda de tampo claro com cadeiras de palha e luminária dourada'),
  (17, 'dunas-douradas/17-1600.webp', 'Cozinha com armários altos de madeira, revestimento em espinha de peixe e lava-louças'),
  (18, 'dunas-douradas/18-1600.webp', 'Hall de entrada com porta de madeira, aparador de mármore e ripado vertical com espelho'),
  (19, 'dunas-douradas/19-1600.webp', 'Entrada do apartamento com porta de madeira, sapateira e cozinha integrada ao fundo')
) as f(ordem, path, alt)
where o.slug = 'dunas-douradas'
on conflict (obra_id, path) do nothing;

-- Agência Bússola (20 fotos)
insert into public.obra_fotos (obra_id, ordem, path, alt)
select o.id, f.ordem, f.path, f.alt
from public.obras o
cross join (values
  (1, 'agencia-bussola/1-1600.webp', 'Sala de reunião com parede verde, mesa de madeira, cadeiras e quadros coloridos'),
  (2, 'agencia-bussola/2-1600.webp', 'Escritório com mesa de madeira, cadeiras estofadas e estante com nichos'),
  (3, 'agencia-bussola/3-1600.webp', 'Escritório de parede verde com mesa de madeira, cadeira executiva e quadros coloridos'),
  (4, 'agencia-bussola/4-1600.webp', 'Corredor com piso de madeira, ripado azul-escuro e duas poltronas ao fundo'),
  (5, 'agencia-bussola/5-1600.webp', 'Sala de espera azul com bancos de madeira clara em degraus, pilar e planta'),
  (6, 'agencia-bussola/6-1600.webp', 'Banco de madeira clara com almofadas ao lado de painel azul com a marca na parede'),
  (7, 'agencia-bussola/7-1600.webp', 'Sala azul com bancos de madeira clara em degraus, almofadas, planta e ar-condicionado'),
  (8, 'agencia-bussola/8-1600.webp', 'Área de atendimento com baias de computadores, divisória de cabos e pufes azuis'),
  (9, 'agencia-bussola/9-1600.webp', 'Pilar com planta ao centro de um salão com estações de trabalho e divisória de cabos'),
  (10, 'agencia-bussola/10-1600.webp', 'Salão com pufes azuis em primeiro plano e estações de computador ao fundo'),
  (11, 'agencia-bussola/11-1600.webp', 'Sala de pufes azuis sobre tapete redondo, parede azul com spots e estações de trabalho'),
  (12, 'agencia-bussola/12-1600.webp', 'Loja com bancada de atendimento, cadeiras azuis e grande janela para a rua'),
  (13, 'agencia-bussola/13-1600.webp', 'Salão com bancada de atendimento, cadeiras azuis, mesas laterais e luminárias circulares no forro'),
  (14, 'agencia-bussola/14-1600.webp', 'Sala com parede de montanhas em tons de azul, nicho circular com almofadas e tapete ondulado'),
  (15, 'agencia-bussola/15-1600.webp', 'Fachada da loja com letreiro, moldura azul e vidro de piso a teto, ao lado de um prédio'),
  (16, 'agencia-bussola/16-1600.webp', 'Corredor com piso de madeira e ripado azul, com duas mulheres posando ao fundo'),
  (17, 'agencia-bussola/17-1600.webp', 'Sala de espera azul com bancos em degraus e duas mulheres sentadas'),
  (18, 'agencia-bussola/18-1600.webp', 'Duas mulheres posando diante da parede de montanhas azuis com nicho circular'),
  (19, 'agencia-bussola/19-1600.webp', 'Duas mulheres sentadas no nicho circular da parede de montanhas azuis'),
  (20, 'agencia-bussola/20-1600.webp', 'Fachada da loja com duas mulheres de pé diante da entrada de vidro')
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
