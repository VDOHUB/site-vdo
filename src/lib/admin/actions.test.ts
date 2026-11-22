import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Toda Server Action do Adm e um endpoint POST publico: cada uma precisa chamar
// requireAdmin() ANTES de qualquer acesso ao banco. Aqui requireAdmin nega (lanca) e
// o teste garante que nenhuma action chega ao Supabase.
const DENIED = new Error("NEGADO");
const requireAdmin = vi.fn();
const createServerClient = vi.fn();
const revalidatePath = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/lib/supabase/server", () => ({ createServerClient, isAdmin: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn(() => { throw new Error("service client proibido no Adm"); }) }));
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }) }));

const UUID = "0b7c6f1e-3a2b-4c1d-9e8f-1234567890ab";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

/** Argumentos plausiveis por action (validos, para provar que o bloqueio vem antes da validacao). */
const ARGS: Record<string, unknown[]> = {
  saveObra: [fd({ titulo: "X", tipo: "residencial", status: "pronta", publicado: "on" })],
  deleteObra: [UUID],
  togglePublicado: [UUID, true],
  addFoto: [UUID, `uploads/${UUID}/${UUID}.webp`],
  deleteFoto: [UUID],
  reorderFotos: [UUID, [UUID]],
  setLeadStatus: [UUID, "lida"],
  saveRecurso: [fd({ titulo: "X", tipo: "link", url: "https://x.example" })],
  deleteRecurso: [UUID],
  saveDestaques: [[UUID]],
};

