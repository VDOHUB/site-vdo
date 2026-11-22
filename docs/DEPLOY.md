# Como colocar o site Viver de Obra no ar

Guia passo a passo para quem vai publicar o site. Não precisa ser programador, mas precisa de
acesso às contas abaixo. Reserve cerca de 1 hora.

**O que você vai usar:**

| Serviço | Para quê | Custo |
| --- | --- | --- |
| [Supabase](https://supabase.com) | Banco de dados, login do Adm e fotos enviadas pelo Adm | Plano gratuito atende no início |
| [Vercel](https://vercel.com) | Hospeda o site | Plano gratuito atende no início |
| [Resend](https://resend.com) | Envia o e-mail de aviso quando alguém preenche o Contato | Plano gratuito atende no início |
| GitHub | Guarda o código (a Vercel lê dele) | Gratuito |

> Regra de ouro: **nunca** cole senhas e chaves em e-mail, WhatsApp ou no GitHub. Elas só entram
> nos campos de "Environment Variables" da Vercel e no painel do Supabase.

---

## 1. Criar o projeto no Supabase

1. Entre em supabase.com, crie uma conta e clique em **New project**.
2. Nome: `viver-de-obra`. Região: **South America (São Paulo)**.
3. Crie e **guarde a senha do banco** num gerenciador de senhas (ela não é usada no site, mas é
   necessária para o passo 2).
4. Aguarde ~2 minutos até o projeto ficar pronto.
5. Abra **Project Settings > API** e copie, para um bloco de notas seguro:
   - **Project URL** (vira `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon / public key** (vira `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (vira `SUPABASE_SERVICE_ROLE_KEY`). Esta é secreta: dá acesso total ao banco.
6. Guarde também o **Reference ID** do projeto (em Project Settings > General).

## 2. Criar as tabelas (migrações 0001 a 0003)

As migrações ficam em `supabase/migrations/` (`0001_init.sql`, `0002_storage.sql`,
`0003_destaque_ordem.sql`). Elas criam as tabelas, as regras de segurança (RLS) e o bucket de fotos.

No computador do desenvolvedor, dentro da pasta do projeto:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref SEU_REFERENCE_ID
npx supabase@latest db push
```

- `link` pede a senha do banco (passo 1.3).
- `db push` lista as 3 migrações e pede confirmação. Responda `Y`.

**O que NÃO rodar em produção:**

- `supabase db reset`: **apaga todo o banco**. Só existe para o ambiente local.
- `supabase start`: sobe um banco de teste no computador. Não tem relação com o site no ar.

### Dados iniciais (seed)

O arquivo `supabase/seed.sql` cadastra as duas obras que já estão no site (Dunas Douradas e Agência
Bússola, com as legendas das fotos) e a lista de "Recursos" do Adm. Ele é seguro de rodar mais de uma
vez (não duplica). Para aplicar:

1. No Supabase, abra **SQL Editor > New query**.
2. Cole todo o conteúdo de `supabase/seed.sql` e clique em **Run**.

O seed **não cria usuários**. As fotos dessas duas obras **não precisam ser enviadas ao
Storage**: elas são servidas pelos arquivos do próprio site (pasta `public/obras`). Só as fotos novas,
enviadas pelo Adm, vão para o Storage.

## 3. Criar o primeiro administrador

O Adm só deixa entrar quem está na tabela `profiles` com `role = 'admin'`. São três passos:

1. No Supabase: **Authentication > Users > Add user > Create new user**. Informe o e-mail e uma senha
   forte e marque **Auto Confirm User**. Clique em criar.
2. Copie o **UID** do usuário criado (coluna `User UID`).
3. Em **SQL Editor**, rode (troque o UID):

```sql
insert into public.profiles (id, role)
values ('COLE-O-UID-AQUI', 'admin');
```

Para criar outro administrador no futuro, repita os passos 1 a 3.

## 4. Conferir o bucket de fotos

1. No Supabase, abra **Storage**.
2. Deve existir um bucket chamado **obras**, marcado como **Public**.
   (A migração 0002 cria sozinho. Se não aparecer, a migração não rodou: volte ao passo 2.)

## 5. Configurar o envio de e-mail (Resend)

1. Crie conta no Resend e vá em **Domains > Add Domain**. Cadastre `viverdeobra.com` e adicione os
   registros DNS que o Resend mostrar (quem administra o domínio faz isso). Aguarde ficar **Verified**.
2. Em **API Keys**, crie uma chave (permissão "Sending access") e guarde-a (vira `RESEND_API_KEY`).
3. Escolha o remetente, por exemplo `Site Viver de Obra <contato@viverdeobra.com>` (vira
   `LEADS_FROM_EMAIL`). O domínio do remetente **precisa** ser o verificado. Sem isso o Resend só
   entrega para o dono da conta e os avisos do Contato não chegam à equipe.

## 6. Publicar na Vercel

1. O código precisa estar num repositório do GitHub da empresa.
2. Na Vercel: **Add New > Project**, escolha o repositório e clique em **Import**.
3. Framework: Next.js (detectado sozinho). Não mude comandos de build.
4. Antes de clicar em **Deploy**, abra **Environment Variables** e cadastre (para Production):

| Variável | O que é | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase (passo 1.5) | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key do Supabase | pública |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key do Supabase | **secreta, só no servidor**. Nunca com prefixo `NEXT_PUBLIC_` |
| `LEADS_NOTIFY_EMAIL` | E-mail que recebe o aviso dos contatos | |
| `RESEND_API_KEY` | Chave do Resend (passo 5.2) | secreta |
| `LEADS_FROM_EMAIL` | Remetente do aviso, no domínio verificado | ex.: `Site Viver de Obra <contato@viverdeobra.com>` |
| `NEXT_PUBLIC_SITE_URL` | Endereço oficial do site | `https://viverdeobra.com` |
| `NEXT_PUBLIC_VDOCLUB_URL` | Endereço do VDO Club (menu Acessar) | enquanto vazio, o item fica sem destino |
| `NEXT_PUBLIC_FACEBOOK_URL` | Página do Facebook | opcional; vazio = o link não aparece |

5. Clique em **Deploy**. Em 2 a 3 minutos a Vercel mostra um endereço provisório
   `algo.vercel.app`. **Teste tudo nele antes de mexer no domínio** (veja o checklist no fim).

> Se mudar uma variável depois, é preciso um novo deploy (Deployments > ... > Redeploy).

## 7. Colocar o domínio viverdeobra.com

Quem administra o domínio (Registro.br, GoDaddy, etc.) faz esta parte.

1. Na Vercel: **Project > Settings > Domains > Add** e informe `viverdeobra.com`. Adicione também
   `www.viverdeobra.com` (a Vercel redireciona um para o outro).
2. A Vercel mostra os registros DNS exigidos. Normalmente:
   - `A` para `@` (raiz) apontando para o IP indicado pela Vercel;
   - `CNAME` para `www` apontando para o valor indicado pela Vercel.
3. No painel do domínio, **troque** os registros atuais de `@` e `www` por estes. Mantenha os registros
   de e-mail (MX, SPF, DKIM) como estão.
4. Aguarde a propagação (de minutos até algumas horas). A Vercel emite o certificado HTTPS sozinha e
   mostra "Valid Configuration" quando terminar.

**Plano de volta (rollback):** não desligue o site antigo até o novo estar validado. Antes de trocar o
DNS, anote os valores atuais de `@` e `www`. Se algo der errado, basta devolver esses valores no
painel do domínio; o site antigo volta a responder em minutos.

## 8. Checklist depois de publicar

Faça com o site novo já no ar (no endereço provisório e, depois, no domínio):

- [ ] Home abre, o vídeo do topo toca e não há textos quebrados.
- [ ] Catálogo de Obras lista as obras e a galeria abre.
- [ ] `/admin` leva ao login; entrar com o administrador criado no passo 3 funciona.
- [ ] No Adm: criar uma obra de teste, publicar e ver no Catálogo; depois **despublicar** e confirmar
      que sumiu do site; por fim apagar a obra de teste.
- [ ] Enviar uma mensagem de teste pelo formulário de **Contato**.
- [ ] A mensagem aparece em **Mensagens** no Adm **e** chega ao e-mail de `LEADS_NOTIFY_EMAIL`
      (olhe também o spam).
- [ ] `https://viverdeobra.com/robots.txt` e `/sitemap.xml` abrem.
- [ ] Cole o endereço do site numa conversa de WhatsApp: aparece a imagem e o título do compartilhamento.

## 9. Limitações conhecidas

- **Tentativas de login:** o bloqueio contra excesso de tentativas depende do limite por IP do próprio
  Supabase Auth. Recomendação: ativar **CAPTCHA (Cloudflare Turnstile)** em Authentication > Attack
  Protection no Supabase.
- **Spam no Contato:** a proteção é só um campo oculto (honeypot). Se começar a chegar spam, adicionar
  Turnstile ao formulário.
- **Endereço inexistente em `/catalogo/algo`:** mostra a página "não encontrada", mas o código HTTP
  é 200 (com `noindex`, então não entra no Google). É uma característica do modelo de renderização atual.
- **Novas tabelas no Supabase:** o projeto não revoga os privilégios padrão do Supabase. Quem criar uma
  tabela nova precisa **ativar RLS e criar as policies** (e revogar `anon`/`authenticated`). Veja
  `0001_init.sql` como modelo.
- **Peso do repositório e dos vídeos:** os vídeos do topo (de 7 a 17 MB cada) e as fotos somam cerca de
  52 MB no Git. Funciona, mas deixa clonar e publicar mais lento. Sugestão: usar Git LFS ou hospedar
  os vídeos num CDN/Storage.
- **Desempenho (Lighthouse mobile da Home):** medido em ambiente local, acessibilidade 98, boas práticas 100
  e SEO 100, mas desempenho com mediana de cerca de 65-70 (meta: 85; faixa observada 49-82), com LCP ~3,5 s
  e CLS 0. A medição local oscila muito entre execuções; **meça de novo no Vercel/PageSpeed Insights**
  depois do deploy. Se continuar abaixo de 85, os pontos a atacar são os vídeos pesados (CDN) e o JavaScript inicial.
- **Pendências de conteúdo:** o link do Facebook (`NEXT_PUBLIC_FACEBOOK_URL`) e o texto final da lista
  de serviços (página Sobre, `SERVICOS` em `src/app/sobre/page.tsx`) dependem de confirmação do Carlos.
  Descrição e local das duas obras do seed também são provisórios: edite pelo Adm.
