// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ImovelCard } from "./ImovelCard";
import type { Obra } from "@/lib/types";

// TiltedCard depende de WebGL/IntersectionObserver, ausentes no jsdom.
vi.mock("@/components/reactbits/TiltedCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const base: Obra = {
  id: "1", slug: "casa-jardim", titulo: "Casa Jardim", descricao: "", local: "Anápolis",
  tipo: "residencial", status: "a_venda", progresso: null, preco: null, area: "180 m²",
  quartos: 3, vagas: 2, ordem: 0, destaque: false, destaque_ordem: null, publicado: true, created_at: "",
};

afterEach(cleanup);

describe("ImovelCard", () => {
  it("à venda: ficha, Sob consulta e botão WhatsApp", () => {
    render(<ImovelCard obra={base} />);
    expect(screen.getByText("Sob consulta")).toBeTruthy();
    expect(screen.getByText("180 m²")).toBeTruthy();
    expect(screen.getByText("3 quartos")).toBeTruthy();
    expect(screen.getByText("2 vagas")).toBeTruthy();
    const btn = screen.getByRole("link", { name: /WhatsApp/ });
    expect(btn.getAttribute("href")).toContain(encodeURIComponent("Olá, tenho interesse no imóvel Casa Jardim"));
  });
  it("vendido: faixa Vendido e nenhum botão de contato", () => {
    render(<ImovelCard obra={{ ...base, status: "vendido", preco: "R$ 900 mil" }} />);
    expect(screen.getAllByText("Vendido").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  });
});
