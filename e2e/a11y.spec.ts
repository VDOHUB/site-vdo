import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Zero violações sérias/críticas (WCAG 2 A/AA) nas telas principais.
const PAGES = [
  { name: "Home", path: "/" },
  { name: "Home com movimento (vídeo ligado)", path: "/", motion: true },
  { name: "Catálogo", path: "/catalogo" },
  { name: "Imóveis", path: "/imoveis" },
  { name: "Contato", path: "/contato" },
  { name: "Login do Adm", path: "/admin/login" },
];

for (const p of PAGES) {
  test(`axe: ${p.name} sem violações sérias`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: p.motion ? "no-preference" : "reduce" });
    await page.goto(p.path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(" ")) })),
    ).toEqual([]);
  });
}
