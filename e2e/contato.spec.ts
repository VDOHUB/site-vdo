import { test, expect } from "@playwright/test";

// Aguarda a hidratacao: o formulario so usa a Server Action depois dela.
async function ready(page: import("@playwright/test").Page) {
  await page.goto("/contato");
  await expect(page.getByRole("heading", { name: "Fale com a gente.", level: 1 })).toBeVisible({ timeout: 30_000 });
}

test("envio vazio mostra erros por campo", async ({ page }) => {
  await ready(page);
  const send = page.getByRole("button", { name: "Enviar" });
  await expect(async () => {
    await send.click();
    await expect(page.locator("#err-nome")).toBeVisible({ timeout: 1500 });
  }).toPass();
  await expect(page.locator("#err-nome")).toHaveText("Informe seu nome.");
  await expect(page.locator("#err-whatsapp")).toBeVisible();
  await expect(page.locator("#err-mensagem")).toBeVisible();
  const nome = page.getByLabel("Nome");
  await expect(nome).toHaveAttribute("aria-invalid", "true");
  await expect(nome).toHaveAttribute("aria-describedby", "err-nome");
});

test("envio valido sem banco configurado mostra erro generico", async ({ page }) => {
  await ready(page);
  await page.getByLabel("Nome").fill("Maria Teste");
  await page.getByLabel("WhatsApp").fill("(62) 99244-5881");
  await page.getByLabel("Mensagem").fill("Quero um orçamento de reforma.");
  const send = page.getByRole("button", { name: "Enviar" });
  await expect(async () => {
    await send.click();
    await expect(page.locator(".form-error")).toBeVisible({ timeout: 3000 });
  }).toPass();
  await expect(page.locator(".form-error")).toContainText("Não foi possível enviar agora");
  await expect(page.getByText("Enviado com sucesso")).toHaveCount(0);
});

test("assuntos formam um radiogroup operavel por teclado", async ({ page }) => {
  await ready(page);
  const group = page.getByRole("radiogroup", { name: "Assunto" });
  await expect(group.getByRole("radio")).toHaveCount(3);
  const orc = group.getByRole("radio", { name: "Orçamento" });
  await expect(orc).toBeChecked();
  await orc.focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "Dúvidas" })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "Sugestões" })).toBeChecked();
});

test("honeypot fica fora do foco e da tela", async ({ page }) => {
  await ready(page);
  const hp = page.locator('input[name="website"]');
  await expect(hp).toHaveAttribute("tabindex", "-1");
  await expect(page.getByRole("textbox", { name: /Não preencha/ })).toHaveCount(0);
});

test("sobre mostra titulo, valores e servicos", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { name: "Engenharia que cuida do cliente do começo ao fim.", level: 1 })).toBeVisible();
  for (const t of ["Honestidade", "Transparência", "Compromisso", "Execução de obras", "Reformas", "Impermeabilização"]) {
    await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/a definir/i)).toHaveCount(0);
});
