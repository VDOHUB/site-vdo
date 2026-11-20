import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Call = [string, ...unknown[]];
let calls: Call[];
let result: { data: unknown; error: unknown };

function builder() {
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq", "in", "order", "maybeSingle"]) {
    b[m] = (...args: unknown[]) => {
      calls.push([m, ...args]);
      return b;
    };
  }
  b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    from: (t: string) => {
      calls.push(["from", t]);
      return builder();
    },
  }),
}));

import { getObra, listObras, photoUrl } from "./obras";

const OLD = process.env.NEXT_PUBLIC_SUPABASE_URL;
beforeEach(() => {
  calls = [];
  result = { data: [], error: null };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
});
afterEach(() => {
  if (OLD === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = OLD;
});

describe("listObras", () => {
  it("pede so publicadas, filtra e ordena por ordem", async () => {
    result = { data: [{ slug: "a" }], error: null };
    const r = await listObras({ status: ["pronta"], tipo: "residencial", destaque: true });
    expect(r).toEqual([{ slug: "a" }]);
    expect(calls).toContainEqual(["from", "obras"]);
    expect(calls).toContainEqual(["eq", "publicado", true]);
    expect(calls).toContainEqual(["in", "status", ["pronta"]]);
    expect(calls).toContainEqual(["eq", "tipo", "residencial"]);
    expect(calls).toContainEqual(["eq", "destaque", true]);
    expect(calls).toContainEqual(["order", "ordem", { ascending: true }]);
  });

  it("retorna [] sem NEXT_PUBLIC_SUPABASE_URL", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(await listObras({})).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("retorna [] e registra em erro", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    result = { data: null, error: { message: "x" } };
    expect(await listObras({})).toEqual([]);
    expect(spy).toHaveBeenCalledWith("[obras] listObras failed", { message: "x" });
    spy.mockRestore();
  });

  it("nao registra quando env ausente", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await listObras({});
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("getObra", () => {
  it("devolve fotos ordenadas por ordem", async () => {
    result = {
      data: { slug: "a", publicado: true, obra_fotos: [{ ordem: 2, path: "b" }, { ordem: 1, path: "a" }] },
      error: null,
    };
    const o = await getObra("a");
    expect(o?.fotos.map((f) => f.path)).toEqual(["a", "b"]);
    expect(o).not.toHaveProperty("obra_fotos");
    expect(calls).toContainEqual(["eq", "publicado", true]);
  });

  it("fotos: [] quando nao ha fotos", async () => {
    result = { data: { slug: "a", publicado: true, obra_fotos: null }, error: null };
    expect((await getObra("a"))?.fotos).toEqual([]);
  });

  it("registra erro, mas nao registra not-found nem nao publicada", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    result = { data: null, error: { message: "boom" } };
    expect(await getObra("a")).toBeNull();
    expect(spy).toHaveBeenCalledWith("[obras] getObra failed", { message: "boom" });
    spy.mockClear();
    result = { data: null, error: null };
    await getObra("a");
    result = { data: { slug: "a", publicado: false, obra_fotos: [] }, error: null };
    await getObra("a");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("null quando nao existe, nao publicada ou sem env", async () => {
    result = { data: null, error: null };
    expect(await getObra("x")).toBeNull();
    result = { data: { slug: "a", publicado: false, obra_fotos: [] }, error: null };
    expect(await getObra("a")).toBeNull();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(await getObra("a")).toBeNull();
  });
});

describe("photoUrl", () => {
  it("fotos seed vem da pasta estatica, com largura ajustada", () => {
    expect(photoUrl("dunas-douradas/3-1600.webp", 1600)).toBe("/obras/dunas-douradas/3-1600.webp");
    expect(photoUrl("dunas-douradas/3-1600.webp", 800)).toBe("/obras/dunas-douradas/3-800.webp");
    expect(photoUrl("dunas-douradas/3-1600.webp", 400)).toBe("/obras/dunas-douradas/3-800.webp");
    expect(photoUrl("dunas-douradas/3-800.avif", 1100)).toBe("/obras/dunas-douradas/3-800.webp");
    expect(photoUrl("dunas-douradas/3-800.avif", 1300)).toBe("/obras/dunas-douradas/3-1600.webp");
    expect(photoUrl("dunas-douradas/3-800.avif", 3000)).toBe("/obras/dunas-douradas/3-1600.webp");
  });

  it("uploads sem env caem para a pasta estatica", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(photoUrl("uploads/x/y.jpg", 800)).toBe("/obras/uploads/x/y.jpg");
  });

  it("neutraliza .. e barra inicial", () => {
    expect(photoUrl("../../etc/passwd", 800)).toBe("/obras/etc/passwd");
    expect(photoUrl("/uploads/../a/b.jpg", 800)).toBe("https://abc.supabase.co/storage/v1/object/public/obras/uploads/a/b.jpg");
    expect(photoUrl("a/../../dunas-douradas/3-1600.webp", 800)).toBe("/obras/a/dunas-douradas/3-800.webp");
  });

  it("uploads resolvem para o Storage publico, sem alteracao", () => {
    expect(photoUrl("uploads/x/y.jpg", 800)).toBe(
      "https://abc.supabase.co/storage/v1/object/public/obras/uploads/x/y.jpg",
    );
  });
});
