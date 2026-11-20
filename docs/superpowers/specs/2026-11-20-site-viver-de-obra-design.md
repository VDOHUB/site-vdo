# Novo site Viver de Obra — Design

Data: 2026-11-20. Substitui https://viverdeobra.com/ (Mobirise, página única).

## Intenção e por quê
A Viver de Obra é uma construtora boutique (Anápolis-GO). O site atual é uma página única genérica: não nomeia serviços nem obras e só tem WhatsApp e formulário. O cliente (Carlos) construiu vários projetos para a empresa e quer que o site seja a **porta de entrada de tudo**: mostrar o trabalho (portfólio, obras em andamento, imóveis à venda, catálogo) e dar acesso fácil aos sistemas da empresa (VDO Hub, VDO Club, Adm). A equipe da VDO atualiza o conteúdo sozinha.

## Objetivos
- Site institucional premium, em português do Brasil, com animações de React Bits (github.com/DavidHDev/react-bits).
- Páginas públicas: Home, Catálogo de Obras (obras prontas; não há página separada de Portfólio), Obras em andamento, Imóveis à venda, Sobre, Contato.
- Seção "Ecossistema" com cards de VDO Hub, VDO Club e Automação de Contratos e Planilhas, cada um com sua logo e link.
- Menu com botão "Acessar" (Hub, Club, Adm).
- Rodapé e contato: Instagram, YouTube, Facebook, WhatsApp, endereço, horário, Google Business (dados abaixo).
- Logo da empresa presente em todos os sistemas (ver Logo nos sistemas).
- **Adm Viver de Obra** (`/admin`): área separada com login, que (1) permite a equipe editar obras, imóveis e catálogo e (2) reúne atalhos dos recursos internos.
- Substituir viverdeobra.com no final (o deploy e a troca de DNS ficam com o Carlos).

## Não-objetivos
- Reescrever VDO Hub, VDO Club, o gerador de contratos ou o Agente NF. O Adm só lista e abre essas ferramentas.
- Pagamentos, e-commerce de imóveis, portal de cliente novo.
- Migrar o conteúdo do site atual além do que já está no zip e no texto institucional.

## Anti-objetivos (falha mesmo que "funcione")
- Fotos de 10–16 MB servidas sem otimização (site pesado).
- Equipe que precise de um desenvolvedor para trocar uma foto ou marcar um imóvel como vendido.
- Visual genérico de template ou animação que atrapalhe a leitura ou o celular.

## Constraints
- Stack: Next.js (App Router, TypeScript), Tailwind, React Bits, Supabase (Auth, Postgres com RLS, Storage), deploy na Vercel — a mesma do VDO Club (`D:\1 - Projetos\Carlos\vdoclub`).
- Material de marca e mídia: zip `D:\Downloads\OneDrive_2026-11-20.zip` (1,4 GB). Logos: Engenharia (branco/amarelo e preto/amarelo), Construtora, Hub, Club. Fotos de obras prontas: Agência Bússola e Dunas Douradas. Vídeo institucional (500 MB), fotos e vídeos do VDO Hub, e o Curso de Infiltrações.
- Lacunas no zip: a pasta Montpellier (AP802/AP402) e a do VDO Club estão vazias. Não há material de obras em andamento, imóveis à venda ou catálogo. Esses itens entram pelo Adm; o site é entregue com os dados existentes e estados vazios elegantes.
- Sistemas existentes: VDO Hub em `https://vdohub.viverdeobra.com` (com `/minha-conta` e `/admin`); VDO Club (Next.js/Supabase, deploy próprio); gerador de contratos (aplicação web em Python, Procfile); Agente NF é um `.exe` de desktop, que não roda no navegador.
- Dados de contato atuais: WhatsApp (62) 99244-5881; Av. São Francisco de Assis, 181, Galeria Nazir, Sala 05, 2º piso, Jundiaí, Anápolis-GO, 75110-810; seg–sáb 8h–18h; Instagram instagram.com/viverdobra; YouTube canal UCqF-imgywwuURWTK-EQm7DQ; Google Business g.page/viver-de-obra-engenharia. O Facebook não foi encontrado e precisa ser informado.

