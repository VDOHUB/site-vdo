# Site Viver de Obra

Site institucional da Viver de Obra Engenharia (Next.js 16, React 19, Tailwind 4, Supabase).
Páginas públicas (Home, Catálogo de Obras, Em andamento, Imóveis à venda, Sobre, Contato) e a área
interna `/admin`.

Para publicar o site, veja [docs/DEPLOY.md](docs/DEPLOY.md). Para aplicar a logo nos outros sistemas,
veja [docs/LOGO-NOS-SISTEMAS.md](docs/LOGO-NOS-SISTEMAS.md). As logos prontas ficam em `entrega/logos/`.

## Como rodar

Requisitos: Node 22+, npm e, para o Adm e os testes com banco, Docker.

```bash
npm install
cp .env.example .env.local   # preencha o que for usar (sem Supabase o site abre, só sem obras)
npm run dev                  # http://localhost:3000
```

Sem as variáveis do Supabase o site público abre normalmente, com listas vazias. O Adm precisa do
Supabase.

### Testes

```bash
npm test                     # unitários (Vitest)
npx tsc --noEmit             # tipos
npm run lint
npm run e2e                  # Playwright, site sem banco (inclui e2e/a11y.spec.ts, acessibilidade com axe)
```

Lighthouse (mobile, na Home, contra o build de produção):

```bash
npm run build
npm run test:lighthouse      # sobe `next start`, mede e falha se ficar abaixo dos mínimos
```

### Supabase local e e2e do Adm

```bash
npx supabase@latest start    # sobe o banco local (Docker); aplica migrações e supabase/seed.sql
npm run e2e:admin            # Playwright do Adm contra o Supabase local (cria usuários de teste)
npx supabase@latest test db  # testes pgTAP das regras de segurança (supabase/tests)
npx supabase@latest stop
```

### Pipeline de mídia

`scripts/optimize-media.mjs` gera as imagens e vídeos otimizados a partir das fotos e do vídeo originais,
seguindo `scripts/media-manifest.json` (que também guarda o texto alternativo de cada foto):

- fotos: `public/obras/<slug>/<n>-800|1600.(webp|avif)`;
- vídeo do topo: `public/hero/` (MP4 720p/1080p, WebM e poster).

O `supabase/seed.sql` repete as legendas do manifesto. Ao mudar um texto alternativo, altere os dois
(há um teste em `src/lib/seo.test.ts` que confere se continuam iguais).

```bash
node --test scripts/optimize-media.test.mjs   # testes do pipeline (precisa do vídeo original, ver HERO_SOURCE)
```

## Estrutura

- `src/app`: rotas (páginas públicas, `/admin`, `sitemap.ts`, `robots.ts`, ícones e imagem de compartilhamento).
- `src/lib`: dados (obras, leads), Supabase, SEO (`seo.ts`) e configurações do site (`site.ts`).
- `src/components`: interface; `reactbits/` traz componentes do React Bits (veja o README da pasta).
- `supabase/`: migrações, seed e testes SQL.
- `e2e/`: testes de ponta a ponta.
