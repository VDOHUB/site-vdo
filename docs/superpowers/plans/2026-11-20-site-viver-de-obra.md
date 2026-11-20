# Novo site Viver de Obra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir viverdeobra.com por um site Next.js com páginas públicas animadas (React Bits), hero em vídeo e uma área Adm onde a equipe edita obras, imóveis e recursos internos.

**Architecture:** Next.js App Router no diretório do projeto. As páginas públicas leem do Supabase (somente linhas `publicado = true`, via RLS). `/admin` é protegido por Supabase Auth com `role = 'admin'`. Mídia é otimizada localmente por scripts antes de ser enviada ao Storage ou ao `public/`.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, React Bits (componentes TS+Tailwind copiados para `src/components/reactbits/`), motion/gsap conforme exigido por cada componente, Supabase (Auth, Postgres, RLS, Storage), Resend, sharp, ffmpeg, Vitest, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-20-site-viver-de-obra-design.md`

## Global Constraints

- Idioma: português do Brasil em todo texto visível.
- Páginas públicas: Home, Catálogo de Obras, Obras em andamento, Imóveis à venda, Sobre, Contato. Não existe página de Portfólio.
- Status de `obras`: `pronta`, `em_andamento`, `a_venda`, `vendido`. O Catálogo mostra só `pronta`.
- Identidade: fundo grafite `#171716`, amarelo `#F0B323`, texto `#F3EFE6`; logo em todas as páginas e no Adm.
- Hero da Home: `VIVERDEOBRA(V.3).mp4` do zip, em loop, mudo, com poster; versão mobile menor.
- Contato: WhatsApp (62) 99244-5881; Av. São Francisco de Assis, 181, Galeria Nazir, Sala 05, 2º piso, Jundiaí, Anápolis-GO, 75110-810; seg a sáb, 8h às 18h; Instagram `instagram.com/viverdobra`; YouTube `youtube.com/channel/UCqF-imgywwuURWTK-EQm7DQ`; Facebook: URL pendente (placeholder configurável).
- Tópicos do formulário: Orçamento, Dúvidas, Sugestões. Mensagem de sucesso: "Enviado com sucesso! Em breve retornaremos o contato."
- Supabase: projeto novo, separado do VDO Club. Primeiro admin criado manualmente; sem auto-cadastro de admin.
- `prefers-reduced-motion` desliga animações e o vídeo cai no poster.
- Nenhum arquivo de mídia bruto do zip entra no repositório; só saídas otimizadas.
- Sem repositório git hoje: o Task 1 roda `git init` e todos os commits seguem a partir dele.

## Review Focus

- Visitante anônimo acessa `/admin` ou rotas de Server Action do Adm: deve ser redirecionado ao login, sem vazar dados.
- Usuário autenticado sem `role = 'admin'`: deve ser negado no Adm e nas tabelas (RLS).
- Obra com `publicado = false` ou com 0 fotos: não aparece nos públicos, ou aparece com estado vazio elegante; nunca quebra a página.
- Vídeo do hero não carrega, conexão com economia de dados ou `prefers-reduced-motion`: a Home mostra o poster e o texto legível.
- Imóvel `vendido`: faixa "Vendido" e sem botão de contato.
- Formulário de contato: honeypot preenchido não grava nem envia e-mail; campos vazios mostram erro claro; falha do Resend não perde o lead (grava antes de notificar).
- Upload de foto enorme ou de arquivo que não é imagem: rejeitado com mensagem.

---

### Task 1: Scaffold, tokens, layout e navegação

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind` config e `src/app/globals.css` (tokens do projeto), `src/app/layout.tsx`, `src/components/site/Header.tsx`, `src/components/site/Footer.tsx`, `src/lib/site.ts`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`
- Create: `public/brand/logo-preto-amarelo.png` (da pasta de logos do zip)
- Test: `src/lib/site.test.ts`, `e2e/nav.spec.ts`

