import { describe, expect, it } from "vitest";
import { clampProgress, imovelContactHref, imovelPreco } from "./obra-view";
import { SITE } from "./site";

describe("clampProgress", () => {
  it("limita a 0-100, arredonda e esconde quando nulo", () => {
    expect(clampProgress(null)).toBeNull();
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(140)).toBe(100);
    expect(clampProgress(42.6)).toBe(43);
  });
});

describe("imóvel", () => {
  it("preço ou Sob consulta", () => {
    expect(imovelPreco("R$ 1.200.000")).toBe("R$ 1.200.000");
    expect(imovelPreco(null)).toBe("Sob consulta");
  });
  it("link de WhatsApp só para imóvel à venda", () => {
    const href = imovelContactHref({ status: "a_venda", titulo: "Casa Jardim" });
    expect(href).toBe(SITE.whatsappUrl("Olá, tenho interesse no imóvel Casa Jardim"));
    expect(href).toContain(encodeURIComponent("Olá, tenho interesse no imóvel Casa Jardim"));
    for (const status of ["vendido", "em_andamento", "pronta"] as const) {
      expect(imovelContactHref({ status, titulo: "Casa" })).toBeNull();
    }
  });
});
