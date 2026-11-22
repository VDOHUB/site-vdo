// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Hero, VIDEO_START_DELAY_MS } from "./Hero";

function mockMatchMedia(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  // jsdom não implementa IntersectionObserver.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "connection");
});

describe("Hero", () => {
  it("renderiza o vídeo mudo, em loop, inline, com poster e fontes MP4 e WebM", async () => {
    mockMatchMedia(false);
    const { container } = render(<Hero />);
    // O vídeo só entra depois do load + ocioso + atraso: no início há só o poster.
    expect(container.querySelector("video")).toBeNull();
    await waitFor(() => expect(container.querySelector("video")).not.toBeNull(), { timeout: 6000 });
    const video = container.querySelector("video")!;
    expect(video!.muted).toBe(true);
    expect(video!.loop).toBe(true);
    expect(video!.autoplay).toBe(true);
    expect(video!.hasAttribute("playsinline")).toBe(true);
    expect(video!.getAttribute("preload")).toBe("none");
    expect(video!.getAttribute("poster")).toBe("/hero/hero-poster.webp");
    const types = [...video!.querySelectorAll("source")].map((s) => s.getAttribute("type"));
    expect(types).toContain("video/mp4");
    expect(types).toContain("video/webm");
    // A fonte mobile (720p) vem primeiro, com media query.
    const first = video!.querySelector("source")!;
    expect(first.getAttribute("src")).toBe("/hero/hero-720.mp4");
    expect(first.getAttribute("media")).toBe("(max-width: 768px)");
  });

  it("com prefers-reduced-motion: reduce não renderiza vídeo, só o poster", async () => {
    mockMatchMedia(true);
    const { container } = render(<Hero />);
    await new Promise((r) => setTimeout(r, VIDEO_START_DELAY_MS + 300));
    expect(container.querySelector("video")).toBeNull();
    const poster = container.querySelector('img[src*="hero-poster"]');
    expect(poster).not.toBeNull();
  });

  it("com economia de dados (saveData) não renderiza vídeo", async () => {
    mockMatchMedia(false);
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    });
    const { container } = render(<Hero />);
    await new Promise((r) => setTimeout(r, VIDEO_START_DELAY_MS + 300));
    expect(container.querySelector("video")).toBeNull();
  });

  it("expõe o h1 com o texto completo de forma acessível", () => {
    mockMatchMedia(false);
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1, name: "Obra sem dor de cabeça." })).toBeTruthy();
  });

  it("tem as chamadas para o catálogo e orçamento", () => {
    mockMatchMedia(false);
    render(<Hero />);
    expect(screen.getByRole("link", { name: /Ver Catálogo de Obras/ }).getAttribute("href")).toBe("/catalogo");
    expect(screen.getByRole("link", { name: /Pedir orçamento/ }).getAttribute("href")).toBe("/contato");
  });
});
