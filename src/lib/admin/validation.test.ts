import { describe, expect, it } from "vitest";
import {
  OBRA_LIMITS,
  isUuid,
  parseLeadStatus,
  permuteOrdem,
  slugify,
  uniqueSlug,
  validateObraInput,
  validateRecursoInput,
} from "./validation";

const base = {
  titulo: "Casa Jardim",
  tipo: "residencial",
  status: "pronta",
  local: "Anápolis, GO",
  descricao: "Obra entregue.",
  preco: "",
  area: "",
  quartos: "",
  vagas: "",
  progresso: "",
  publicado: "on",
};

describe("slugify", () => {
  it("remove acentos, caixa e simbolos", () => {
    expect(slugify("Agência Bússola")).toBe("agencia-bussola");
    expect(slugify("  Montpellier · AP802 / AP402  ")).toBe("montpellier-ap802-ap402");
    expect(slugify("Teste E2E")).toBe("teste-e2e");
  });
  it("neutraliza tentativa de XSS/traversal", () => {
    expect(slugify('<script>alert("x")</script>')).toBe("script-alert-x-script");
    expect(slugify("../../etc/passwd")).toBe("etc-passwd");
  });
  it("vazio vira 'obra' e e limitado a 80 caracteres sem hifen no fim", () => {
    expect(slugify("!!!")).toBe("obra");
    expect(slugify("")).toBe("obra");
    const s = slugify("a".repeat(79) + " bcd");
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe("uniqueSlug", () => {
  it("usa o base se livre e sufixa -2, -3 se ocupado", () => {
    expect(uniqueSlug("casa", [])).toBe("casa");
    expect(uniqueSlug("casa", ["casa"])).toBe("casa-2");
    expect(uniqueSlug("casa", ["casa", "casa-2", "casa-3"])).toBe("casa-4");
  });
});

describe("isUuid", () => {
  it("aceita uuid e rejeita o resto", () => {
    expect(isUuid("0b7c6f1e-3a2b-4c1d-9e8f-1234567890ab")).toBe(true);
    expect(isUuid("0B7C6F1E-3A2B-4C1D-9E8F-1234567890AB")).toBe(true);
    expect(isUuid("1 or 1=1")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid(42)).toBe(false);
  });
});

describe("parseLeadStatus", () => {
  it("so aceita nova, lida, arquivada", () => {
    expect(parseLeadStatus("lida")).toBe("lida");
    expect(parseLeadStatus("nova")).toBe("nova");
    expect(parseLeadStatus("arquivada")).toBe("arquivada");
    expect(parseLeadStatus("apagada")).toBeNull();
    expect(parseLeadStatus(null)).toBeNull();
  });
});

describe("validateObraInput", () => {
  it("aceita uma obra valida e normaliza vazios para null", () => {
    const v = validateObraInput(base);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.data).toEqual({
      titulo: "Casa Jardim",
      tipo: "residencial",
      status: "pronta",
      local: "Anápolis, GO",
      descricao: "Obra entregue.",
      preco: null,
      area: null,
      quartos: null,
      vagas: null,
      progresso: null,
      publicado: true,
    });
  });

  it("titulo vazio", () => {
    const v = validateObraInput({ ...base, titulo: "   " });
    expect(v).toEqual({ ok: false, errors: { titulo: "Informe o título." } });
  });

  it("status e tipo fora da lista", () => {
    const v = validateObraInput({ ...base, status: "demolida", tipo: "industrial" });
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.errors.status).toBe("Escolha um status válido.");
    expect(v.errors.tipo).toBe("Escolha um tipo válido.");
  });

  it("progresso 101, -1 e nao inteiro", () => {
    for (const progresso of ["101", "-1", "50.5", "abc"]) {
      const v = validateObraInput({ ...base, status: "em_andamento", progresso });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(v.errors.progresso).toBe("O progresso vai de 0 a 100.");
    }
    const ok = validateObraInput({ ...base, status: "em_andamento", progresso: "100" });
    expect(ok.ok && ok.data.progresso).toBe(100);
  });

  it("quartos/vagas negativos ou enormes", () => {
    const v = validateObraInput({ ...base, quartos: "-2", vagas: "1000" });
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.errors.quartos).toBe("Informe um número inteiro de 0 a 99.");
    expect(v.errors.vagas).toBe("Informe um número inteiro de 0 a 99.");
    const ok = validateObraInput({ ...base, status: "a_venda", quartos: "3", vagas: "0", preco: "R$ 450.000", area: "120 m²" });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.data).toMatchObject({ quartos: 3, vagas: 0, preco: "R$ 450.000", area: "120 m²" });
  });

  it("texto com cara de XSS e guardado literalmente (o React escapa na saida)", () => {
    const xss = '<img src=x onerror="alert(1)">';
    const v = validateObraInput({ ...base, titulo: xss, descricao: xss });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.data.titulo).toBe(xss);
      expect(v.data.descricao).toBe(xss);
    }
  });

  it("limites de tamanho", () => {
    const v = validateObraInput({
      ...base,
      titulo: "x".repeat(OBRA_LIMITS.titulo + 1),
      descricao: "x".repeat(OBRA_LIMITS.descricao + 1),
      local: "x".repeat(OBRA_LIMITS.local + 1),
      preco: "x".repeat(OBRA_LIMITS.preco + 1),
      area: "x".repeat(OBRA_LIMITS.area + 1),
    });
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(Object.keys(v.errors).sort()).toEqual(["area", "descricao", "local", "preco", "titulo"]);
    expect(v.errors.titulo).toBe(`O título pode ter no máximo ${OBRA_LIMITS.titulo} caracteres.`);
    const okLen = validateObraInput({ ...base, titulo: "x".repeat(OBRA_LIMITS.titulo) });
    expect(okLen.ok).toBe(true);
  });

  it("publicado so e true com o checkbox marcado; campos estranhos sao ignorados", () => {
    const off = validateObraInput({ ...base, publicado: undefined, role: "admin", slug: "../x", id: "x" });
    expect(off.ok).toBe(true);
    if (!off.ok) return;
    expect(off.data.publicado).toBe(false);
    expect(Object.keys(off.data)).not.toContain("role");
    expect(Object.keys(off.data)).not.toContain("slug");
    const weird = validateObraInput({ ...base, publicado: "true; drop table" });
    expect(weird.ok && weird.data.publicado).toBe(false);
  });

  it("entrada nao-string (File, numero) conta como vazia", () => {
    const v = validateObraInput({ ...base, titulo: 123 as unknown as string });
    expect(v.ok).toBe(false);
  });
});

