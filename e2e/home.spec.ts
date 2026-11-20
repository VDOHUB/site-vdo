import { test, expect, type Page } from "@playwright/test";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test("Home carrega com hero em vídeo, seções e sem erros no console", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Obra sem dor de cabeça." })).toBeVisible();
  await expect(page.locator(".hero video")).toHaveCount(1);
  await expect(page.locator(".hero video source")).toHaveCount(3);
  for (const name of [
    "Obras que falam por nós.",
    "Obras em andamento e imóveis à venda.",
    "Mais que obra. Um sistema inteiro.",
    "Dois sócios. Uma equipe de obra inteira.",
    "Vamos fazer obra sem dor de cabeça?",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  // Deixa a animação do título e o vídeo começarem antes de checar o console.
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('"Ver Catálogo de Obras" leva para /catalogo', async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ver Catálogo de Obras" }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole("heading", { level: 1, name: "Catálogo de Obras" })).toBeVisible();
});

test("em 390px a Home não tem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("com reduced motion não há <video>, só o poster", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Obra sem dor de cabeça." })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator(".hero-poster")).toBeVisible();
});
