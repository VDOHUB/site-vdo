import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: async () => {} }));
const listObras = vi.fn();
vi.mock("@/lib/obras", () => ({ listObras: (...a: unknown[]) => listObras(...a) }));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://viverdeobra.com");
  listObras.mockReset();
});

describe("sitemap", () => {
  it("lista páginas públicas e obras publicadas, sem /admin", async () => {
    listObras.mockResolvedValue([
      { slug: "dunas-douradas", created_at: "2026-01-02T00:00:00Z" },
      { slug: "agencia-bussola", created_at: "2026-01-03T00:00:00Z" },
    ]);
    const sitemap = (await import("./sitemap")).default;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://viverdeobra.com",
        "https://viverdeobra.com/catalogo",
        "https://viverdeobra.com/andamento",
        "https://viverdeobra.com/imoveis",
        "https://viverdeobra.com/sobre",
        "https://viverdeobra.com/contato",
        "https://viverdeobra.com/catalogo/dunas-douradas",
        "https://viverdeobra.com/catalogo/agencia-bussola",
      ]),
    );
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
  });

  it("consulta todas as obras publicadas (qualquer status tem página)", async () => {
    listObras.mockResolvedValue([]);
    const sitemap = (await import("./sitemap")).default;
    await sitemap();
    expect(listObras).toHaveBeenCalledWith();
  });

  it("sem banco ou com erro devolve só as páginas estáticas", async () => {
    listObras.mockRejectedValue(new Error("sem db"));
    const sitemap = (await import("./sitemap")).default;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toHaveLength(6);
  });
});
