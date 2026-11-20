import { beforeEach, describe, expect, it, vi } from "vitest";

const order: string[] = [];
let insertResult: { data: unknown; error: unknown };
let insertedRows: unknown[];
let emailImpl: () => Promise<void>;
const sendLeadEmail = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (t: string) => ({
      insert: (row: unknown) => {
        order.push("db:" + t);
        insertedRows.push(row);
        return { select: () => ({ single: async () => insertResult }) };
      },
    }),
  }),
}));
vi.mock("@/lib/leads-email", async (orig) => {
  const real = await orig<typeof import("@/lib/leads-email")>();
  return {
    ...real,
    sendLeadEmail: (...a: unknown[]) => {
      order.push("email");
      sendLeadEmail(...a);
      return emailImpl();
    },
  };
});

import { validateLead } from "./leads";
import { buildLeadEmail } from "./leads-email";
import { submitLead } from "@/app/contato/actions";

const valid = {
  topico: "Orçamento",
  nome: "Maria",
  whatsapp: "(62) 99244-5881",
  mensagem: "Quero reformar",
};

function fd(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}

beforeEach(() => {
  order.length = 0;
  insertedRows = [];
  sendLeadEmail.mockClear();
  insertResult = { data: { id: "abc" }, error: null };
  emailImpl = async () => {};
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("validateLead", () => {
  it("aceita entrada valida e normaliza", () => {
    const r = validateLead({ ...valid, nome: "  Maria  " });
    expect(r).toEqual({
      ok: true,
      data: { topico: "Orçamento", nome: "Maria", whatsapp: "62992445881", mensagem: "Quero reformar", website: "" },
    });
  });
  it("topico invalido", () => {
    const r = validateLead({ ...valid, topico: "Outro" });
    expect(r.ok === false && r.errors.topico).toBeTruthy();
  });
  it("nome e mensagem obrigatorios (so espacos conta como vazio)", () => {
    const r = validateLead({ ...valid, nome: "  ", mensagem: "" });
    expect(r.ok === false && Object.keys(r.errors).sort()).toEqual(["mensagem", "nome"]);
  });
  it("limites do banco", () => {
    expect(validateLead({ ...valid, nome: "a".repeat(121) }).ok).toBe(false);
    expect(validateLead({ ...valid, mensagem: "a".repeat(5001) }).ok).toBe(false);
    expect(validateLead({ ...valid, nome: "a".repeat(120), mensagem: "a".repeat(5000) }).ok).toBe(true);
  });
  it.each([
    ["6299244588", true],
    ["62992445881", true],
    ["629924458", false],
    ["629924458812", false],
    ["(62) 9924-4588", true],
    ["", false],
    ["+55 62 99244-5881", true],
    ["+55 (62) 9924-4588", true],
    ["55 62 99244-5881 1", false],
  ])("whatsapp %s -> %s", (w, ok) => {
    const r = validateLead({ ...valid, whatsapp: w });
    expect(r.ok).toBe(ok);
    if (!ok && !r.ok) expect(r.errors.whatsapp).toBeTruthy();
  });
  it("entrada nao objeto", () => {
    expect(validateLead(null).ok).toBe(false);
    expect(validateLead("x").ok).toBe(false);
  });
  it("honeypot preenchido retorna ok silencioso", () => {
    const r = validateLead({ nome: "", website: "http://spam" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.data.website).toBe("http://spam");
  });
});

describe("submitLead", () => {
  it("grava no banco ANTES do e-mail e retorna ok", async () => {
    const r = await submitLead({ status: "idle" }, fd(valid));
    expect(r).toEqual({ status: "ok" });
    expect(order).toEqual(["db:leads", "email"]);
    expect(insertedRows[0]).toEqual({
      topico: "Orçamento",
      nome: "Maria",
      whatsapp: "62992445881",
      mensagem: "Quero reformar",
      status: "nova",
    });
  });
  it("falha no e-mail nao muda o resultado e nao vaza conteudo no log", async () => {
    emailImpl = async () => {
      throw new Error("boom Quero reformar");
    };
    const r = await submitLead({ status: "idle" }, fd(valid));
    expect(r).toEqual({ status: "ok" });
    expect(console.error).toHaveBeenCalled();
    const logged = JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls);
    expect(logged).not.toContain("Maria");
    expect(logged).not.toContain("Quero reformar");
  });
  it("fetch abortado/timeout no e-mail e engolido, logado so com o id", async () => {
    emailImpl = async () => {
      throw new DOMException("The operation timed out", "TimeoutError");
    };
    const r = await submitLead({ status: "idle" }, fd(valid));
    expect(r).toEqual({ status: "ok" });
    const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
    expect(JSON.stringify(calls)).toContain("abc");
    expect(JSON.stringify(calls)).not.toContain("Maria");
  });
  it("erro de validacao devolve os valores digitados", async () => {
    const r = await submitLead({ status: "idle" }, fd({ ...valid, nome: "", topico: "Dúvidas" }));
    expect(r.values).toEqual({ topico: "Dúvidas", nome: "", whatsapp: "(62) 99244-5881", mensagem: "Quero reformar" });
  });
  it("falha no banco retorna erro generico e nao envia e-mail", async () => {
    insertResult = { data: null, error: { message: "secret detail" } };
    const r = await submitLead({ status: "idle" }, fd(valid));
    expect(r.status).toBe("error");
    expect(r.errors?.form).toBeTruthy();
    expect(JSON.stringify(r)).not.toContain("secret");
    expect(order).toEqual(["db:leads"]);
  });
  it("invalido retorna erros por campo sem tocar no banco", async () => {
    const r = await submitLead({ status: "idle" }, fd({ ...valid, nome: "" }));
    expect(r.status).toBe("error");
    expect(r.errors?.nome).toBeTruthy();
    expect(order).toEqual([]);
  });
  it("honeypot: ok silencioso sem banco nem e-mail", async () => {
    const r = await submitLead({ status: "idle" }, fd({ ...valid, website: "x" }));
    expect(r).toEqual({ status: "ok" });
    expect(order).toEqual([]);
  });
});

describe("buildLeadEmail", () => {
  it("escapa HTML do usuario", () => {
    const m = buildLeadEmail({
      topico: "Dúvidas",
      nome: "<script>alert(1)</script>",
      whatsapp: "62992445881",
      mensagem: "a <b>&\"'</b>\r\nBcc: x@y",
    });
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("&lt;script&gt;");
    expect(m.html).not.toContain("<b>&");
    expect(m.subject).not.toContain("script");
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});