## Abordagens consideradas
- **A) Next.js + Supabase (escolhida pelo Carlos):** site público lê do banco; `/admin` com login e CRUD. Mesma stack e padrão do VDO Club. Custo: projeto Supabase novo.
- B) Next.js + CMS pronto (Sanity/Payload): painel de conteúdo melhor, mas a equipe teria dois logins e dois lugares.
- C) Site estático com arquivos de dados: simples, mas toda atualização depende de um desenvolvedor; não atende ao requisito.

## Decisões
- Conteúdo editável no Adm (o Catálogo de Obras é a vitrine das obras com status `pronta`; sem entidade separada): obras com `status` (`pronta`, `em_andamento`, `a_venda`), título, descrição, localização, fotos (Storage) e ordem; destaques da Home. Cada obra mostra uma galeria.
- Login do Adm: Supabase Auth com e-mail e senha e `role = admin`, no mesmo modelo do VDO Club. Não há auto-cadastro de admin; o primeiro admin é criado manualmente.
- Recursos internos no Adm: tela de cartões com links, editáveis no banco. Itens iniciais: Gerador de Contratos (link), Planilhas e Agente NF (instruções ou download), VDO Hub Admin (link `vdohub.viverdeobra.com/admin`), VDO Club (link).
- Logo nos sistemas: o site usa a logo em todas as páginas, no Adm e nos cartões. Para os outros sistemas (Hub, Club, contratos), a v1 entrega o pacote de logos otimizadas e o guia de uso; alterar o código desses apps não faz parte desta entrega.
- Mídia: pipeline que gera imagens redimensionadas (AVIF/WebP) das fotos do zip; os vídeos são comprimidos para a web (MP4 curto de hero, restante hospedado no YouTube).
- Formulário de contato: grava no Supabase, com opção de WhatsApp pré-preenchido. Os tópicos são Orçamento, Dúvidas e Sugestões, como no site atual.
- Identidade visual: derivada da logo (preto e amarelo) e do tom boutique. É minha escolha, não decidida pelo Carlos, e é ajustável.
- Animações: React Bits, aplicadas com moderação (hero, títulos, galerias, transições); `prefers-reduced-motion` é respeitado.

## Calls do redator (minhas escolhas, a conferir)
- Imóvel à venda: a mesma entidade `obras`, com campos opcionais de preço, área, quartos e vagas. O status ganha o valor `vendido`, que esconde o botão de contato e mostra uma faixa "Vendido". O botão de contato abre o WhatsApp com o nome do imóvel.
- Leads do formulário: ficam em uma caixa de entrada no Adm (lida, não lida, arquivada), com notificação por e-mail via Resend e honeypot contra spam.
- Supabase: projeto novo e separado do VDO Club, com login próprio do Adm. A conta e as credenciais são do Carlos; ele cria o projeto e eu entrego as migrações. Primeiro admin criado manualmente. Haverá preview na Vercel como ambiente de teste.
- Mídia: o processamento do zip é local. O vídeo institucional entra como hero silencioso e curto, e a versão completa vai para o YouTube. Eu escolho as melhores fotos de cada obra (Bússola e Dunas Douradas) e uso placeholders nos nomes até o Carlos informar.
- Hero da Home (decisão do Carlos após ver o mockup): usa o vídeo `1º - Midia - VDO/03º - Viver de Obra/VIVERDEOBRA(V.3).mp4` do zip (523 MB). Será transcodificado localmente para web (MP4 H.264 e WebM, 1080p, poster em WebP, versão menor para celular), em loop silencioso, com poster enquanto carrega. Texto do hero fica sobre uma sobreposição escura para manter a leitura.
- Animações: componentes reais do React Bits (github.com/DavidHDev/react-bits), copiados para o projeto; o mockup apenas simulou alguns.
- Front-end: construído com a skill de design front-end (frontend-design), seguindo a identidade preto e amarelo da logo.
- O link "Adm" fica no rodapé e dentro de "Acessar", não em destaque no menu principal.

## Deixado ao construtor
Estrutura de pastas, esquema exato das tabelas, componentes React Bits específicos, copy das seções (usando o texto institucional atual como base), SEO e metadados, acessibilidade, performance, testes.

## Em aberto (precisa do Carlos)
- URL do Facebook.
- Lista de serviços que a empresa quer destacar.
- Se há algum texto ou nome oficial para as obras do zip.
