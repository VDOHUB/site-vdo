// E2E do Adm contra o Supabase local. Rodar com `npm run e2e:admin` (ver scripts/e2e-admin.mjs).
import { randomBytes } from "node:crypto";
import { expect, test, type Browser, type Page } from "@playwright/test";
import sharp from "sharp";
import { E2E_PREFIX, serviceClient } from "./admin.setup";

test.describe.configure({ mode: "serial" });

const sb = () => serviceClient();
const tag = randomBytes(3).toString("hex");
const TITULO = `${E2E_PREFIX} ${tag}`;

async function login(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function loginAdmin(page: Page) {
  await login(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
  await expect(page).toHaveURL(/\/admin\/obras$/, { timeout: 30_000 });
}

async function userContext(browser: Browser, baseURL: string) {
  const ctx = await browser.newContext({ baseURL });
  const page = await ctx.newPage();
  await login(page, process.env.E2E_USER_EMAIL!, process.env.E2E_USER_PASSWORD!);
  await expect(page).toHaveURL(/\/admin\/negado$/, { timeout: 30_000 });
  return { ctx, page };
}

test("anonimo em /admin/obras vai para o login; Adm e noindex", async ({ page }) => {
  const res = await page.goto("/admin/obras");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { name: "Adm Viver de Obra" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  for (const p of ["/admin/mensagens", "/admin/recursos", "/admin/destaques", "/admin/obras/nova", "/admin"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
});

test("senha errada e e-mail inexistente mostram o mesmo erro generico", async ({ page }) => {
  await login(page, process.env.E2E_ADMIN_EMAIL!, "senha-errada-" + tag);
  await expect(page.locator(".adm-form .form-error")).toHaveText("E-mail ou senha incorretos.", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/admin\/login$/);
  await login(page, `ninguem-${tag}@example.test`, "qualquer-coisa-" + tag);
  await expect(page.locator(".adm-form .form-error")).toHaveText("E-mail ou senha incorretos.", { timeout: 15_000 });
});

test("usuario autenticado sem papel admin e negado", async ({ browser, baseURL }) => {
  const { ctx, page } = await userContext(browser, baseURL!);
  await expect(page.getByRole("heading", { name: "Esta conta não tem acesso ao Adm." })).toBeVisible();
  for (const p of ["/admin/obras", "/admin/mensagens", "/admin/recursos", "/admin/destaques"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/admin\/negado$/);
  }
  await expect(page.locator(".inbox, table")).toHaveCount(0);
  // Sair encerra a sessao.
  await page.getByRole("button", { name: "Sair desta conta" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/obras");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await ctx.close();
});

test("admin cria obra publicada com foto, aparece no catalogo e some ao despublicar", async ({ page }) => {
  test.setTimeout(180_000);
  await loginAdmin(page);
  await page.getByRole("link", { name: "+ Nova obra" }).click();
  await expect(page).toHaveURL(/\/admin\/obras\/nova$/);
  await page.getByLabel("Título").fill(TITULO);
  await page.getByLabel("Status").selectOption("pronta");
  await page.getByLabel("Tipo").selectOption("residencial");
  await page.getByLabel("Local").fill("Anápolis, GO");
  await page.getByLabel("Descrição").fill("Obra criada pelo teste e2e.");
  await expect(page.getByLabel("Publicar no site")).toBeChecked();
  await page.getByRole("button", { name: "Criar e publicar" }).click();
  await expect(page).toHaveURL(/\/admin\/obras\/[0-9a-f-]{36}\?nova=1$/, { timeout: 30_000 });
  const obraId = /obras\/([0-9a-f-]{36})/.exec(page.url())![1];

  // Foto 3000x2000 JPEG: o navegador reduz para 2400 px e reencoda antes de enviar.
  const jpg = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#f0b323" } }).jpeg({ quality: 90 }).toBuffer();
  await page.getByLabel("Escolher fotos").setInputFiles({ name: "fachada.jpg", mimeType: "image/jpeg", buffer: jpg });
  await expect(page.locator(".uploads li.ok")).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator(".thumbs li")).toHaveCount(1, { timeout: 15_000 });

  // Arquivo nao-imagem e recusado no navegador com mensagem em portugues.
  await page.getByLabel("Escolher fotos").setInputFiles({ name: "nota.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await expect(page.locator(".uploads li.erro").first()).toContainText("Formato não aceito");

  const { data: fotos } = await sb().from("obra_fotos").select("path").eq("obra_id", obraId);
  expect(fotos).toHaveLength(1);
  const path = (fotos![0] as { path: string }).path;
  expect(path).toMatch(new RegExp(`^uploads/${obraId}/[0-9a-f-]{36}\\.(webp|jpg)$`));
  const { data: blob } = await sb().storage.from("obras").download(path);
  const meta = await sharp(Buffer.from(await blob!.arrayBuffer())).metadata();
  expect(meta.width).toBe(2400);

  // Aparece no catalogo publico, com a foto do Storage.
  await page.goto("/catalogo");
  const card = page.locator("a.obra-card", { hasText: TITULO });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card.locator("img").first()).toHaveAttribute("src", new RegExp(`/storage/v1/object/public/obras/uploads/${obraId}/`));

  // Despublicar pela lista do Adm: some do catalogo.
  await page.goto("/admin/obras");
  const toggle = page.getByRole("switch", { name: `Publicar ${TITULO} no site` });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false", { timeout: 15_000 });
  await page.goto("/catalogo");
  await expect(page.getByRole("heading", { name: "Catálogo de Obras", level: 1 })).toBeVisible();
  await expect(page.locator("a.obra-card", { hasText: TITULO })).toHaveCount(0);
  // A pagina da obra tambem deixa de existir (notFound dentro do Suspense: status 200 com a tela de 404).
  await page.goto(`/catalogo/${(await sb().from("obras").select("slug").eq("id", obraId).single()).data!.slug}`);
  await expect(page.getByText(/could not be found|não encontrada/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: TITULO })).toHaveCount(0);
});

test("usuario comum nao consegue executar uma Server Action do Adm", async ({ page, browser, baseURL }) => {
  const { data: obra } = await sb().from("obras").select("id, publicado").like("titulo", TITULO).single();
  expect(obra?.publicado).toBe(false);

  // Captura a chamada real da action togglePublicado feita pelo admin.
  await loginAdmin(page);
  const reqPromise = page.waitForRequest((r) => r.method() === "POST" && Boolean(r.headers()["next-action"]));
  await page.getByRole("switch", { name: `Publicar ${TITULO} no site` }).click();
  const req = await reqPromise;
  await expect(page.getByRole("switch", { name: `Publicar ${TITULO} no site` })).toHaveAttribute("aria-checked", "true", { timeout: 15_000 });
  const actionId = req.headers()["next-action"];
  const body = JSON.stringify([obra!.id, false]); // tentar DESpublicar
  const replay = (ctx: { request: import("@playwright/test").APIRequestContext }, url: string) =>
    ctx.request.post(url, {
      headers: { "next-action": actionId, "content-type": "text/plain;charset=UTF-8", accept: "text/x-component", origin: baseURL! },
      data: body,
      maxRedirects: 0,
    });
  const publicado = async () => (await sb().from("obras").select("publicado").eq("id", obra!.id).single()).data!.publicado;

  // Usuario comum: tanto pela rota do Adm (proxy) quanto por uma rota publica (so a action se protege).
  const { ctx } = await userContext(browser, baseURL!);
  for (const url of ["/admin/obras", "/", "/contato"]) {
    await replay(ctx, url);
    expect(await publicado()).toBe(true);
  }
  // Anonimo idem.
  const anon = await browser.newContext({ baseURL });
  for (const url of ["/admin/obras", "/"]) {
    await replay(anon, url);
    expect(await publicado()).toBe(true);
  }
  await anon.close();
  await ctx.close();

  // Controle: o MESMO replay com a sessao do admin em rota publica funciona. Logo, quem barrou
  // os outros em "/" foi o requireAdmin() dentro da action (o proxy so cobre /admin).
  await replay(page.context(), "/");
  expect(await publicado()).toBe(false);
});

test("admin marca uma mensagem do site como lida", async ({ page, baseURL }) => {
  // Insercao como o publico faria (anon key + RLS: so status 'nova').
  const nome = `E2E Lead ${tag}`;
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ topico: "Orçamento", nome, whatsapp: "62992445881", mensagem: "Quero reformar <b>um</b> apartamento." }),
  });
  expect(res.status).toBe(201);

  await loginAdmin(page);
  await page.goto("/admin/mensagens");
  await expect(page.getByRole("link", { name: /Mensagens/ }).locator(".n")).toBeVisible();
  const item = page.locator("li.msg", { hasText: nome });
  await expect(item).toBeVisible({ timeout: 15_000 });
  await expect(item.locator(".msg-text")).toHaveText("Quero reformar <b>um</b> apartamento."); // texto, nao HTML
  await expect(item.locator(".pill")).toHaveText("Nova");
  await item.getByRole("button", { name: "Marcar como lida" }).click();
  await expect(item.locator(".pill")).toHaveText("Lida", { timeout: 15_000 });
  const { data } = await sb().from("leads").select("status").eq("nome", nome).single();
  expect(data?.status).toBe("lida");
  expect(baseURL).toContain("3101");
});

test("destaques da Home seguem a ordem escolhida mesmo com obras empatadas em ordem 0", async ({ page }) => {
  test.setTimeout(180_000);
  const A = `${E2E_PREFIX} Dest A ${tag}`;
  const B = `${E2E_PREFIX} Dest B ${tag}`;
  // Duas obras prontas e publicadas com a MESMA ordem (0, o padrao da coluna).
  const { error } = await sb().from("obras").insert([
    { slug: `teste-e2e-dest-a-${tag}`, titulo: A, tipo: "residencial", status: "pronta", publicado: true, ordem: 0 },
    { slug: `teste-e2e-dest-b-${tag}`, titulo: B, tipo: "corporativo", status: "pronta", publicado: true, ordem: 0 },
  ]);
  expect(error).toBeNull();
  // Guarda os destaques atuais (seed) para restaurar no fim.
  const { data: antes } = await sb().from("obras").select("id, destaque_ordem").eq("destaque", true);

  const homeOrder = async () => {
    await page.goto("/");
    const cards = page.locator('section[aria-labelledby="destaques-title"] a.obra-card');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
    return (await cards.allInnerTexts()).map((t) => (t.includes(A) ? "A" : t.includes(B) ? "B" : "outra"));
  };
  const salvar = async () => {
    await page.getByRole("button", { name: "Salvar destaques" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Destaques salvos" })).toBeVisible();
  };

  try {
    await loginAdmin(page);
    await page.goto("/admin/destaques");
    // Espera o editor (streamado no Suspense) e tira os destaques atuais; depois escolhe B e A.
    await expect(page.getByRole("button", { name: "Salvar destaques" })).toBeVisible();
    const tirar = page.getByRole("button", { name: /^Tirar / });
    for (let n = await tirar.count(); n > 0; n--) {
      await expect(async () => {
        await tirar.first().click();
        await expect(tirar).toHaveCount(n - 1, { timeout: 1000 });
      }).toPass(); // repete se o clique chegar antes da hidratacao
    }
    await page.locator(".pick li", { hasText: B }).getByRole("button", { name: "Destacar" }).click();
    await page.locator(".pick li", { hasText: A }).getByRole("button", { name: "Destacar" }).click();
    await salvar();
    const { data: rows } = await sb().from("obras").select("titulo, ordem, destaque_ordem").in("titulo", [A, B]).order("titulo");
    expect(rows).toEqual([
      { titulo: A, ordem: 0, destaque_ordem: 2 },
      { titulo: B, ordem: 0, destaque_ordem: 1 },
    ]); // `ordem` (catalogo) intacta
    expect(await homeOrder()).toEqual(["B", "A"]);

    // Troca: A sobe para o primeiro lugar.
    await page.goto("/admin/destaques");
    await page.getByRole("button", { name: `Subir ${A}` }).click();
    await salvar();
    expect(await homeOrder()).toEqual(["A", "B"]);
  } finally {
    // Restaura os destaques do seed.
    await sb().from("obras").update({ destaque: false, destaque_ordem: null }).eq("destaque", true);
    for (const o of (antes ?? []) as { id: string; destaque_ordem: number | null }[]) {
      await sb().from("obras").update({ destaque: true, destaque_ordem: o.destaque_ordem }).eq("id", o.id);
    }
  }
});

test("admin exclui a obra e o arquivo some do Storage", async ({ page }) => {
  const { data: obra } = await sb().from("obras").select("id").like("titulo", TITULO).single();
  await loginAdmin(page);
  await page.goto(`/admin/obras/${obra!.id}`);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Excluir obra" }).click();
  await expect(page).toHaveURL(/\/admin\/obras$/, { timeout: 30_000 });
  await expect(page.getByRole("link", { name: TITULO })).toHaveCount(0);
  const { data: files } = await sb().storage.from("obras").list(`uploads/${obra!.id}`);
  expect(files ?? []).toHaveLength(0);
});