**Interfaces:**
- Produces: `src/lib/site.ts` exporta `SITE: { whatsapp: string; whatsappUrl(msg?: string): string; address: string; hours: string; social: { instagram: string; youtube: string; facebook: string | null } }` e `NAV: { href: string; label: string }[]`. `Header` e `Footer` não recebem props.

- [ ] **Step 1: Test** `whatsappUrl('Olá')` retorna `https://api.whatsapp.com/send?phone=5562992445881&text=Ol%C3%A1`; `NAV` tem exatamente os rótulos Catálogo de Obras, Em andamento, Imóveis à venda, Sobre, Contato.
- [ ] **Step 2:** `git init`; crie o app Next.js com TypeScript, Tailwind e App Router no diretório atual, sem apagar `docs/`. Run: `npx vitest run src/lib/site.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implementar `src/lib/site.ts` com os valores das Global Constraints.
- [ ] **Step 4:** Definir tokens de cor e fontes (Bricolage Grotesque e Instrument Sans via `next/font/google`) em `globals.css`. Implementar `Header` (logo, nav, botão "Acessar" com menu Hub/Club/Adm, menu mobile) e `Footer` (links, ecossistema, redes, endereço, horário). Links do Hub: `https://vdohub.viverdeobra.com`; Adm: `/admin`; Club: variável `NEXT_PUBLIC_VDOCLUB_URL`.
- [ ] **Step 5:** Playwright `e2e/nav.spec.ts`: no viewport 390px, abrir o menu e navegar para `/catalogo` mostra o título "Catálogo de Obras". Run: `npx vitest run && npx playwright test e2e/nav.spec.ts`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: scaffold, tokens, header e footer`.

---

### Task 2: Pipeline de mídia (imagens e vídeo do hero)

**Files:**
- Create: `scripts/optimize-media.mjs`, `scripts/media-manifest.json` (mapa fonte → destino, com nome de cada obra), `src/lib/media.ts`
- Create (saída): `public/hero/hero-1080.mp4`, `hero-1080.webm`, `hero-720.mp4`, `hero-poster.webp`
- Test: `scripts/optimize-media.test.mjs`

**Interfaces:**
- Produces: `optimizeImage(srcPath: string, outDir: string, widths: number[]): Promise<{ file: string; width: number }[]>` gera `.avif` e `.webp` por largura. `probeVideo(path: string): Promise<{ durationSec: number; width: number; height: number }>`. `hero` em `src/lib/media.ts`: `{ sources: { src: string; type: string; media?: string }[]; poster: string }`.

- [ ] **Step 1: Test** `optimizeImage` numa foto de fixture gera arquivos `.avif` e `.webp` nas larguras pedidas, todos menores que 400 KB. Teste do vídeo: `hero-1080.mp4` existe, tem menos de 25 MB e `probeVideo` retorna a mesma duração (±0,5 s) do original.
- [ ] **Step 2:** Run: `node --test scripts/optimize-media.test.mjs`. Expected: FAIL.
- [ ] **Step 3:** Implementar o script com `sharp` para imagens e `ffmpeg` (H.264 CRF ~26, sem áudio, `-movflags +faststart`; WebM VP9; versão 720p; poster do primeiro segundo). Ler as fotos de Dunas Douradas e Agência Bússola do zip, extraindo para uma pasta temporária fora do projeto.
- [ ] **Step 4:** Run o script e o teste. Expected: PASS; registrar os tamanhos finais no commit.
- [ ] **Step 5: Commit** `feat: pipeline de mídia e vídeo do hero`.

---

### Task 3: Banco, RLS e Storage

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_storage.sql`, `supabase/seed.sql`, `supabase/tests/rls.test.sql` (pgTAP)
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `.env.local.example`

