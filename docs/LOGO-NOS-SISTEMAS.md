# Como aplicar as logos nos sistemas (VDO Hub, VDO Club e Gerador de Contratos)

As logos prontas para a web estão em `entrega/logos/` (PNG, com versão `@2x` para telas de alta
resolução). Este guia diz **o que trocar e em qual arquivo** em cada sistema. Nenhum dos três projetos
foi alterado: o levantamento foi só de leitura, nas pastas irmãs do site.

## Arquivos disponíveis

| Arquivo | Uso |
| --- | --- |
| `viver-de-obra-preto-amarelo.png` (e `@2x`) | Logo Viver de Obra Engenharia para **fundos escuros** (fundo sólido grafite `#1d1d1b`, não transparente) |
| `viver-de-obra-branco-amarelo.png` (e `@2x`) | Logo Viver de Obra Engenharia para **fundos claros** (letras escuras) |
| `vdo-hub.png` (e `@2x`) | Logo do VDO Hub (fundo bege) |
| `vdo-club.png` (e `@2x`) | Logo do VDO Club (fundo creme) |

Regras gerais: use a versão `@2x` quando a imagem aparecer em tamanho pequeno numa tela de alta
densidade (celular); mantenha a proporção (não estique); deixe espaço livre ao redor; e guarde o
original antes de substituir qualquer arquivo.

---

## 1. VDO Hub (`automacao_sala_comercial`)

Projeto Next.js (App Router). Hoje o "logo" nas telas é um quadradinho com o texto **VDO** mais o
texto **VDO HUB**, e existe um `public/logo.png` (500x500, na verdade um JPEG) usado como ícone.

| Onde | Arquivo | O que fazer |
| --- | --- | --- |
| Ícone do site e ícone de iPhone | `src/app/layout.tsx` (campo `icons`, aponta para `/logo.png`) | Substituir `public/logo.png` por uma versão quadrada do logo do Hub (PNG real). Opcional: usar `src/app/icon.png` e `apple-icon.png` |
| Favicon | `src/app/favicon.ico` e `src/app/icon.svg` | Trocar pelo ícone do Hub (o `icon.svg` atual é um quadrado marrom com o texto "VDO") |
| Menu do site (landing) | `src/components/landing/Navbar.tsx` (bloco `{/* Logo */}`, ~linha 45) | Trocar o `<div>` com o texto "VDO" + o `<span>VDO HUB</span>` por `<Image src="/vdo-hub.png" ... />` |
| Rodapé do site | `src/components/landing/Footer.tsx` (~linhas 55-62) | Mesmo ajuste |
| Painel Adm: menu lateral | `src/components/admin/Sidebar.tsx` (bloco `{/* Logo */}`, ~linha 34) | Mesmo ajuste (altura sugerida: 32 px) |
| Painel Adm: login | `src/app/admin/login/page.tsx` (bloco `{/* Logo */}`, ~linha 46) | Trocar o quadrado "VDO" pela imagem (altura sugerida: 56 px) |
| Cancelar assinatura | `src/app/cancelar/page.tsx` (bloco `{/* Logo */}`) | Mesmo ajuste |
| Refazer foto | `src/app/refazer-foto/[id]/page.tsx` (bloco `{/* Logo */}`) | Mesmo ajuste |
| Portal do cliente | `src/app/portal/page.tsx` (~linha 66, link "VDO HUB") | Trocar o texto pela imagem |
| E-mails | `src/lib/resend/emails.ts` (~linha 25: `<img src="https://vdohub.viverdeobra.com/logo.png">`) | A imagem vem de `public/logo.png` publicado: ao trocar o arquivo, os e-mails já usam a nova logo. Use `<img>` com largura fixa (e-mail não aceita CSS moderno) |
| Imagem de compartilhamento | `src/app/opengraph-image.tsx` | Hoje usa a foto da sala. Opcional: sobrepor a logo no canto |

