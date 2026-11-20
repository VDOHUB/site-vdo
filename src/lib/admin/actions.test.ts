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

  it("o codigo do Adm nao importa o cliente de servico", () => {
    for (const f of ["actions.ts", "auth.ts"]) {
      const src = readFileSync(path.join(__dirname, f), "utf8");
      expect(src).not.toMatch(/supabase\/service|createServiceClient|SERVICE_ROLE/);
    }
  });
});