**Interfaces:**
- Produces tabelas: `profiles(id uuid pk, role text check in ('admin'))`, `obras(id, slug unique, titulo, descricao, local, tipo check in ('residencial','corporativo'), status check in ('pronta','em_andamento','a_venda','vendido'), progresso int null, preco text null, area text null, quartos int null, vagas int null, ordem int, destaque bool, publicado bool, created_at)`, `obra_fotos(id, obra_id fk, path, ordem, alt)`, `leads(id, topico check in ('Orçamento','Dúvidas','Sugestões'), nome, whatsapp, mensagem, status check in ('nova','lida','arquivada'), created_at)`, `recursos_internos(id, titulo, descricao, url, tipo check in ('link','download','instrucoes'), ordem)`. Bucket `obras` público para leitura.
- Produces: `createServerClient(): SupabaseClient`, `createBrowserClient(): SupabaseClient`, `isAdmin(userId: string): Promise<boolean>`.

- [ ] **Step 1: Test pgTAP** `rls.test.sql`: anônimo lê só `obras` com `publicado = true`; anônimo não lê `leads` nem `recursos_internos`; anônimo pode inserir em `leads` com `status = 'nova'` mas não atualizar; usuário autenticado sem perfil admin não escreve em `obras`; admin escreve e lê tudo.
- [ ] **Step 2:** Run: `supabase test db`. Expected: FAIL.
- [ ] **Step 3:** Escrever as migrações com RLS por tabela (função `is_admin()` baseada em `profiles`). Seed: Dunas Douradas e Agência Bússola como `pronta`, publicadas, e os recursos internos iniciais da spec.
- [ ] **Step 4:** Run: `supabase test db`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: schema, RLS e storage`.

---

### Task 4: Camada de dados pública

**Files:**
- Create: `src/lib/obras.ts`, `src/lib/types.ts`
- Test: `src/lib/obras.test.ts`

**Interfaces:**
- Consumes: `createServerClient()` da Task 3.
- Produces: `type Obra`, `type Foto`; `listObras(filter: { status?: Obra['status'][]; tipo?: Obra['tipo']; destaque?: boolean }): Promise<Obra[]>`; `getObra(slug: string): Promise<(Obra & { fotos: Foto[] }) | null>`; `photoUrl(path: string, width: number): string`.

- [ ] **Step 1: Test** com cliente Supabase simulado: `listObras({ status: ['pronta'] })` pede só publicadas e ordena por `ordem`; obra sem fotos volta com `fotos: []`; `photoUrl` monta a URL pública do bucket `obras`.
- [ ] **Step 2:** Run: `npx vitest run src/lib/obras.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implementar as funções filtrando `publicado = true` também no código (defesa em profundidade).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** `feat: camada de dados de obras`.

---

### Task 5: Componentes React Bits e Home com hero em vídeo

**Files:**
- Create: `src/components/reactbits/` (BlurText, ScrollVelocity ou Marquee, SpotlightCard, TiltedCard, e os que forem necessários), `src/components/home/Hero.tsx`, `src/components/home/EcosystemSection.tsx`, `src/components/home/FeaturedObras.tsx`, `src/app/page.tsx`
- Test: `src/components/home/Hero.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `hero` de `src/lib/media.ts` (Task 2), `listObras` (Task 4), `SITE`/`NAV` (Task 1).
- Produces: `Hero(): JSX.Element` com `<video autoPlay muted loop playsInline poster>`; `ObraCard({ obra: Obra }): JSX.Element` (usa TiltedCard) reutilizado nas Tasks 6; `EcosystemCard({ title, text, href, mark }): JSX.Element` (usa SpotlightCard).

- [ ] **Step 1: Test** `Hero.test.tsx`: renderiza `video` com `muted`, `loop`, `playsInline` e `poster`, fontes MP4 e WebM; com `prefers-reduced-motion: reduce` não renderiza `video` e mostra só o poster; o `h1` contém "Obra sem dor de cabeça." (via BlurText, texto acessível preservado em `aria-label`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Instalar os componentes React Bits TS+Tailwind pelo registry oficial (por exemplo `npx shadcn@latest add https://reactbits.dev/r/BlurText-TS-TW`); se o comando não existir na versão atual, usar o método de instalação documentado em reactbits.dev. Copie cada componente para `src/components/reactbits/` e anote a origem em `src/components/reactbits/README.md`.
- [ ] **Step 4:** Implementar o `Hero` com sobreposição escura, CTAs ("Ver Catálogo de Obras", "Pedir orçamento"), faixa Marquee de valores e as seções da Home do mockup (destaques, em andamento/imóveis, ecossistema, sobre, chamada final), com estados vazios.
- [ ] **Step 5:** Run: `npx vitest run && npx playwright test e2e/home.spec.ts` (verifica que a Home carrega, o botão leva a `/catalogo` e não há erro no console). Expected: PASS.
- [ ] **Step 6: Commit** `feat: home com hero em vídeo e animações React Bits`.