describe("validateRecursoInput", () => {
  const r = { titulo: "Gerador de Contratos", descricao: "Modelos.", url: "https://contratos.exemplo.com", tipo: "link", ordem: "1" };

  it("aceita recurso valido", () => {
    expect(validateRecursoInput(r)).toEqual({
      ok: true,
      data: { titulo: "Gerador de Contratos", descricao: "Modelos.", url: "https://contratos.exemplo.com", tipo: "link", ordem: 1 },
    });
  });

  it("url so http(s); vazia vira null", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,x", "ftp://x", "//evil.com", "https://"]) {
      const v = validateRecursoInput({ ...r, url });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(v.errors.url).toBe("Use um endereço que comece com http:// ou https://.");
    }
    const empty = validateRecursoInput({ ...r, url: "", tipo: "instrucoes" });
    expect(empty.ok && empty.data.url).toBeNull();
  });

  it("tipo fora da lista e titulo vazio", () => {
    const v = validateRecursoInput({ ...r, tipo: "script", titulo: "" });
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.errors.tipo).toBe("Escolha um tipo válido.");
    expect(v.errors.titulo).toBe("Informe o título.");
  });
});

describe("permuteOrdem", () => {
  const A = "aaaaaaaa-0000-4000-8000-000000000001";
  const B = "bbbbbbbb-0000-4000-8000-000000000002";
  const C = "cccccccc-0000-4000-8000-000000000003";

  it("reusa os slots de ordem que as obras escolhidas ja ocupam, na nova ordem", () => {
    // catalogo: X=1, A=2, Y=3, B=5, C=8 (X e Y nao sao destaque e nao entram)
    const current = new Map([[A, 2], [B, 5], [C, 8]]);
    expect(permuteOrdem(current, [C, A, B])).toEqual([
      { id: C, ordem: 2 },
      { id: A, ordem: 5 },
      { id: B, ordem: 8 },
    ]);
  });

  it("preserva o conjunto de valores e nao cria duplicatas", () => {
    const current = new Map([[A, 7], [B, 3], [C, 4]]);
    const out = permuteOrdem(current, [B, C, A])!;
    expect(out.map((u) => u.ordem).sort((x, y) => x - y)).toEqual([3, 4, 7]);
    expect(new Set(out.map((u) => u.ordem)).size).toBe(3);
    expect(out.map((u) => u.id)).toEqual([B, C, A]);
  });

  it("so devolve as obras escolhidas (as demais nao mudam)", () => {
    const current = new Map([[A, 1], [B, 2]]);
    expect(permuteOrdem(current, [B])!.map((u) => u.id)).toEqual([B]);
  });

  it("selecao vazia e de um elemento", () => {
    expect(permuteOrdem(new Map(), [])).toEqual([]);
    expect(permuteOrdem(new Map([[A, 9]]), [A])).toEqual([{ id: A, ordem: 9 }]);
  });

  it("rejeita ids duplicados ou sem ordem atual", () => {
    expect(permuteOrdem(new Map([[A, 1]]), [A, A])).toBeNull();
    expect(permuteOrdem(new Map([[A, 1]]), [A, B])).toBeNull();
  });
});