Passos: copiar `entrega/logos/vdo-hub.png` e `vdo-hub@2x.png` para `public/`; importar com
`next/image` (`import Image from "next/image"`) nos arquivos acima, com `width`/`height` da imagem e
`alt="VDO Hub"`. Como o fundo da logo é bege, ela combina melhor sobre as áreas claras (`#f5f0e8`) do
Adm; nas áreas escuras do site público, coloque-a dentro de um quadrado arredondado bege.

## 2. VDO Club (`vdoclub`)

Projeto Next.js (App Router). Hoje o "logo" é um quadrado com as letras **VC** mais o texto
**VDO CLUB**. Já existem ícones de aplicativo (PWA).

| Onde | Arquivo | O que fazer |
| --- | --- | --- |
| Ícone do app (aba e iPhone) | `src/app/icon.png` (512x512) e `src/app/apple-icon.png` | Gerar versões quadradas a partir de `vdo-club@2x.png` (centralizar sobre o fundo creme) e substituir |
| Ícones do PWA | `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (listados em `src/app/manifest.ts`) | Substituir pelos novos ícones. No `maskable`, deixar a marca dentro dos 80% centrais |
| Tela de login | `src/app/login/page.tsx` (~linhas 16-21: quadrado "VC" + `<h1>VDO CLUB</h1>`) | Trocar pelo `<Image src="/vdo-club.png" ... />` (largura sugerida: 160 px) |
| Cabeçalho da área do app | `src/app/app/layout.tsx` (~linha 26, texto "VDO CLUB") | Trocar o texto pela imagem (altura sugerida: 28 px) |
| Cabeçalho do Adm | `src/app/admin/layout.tsx` (~linha 17, "VDO CLUB · Admin") | Mesmo ajuste |
| Páginas legais | `src/components/legal-layout.tsx` | Conferir o cabeçalho e aplicar o mesmo padrão |

Passos: copiar `entrega/logos/vdo-club.png` e `vdo-club@2x.png` para `public/`. O site da Viver de
Obra usa a logo do Club no card do Ecossistema da Home (`/brand/logo-vdo-club.png`), não no menu "Acessar".

## 3. Gerador de Contratos (`automacao_contratos`)

Projeto Python (Flask) com templates Jinja e Bootstrap. A logo já é a da Viver de Obra, mas é um
JPEG de 424x362 com fundo opaco (`static/img/logo.jpeg`) e há também um SVG simplificado
(`static/img/logo.svg`, que não é a marca oficial).

| Onde | Arquivo | O que fazer |
| --- | --- | --- |
| Barra superior (todas as telas) | `templates/base.html` (~linha 16: `<img src="{{ url_for('static', filename='img/logo.jpeg') }}" height="42">`) | Trocar por `img/viver-de-obra-preto-amarelo@2x.png` (a barra é escura: `navbar-dark`) mantendo `height="42"` |
| Tela de login | `templates/login.html` (~linha 23: `/static/img/logo.jpeg`, `height:70px`) | Conferir o fundo da tela: sobre fundo claro usar `viver-de-obra-branco-amarelo@2x.png`; sobre escuro, o `preto-amarelo` |
| Logo no repositório | `static/img/` | Copiar os PNGs de `entrega/logos/` para esta pasta. Pode apagar `logo.svg` se não for usado |
| Contratos gerados (Word) | `contract_generator.py` e `contract_templates/*.docx` | O código **não insere logo** hoje. Se quiser logo no cabeçalho dos contratos, a forma mais simples é colocar a imagem no cabeçalho de cada modelo `.docx` (Word: Inserir > Cabeçalho > Imagem) usando `viver-de-obra-branco-amarelo@2x.png` (fundo branco do papel) |
| Recibos | `templates/recibo.html` e `recibo_avulso.html` | Não têm logo hoje. Para incluir: `<img src="{{ url_for('static', filename='img/viver-de-obra-branco-amarelo@2x.png') }}" height="48">` no topo |

Depois de trocar, abra o sistema, confira o menu, o login e gere um contrato e um recibo de teste.
