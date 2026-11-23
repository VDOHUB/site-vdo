// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Hero } from "./Hero";

afterEach(cleanup);

describe("Hero", () => {
  it("é imagem estática: sem vídeo e com a imagem dos sócios como LCP", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector("video")).toBeNull();
    const img = container.querySelector("img.hero-img")!;
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.getAttribute("alt")).toBe("Os dois sócios da Viver de Obra em uma obra");
    expect(img.getAttribute("width")).toBe("1400");
    const types = [...container.querySelectorAll("picture source")].map((s) => s.getAttribute("type"));
    expect(types).toEqual(["image/avif", "image/webp"]);
  });

  it("expõe o h1 com o texto completo de forma acessível", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1, name: "Obra sem dor de cabeça." })).toBeTruthy();
  });

  it("tem as chamadas para o catálogo e orçamento", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /Ver Catálogo de Obras/ }).getAttribute("href")).toBe("/catalogo");
    expect(screen.getByRole("link", { name: /Pedir orçamento/ }).getAttribute("href")).toBe("/contato");
  });
});
