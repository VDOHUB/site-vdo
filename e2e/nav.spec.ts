import { test, expect } from "@playwright/test";

test("menu mobile navega para o Catálogo de Obras", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Catálogo de Obras" }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole("heading", { name: "Catálogo de Obras", level: 1 })).toBeVisible();
});

test("prefers-reduced-motion desliga rolagem suave e transições", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  expect(
    await page.evaluate(() => getComputedStyle(document.querySelector("a.link")!).transitionDuration),
  ).toBe("0s");
});
