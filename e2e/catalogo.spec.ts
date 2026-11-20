import { test, expect } from "@playwright/test";

test("/catalogo mostra título, chips e estado vazio sem dados", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page.getByRole("heading", { level: 1, name: "Catálogo de Obras" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Residencial" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Corporativo" })).toBeVisible();
  await expect(page.getByText("O catálogo está ganhando obras novas.")).toBeVisible();
});

test("chips do catálogo funcionam pelo teclado", async ({ page }) => {
  await page.goto("/catalogo");
  const res = page.getByRole("button", { name: "Residencial" });
  await res.focus();
  await page.keyboard.press("Enter");
  await expect(res).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "false");
  const corp = page.getByRole("button", { name: "Corporativo" });
  await corp.focus();
  await page.keyboard.press("Space");
  await expect(corp).toHaveAttribute("aria-pressed", "true");
});

test("/andamento e /imoveis mostram título e estado vazio", async ({ page }) => {
  await page.goto("/andamento");
  await expect(page.getByRole("heading", { level: 1, name: "Em andamento" })).toBeVisible();
  await expect(page.getByText("Nenhuma obra em andamento publicada agora.")).toBeVisible();
  await page.goto("/imoveis");
  await expect(page.getByRole("heading", { level: 1, name: "Imóveis à venda" })).toBeVisible();
  await expect(page.getByText("Nenhum imóvel à venda no momento.")).toBeVisible();
});

test("/catalogo/nao-existe mostra a página 404", async ({ page }) => {
  // Com cacheComponents a rota dinâmica faz streaming sob Suspense: o status HTTP já saiu como 200,
  // mas notFound() renderiza a página 404; a metadata marca robots noindex.
  await page.goto("/catalogo/nao-existe");
  await expect(page.getByText(/This page could not be found|404/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Carregando obra…" })).toHaveCount(0);
});
