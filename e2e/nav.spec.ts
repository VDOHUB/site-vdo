import { test, expect } from "@playwright/test";

test("menu mobile navega para o Catálogo de Obras", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Catálogo de Obras" }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole("heading", { name: "Catálogo de Obras", level: 1 })).toBeVisible();
});