describe("Server Actions do Adm", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    createServerClient.mockReset();
    revalidatePath.mockReset();
    requireAdmin.mockRejectedValue(DENIED);
  });

  it("toda action exportada tem argumentos de teste", async () => {
    const mod = await import("./actions");
    const names = Object.keys(mod).filter((k) => typeof (mod as Record<string, unknown>)[k] === "function");
    expect(names.sort()).toEqual(Object.keys(ARGS).sort());
  });

  it.each(Object.keys(ARGS))("%s chama requireAdmin primeiro e nao toca no banco quando negado", async (name) => {
    const mod = (await import("./actions")) as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
    await expect(mod[name](...ARGS[name])).rejects.toBe(DENIED);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(createServerClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each(Object.keys(ARGS))("%s com argumentos INVALIDOS tambem para no requireAdmin (guard antes da validacao)", async (name) => {
    const mod = (await import("./actions")) as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
    const bad = ARGS[name].map((a) => (a instanceof FormData ? new FormData() : Array.isArray(a) ? ["nao-e-uuid"] : typeof a === "string" ? "1 or 1=1" : a));
    await expect(mod[name](...bad)).rejects.toBe(DENIED);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(createServerClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("com admin, dados invalidos nao chegam ao banco", async () => {
    const from = vi.fn();
    requireAdmin.mockResolvedValue({ supabase: { from, storage: { from } }, userId: UUID });
    const mod = await import("./actions");
    expect(await mod.saveObra(fd({ titulo: "", tipo: "x", status: "y" }))).toMatchObject({ ok: false });
    expect(await mod.saveObra(fd({ id: "1 or 1=1", titulo: "X", tipo: "residencial", status: "pronta" }))).toMatchObject({ ok: false });
    expect(await mod.setLeadStatus(UUID, "apagada")).toMatchObject({ ok: false });
    expect(await mod.setLeadStatus("nao-e-uuid", "lida")).toMatchObject({ ok: false });
    expect(await mod.deleteObra("../../x")).toMatchObject({ ok: false });
    expect(await mod.reorderFotos(UUID, ["x"])).toMatchObject({ ok: false });
    expect(await mod.reorderFotos(UUID, [UUID, UUID])).toMatchObject({ ok: false });
    expect(await mod.addFoto(UUID, `uploads/${UUID}/../../segredo.webp`)).toMatchObject({ ok: false });
    expect(await mod.addFoto(UUID, `outra/${UUID}.webp`)).toMatchObject({ ok: false });
    expect(await mod.saveRecurso(fd({ titulo: "X", tipo: "link", url: "javascript:alert(1)" }))).toMatchObject({ ok: false });
    expect(await mod.saveDestaques(["x"])).toMatchObject({ ok: false });
    expect(await mod.togglePublicado(UUID, "sim" as unknown as boolean)).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  describe("com admin (Supabase falso)", () => {
    type Op = [string, ...unknown[]];
    type Query = { table: string; ops: Op[] };
    let queries: Query[];
    let storageCalls: string[];

    /** Builder encadeavel: grava as chamadas e resolve com `respond(query)` ao ser aguardado. */
    function fake(respond: (q: Query) => { data?: unknown; error?: unknown }) {
      queries = [];
      storageCalls = [];
      const from = (table: string) => {
        const q: Query = { table, ops: [] };
        queries.push(q);
        const b: Record<string, unknown> = {};
        for (const m of ["select", "eq", "in", "like", "order", "limit", "update", "insert", "delete", "maybeSingle", "single"]) {
          b[m] = (...args: unknown[]) => {
            q.ops.push([m, ...args]);
            return b;
          };
        }
        b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null, ...respond(q) }).then(res, rej);
        return b;
      };
      const storage = {
        from: () => ({
          list: async () => {
            storageCalls.push("list");
            return { data: [], error: null };
          },
          remove: async () => {
            storageCalls.push("remove");
            return { data: [], error: null };
          },
        }),
      };
      requireAdmin.mockResolvedValue({ supabase: { from, storage }, userId: UUID });
    }
    const has = (q: Query, m: string) => q.ops.some((o) => o[0] === m);

    it("addFoto recusa caminho ja registrado (sem inserir nem mexer no Storage)", async () => {
      const path = `uploads/${UUID}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.webp`;
      fake((q) => {
        if (q.table === "obras") return { data: { titulo: "Casa", slug: "casa" } };
        if (q.table === "obra_fotos" && q.ops.some((o) => o[0] === "eq" && o[1] === "path")) return { data: { id: UUID } };
        return {};
      });
      const mod = await import("./actions");
      expect(await mod.addFoto(UUID, path)).toEqual({ ok: false, error: "Esta foto já foi adicionada." });
      expect(queries.some((q) => has(q, "insert"))).toBe(false);
      expect(storageCalls).toEqual([]);
    });

    const A = "aaaaaaaa-0000-4000-8000-000000000001";
    const B = "bbbbbbbb-0000-4000-8000-000000000002";
    const OLD = "dddddddd-0000-4000-8000-000000000004";
    const updatesOf = () =>
      queries.filter((q) => has(q, "update")).map((q) => ({
        set: q.ops.find((o) => o[0] === "update")![1],
        where: q.ops.filter((o) => o[0] === "eq" || o[0] === "in").map((o) => o.slice(1)),
      }));

    it("saveDestaques grava destaque_ordem 1..n na ordem escolhida, limpa os removidos e nao toca em ordem", async () => {
      fake((q) => {
        if (q.table !== "obras" || !has(q, "select") || has(q, "update")) return {};
        if (has(q, "in")) return { data: [{ id: A }, { id: B }] }; // escolhidas existem
        return { data: [{ id: A }, { id: OLD }] }; // destaques atuais
      });
      const mod = await import("./actions");
      expect(await mod.saveDestaques([B, A])).toEqual({ ok: true });
      const updates = updatesOf();
      expect(updates).toContainEqual({ set: { destaque: false, destaque_ordem: null }, where: [["id", [OLD]]] });
      expect(updates).toContainEqual({ set: { destaque: true, destaque_ordem: 1 }, where: [["id", B]] });
      expect(updates).toContainEqual({ set: { destaque: true, destaque_ordem: 2 }, where: [["id", A]] });
      expect(updates).toHaveLength(3);
      expect(updates.some((u) => "ordem" in (u.set as object))).toBe(false);
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });

    it("saveDestaques([]) tira todos os destaques", async () => {
      fake((q) => (q.table === "obras" && has(q, "select") && !has(q, "update") ? { data: [{ id: A }, { id: OLD }] } : {}));
      const mod = await import("./actions");
      expect(await mod.saveDestaques([])).toEqual({ ok: true });
      expect(updatesOf()).toEqual([{ set: { destaque: false, destaque_ordem: null }, where: [["id", [A, OLD]]] }]);
    });

    it("saveDestaques falha se alguma obra escolhida nao existe", async () => {
      fake(() => ({ data: [] }));
      const mod = await import("./actions");
      expect(await mod.saveDestaques([A])).toMatchObject({ ok: false });
      expect(queries.some((q) => has(q, "update"))).toBe(false);
    });

    it("saveObra ao criar usa ordem = maior ordem + 1 (obras novas nao empatam em 0)", async () => {
      fake((q) => {
        if (q.table !== "obras") return {};
        if (has(q, "insert")) return { data: { id: UUID } };
        if (has(q, "like")) return { data: [] };
        return { data: { ordem: 7 } }; // maior ordem atual
      });
      const mod = await import("./actions");
      await expect(mod.saveObra(fd({ titulo: "Casa Nova", tipo: "residencial", status: "pronta" }))).rejects.toThrow("NEXT_REDIRECT");
      const ins = queries.find((q) => has(q, "insert"))!.ops.find((o) => o[0] === "insert")![1] as { ordem: number; slug: string };
      expect(ins.ordem).toBe(8);
      expect(ins.slug).toBe("casa-nova");
    });

    it("saveObra ao editar nao envia ordem", async () => {
      fake((q) => (has(q, "update") ? { data: { id: UUID, slug: "casa" } } : {}));
      const mod = await import("./actions");
      expect(await mod.saveObra(fd({ id: UUID, titulo: "Casa", tipo: "residencial", status: "pronta" }))).toEqual({ ok: true, id: UUID });
      const upd = queries.find((q) => has(q, "update"))!.ops.find((o) => o[0] === "update")![1] as object;
      expect("ordem" in upd).toBe(false);
    });
  });

  it("o codigo do Adm nao importa o cliente de servico", () => {
    for (const f of ["actions.ts", "auth.ts"]) {
      const src = readFileSync(path.join(__dirname, f), "utf8");
      expect(src).not.toMatch(/supabase\/service|createServiceClient|SERVICE_ROLE/);
    }
  });
});
