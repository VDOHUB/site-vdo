import { describe, it, expect } from "vitest";
import { SITE, NAV } from "./site";

describe("SITE", () => {
  it("monta a URL do WhatsApp com mensagem codificada", () => {
    expect(SITE.whatsappUrl("Olá")).toBe(
      "https://api.whatsapp.com/send?phone=5562992445881&text=Ol%C3%A1",
    );
  });
  it("monta a URL do WhatsApp sem mensagem", () => {
    expect(SITE.whatsappUrl()).toBe("https://api.whatsapp.com/send?phone=5562992445881");
  });
});

describe("NAV", () => {
  it("tem exatamente os rótulos esperados", () => {
    expect(NAV.map((n) => n.label)).toEqual([
      "Catálogo de Obras",
      "Em andamento",
      "Imóveis à venda",
      "Sobre",
      "Contato",
    ]);
  });
});