---

### Task 6: Catálogo, Em andamento e Imóveis à venda

**Files:**
- Create: `src/app/catalogo/page.tsx`, `src/app/catalogo/[slug]/page.tsx`, `src/app/andamento/page.tsx`, `src/app/imoveis/page.tsx`, `src/components/obras/Gallery.tsx`, `src/components/obras/VendidoRibbon.tsx`
- Test: `src/components/obras/Gallery.test.tsx`, `e2e/catalogo.spec.ts`

**Interfaces:**
- Consumes: `listObras`, `getObra`, `photoUrl` (Task 4), `ObraCard` (Task 5), `SITE.whatsappUrl` (Task 1).
- Produces: `Gallery({ fotos }: { fotos: Foto[] }): JSX.Element` (lightbox por teclado, setas e Esc); botão de contato do imóvel: `whatsappUrl("Olá, tenho interesse no imóvel <titulo>")`.

- [ ] **Step 1: Test** `Gallery`: abre ao clicar, navega com setas, fecha com Esc; com `fotos=[]` mostra mensagem de estado vazio. E2E: `/catalogo` filtra por Residencial/Corporativo; `/imoveis` mostra faixa "Vendido" e nenhum botão de contato no card vendido.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar as páginas com revalidação (`revalidate = 60`) e estados vazios; `andamento` mostra `progresso` como barra.
- [ ] **Step 4:** Run: testes unitários e Playwright. Expected: PASS.
- [ ] **Step 5: Commit** `feat: catalogo, obras em andamento e imóveis`.

---

### Task 7: Sobre e Contato com leads

**Files:**
- Create: `src/app/sobre/page.tsx`, `src/app/contato/page.tsx`, `src/components/contato/ContactForm.tsx`, `src/lib/leads.ts`, `src/app/contato/actions.ts`
- Test: `src/lib/leads.test.ts`, `e2e/contato.spec.ts`

**Interfaces:**
- Produces: `validateLead(input: unknown): { ok: true; data: LeadInput } | { ok: false; errors: Record<string, string> }`; `submitLead(prev: LeadState, formData: FormData): Promise<LeadState>` (Server Action) onde `LeadState = { status: 'idle' | 'ok' | 'error'; errors?: Record<string, string> }`.

- [ ] **Step 1: Test** `validateLead`: exige tópico válido, nome e mensagem; WhatsApp com 10 a 11 dígitos; campo `website` (honeypot) preenchido retorna ok silencioso sem gravar. `submitLead` grava no banco antes de tentar o e-mail, e falha do envio não retorna erro ao usuário.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar validação, gravação em `leads` (cliente de serviço) e e-mail Resend para `LEADS_NOTIFY_EMAIL`.
- [ ] **Step 4:** Run unit + `e2e/contato.spec.ts` (envio válido mostra a mensagem de sucesso exata; vazio mostra erros). Expected: PASS.
- [ ] **Step 5: Commit** `feat: sobre, contato e leads`.

---

### Task 8: Adm — acesso, obras, mensagens, recursos

