// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Hero } from "./Hero";

afterEach(cleanup);

describe("Hero", () => {
  it("é slideshow de fotos das obras: sem vídeo, 1º slide como LCP com prioridade alta", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector("video")).toBeNull();
    const img = container.querySelector(".hero-slide.is-first img")!;
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.getAttribute("src")).toMatch(/\/obras\/dunas-douradas\/14-1600\.webp$/);
    expect(container.querySelector(".hero-scrim")).not.toBeNull();
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
