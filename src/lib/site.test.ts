import { describe, it, expect, vi } from "vitest";
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

describe("SITE.social.facebook", () => {
  it("é null sem NEXT_PUBLIC_FACEBOOK_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_FACEBOOK_URL", "");
    vi.resetModules();
    const m = await import("./site");
    expect(m.SITE.social.facebook).toBeNull();
    vi.unstubAllEnvs();
  });
  it("usa NEXT_PUBLIC_FACEBOOK_URL quando definida", async () => {
    vi.stubEnv("NEXT_PUBLIC_FACEBOOK_URL", "https://facebook.com/vdo");
    vi.resetModules();
    const m = await import("./site");
    expect(m.SITE.social.facebook).toBe("https://facebook.com/vdo");
    vi.unstubAllEnvs();
  });
});