**Files:**
- Create: `src/middleware.ts`, `src/app/admin/login/page.tsx`, `src/app/admin/(painel)/layout.tsx`, `src/app/admin/(painel)/obras/page.tsx`, `.../obras/[id]/page.tsx`, `.../mensagens/page.tsx`, `.../recursos/page.tsx`, `.../destaques/page.tsx`, `src/lib/admin/actions.ts`, `src/lib/admin/upload.ts`
- Test: `src/lib/admin/upload.test.ts`, `e2e/admin.spec.ts`

**Interfaces:**
- Consumes: `isAdmin`, clientes Supabase (Task 3); `optimizeImage` conceitualmente replicado no upload (redimensiona no cliente para no máximo 2400 px de largura e 6 MB).
- Produces: `validatePhoto(file: { type: string; size: number }): { ok: true } | { ok: false; error: string }`; Server Actions `saveObra(formData)`, `deleteObra(id)`, `reorderFotos(obraId, ids)`, `setLeadStatus(id, status)`, `saveRecurso(formData)`.

- [ ] **Step 1: Test** `validatePhoto` rejeita tipos que não são imagem e arquivos acima do limite, com mensagem em português. E2E: anônimo em `/admin/obras` vai para `/admin/login`; usuário comum autenticado é negado; admin cria uma obra "Teste", ela aparece em `/catalogo` após publicar e some ao despublicar.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar o middleware (sessão + `isAdmin`), as telas e as Server Actions, sempre revalidando papel de admin dentro da própria action. Link "Adm" só no rodapé e no menu "Acessar".
- [ ] **Step 4:** Run unit e `npx playwright test e2e/admin.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: área Adm`.

---

### Task 9: Conteúdo real, SEO, acessibilidade e entrega

**Files:**
- Modify: seeds e `scripts/media-manifest.json` com nomes oficiais; `src/app/layout.tsx` (metadados), `src/app/sitemap.ts`, `src/app/robots.ts`
- Create: `docs/DEPLOY.md`, `docs/LOGO-NOS-SISTEMAS.md`, pasta `entrega/logos/` com logos otimizadas
- Test: `e2e/a11y.spec.ts`

**Interfaces:**
- Produces: `sitemap(): MetadataRoute.Sitemap` (inclui obras publicadas); `robots()` bloqueia `/admin`.

- [ ] **Step 1: Test** `e2e/a11y.spec.ts` com axe em Home, Catálogo, Contato e login do Adm: zero violações sérias. Lighthouse mobile na Home: performance igual ou maior que 85.
- [ ] **Step 2:** Run. Expected: FAIL onde houver ajuste pendente.
- [ ] **Step 3:** Corrigir contraste, foco, `alt` e tamanhos; completar metadados e Open Graph; escrever `DEPLOY.md` (projeto Supabase, variáveis, primeiro admin, domínio na Vercel, troca de DNS) e `LOGO-NOS-SISTEMAS.md` (como aplicar a logo no Hub, Club e contratos).
- [ ] **Step 4:** Run toda a suíte e o Lighthouse. Expected: PASS.
- [ ] **Step 5: Commit** `chore: SEO, acessibilidade e documentos de entrega`.

---

## Self-review

- **Cobertura da spec:** páginas públicas (Tasks 5 a 7); hero em vídeo e React Bits (Tasks 2 e 5); status `vendido` (Tasks 3 e 6); leads com inbox e e-mail (Tasks 7 e 8); Adm com CRUD, recursos e destaques (Task 8); mídia otimizada (Task 2); logo nos sistemas (Task 9, entregue como guia e pacote); Facebook e lista de serviços ficam como placeholders configuráveis em `SITE` e nos textos, pendentes do Carlos.
- **Tipos:** `Obra`, `Foto`, `listObras`, `photoUrl`, `ObraCard` e `SITE.whatsappUrl` têm o mesmo nome em todas as tasks que os usam.
- **Risco aberto:** o comando de instalação dos componentes React Bits deve ser confirmado na hora (Task 5, Step 3); o plano aceita o método documentado do site da biblioteca.
