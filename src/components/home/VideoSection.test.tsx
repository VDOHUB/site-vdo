// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VideoSection } from "./VideoSection";

function mockMatchMedia(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

type Cb = (entries: { isIntersecting: boolean }[]) => void;
let observers: Cb[] = [];
const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();

beforeEach(() => {
  observers = [];
  play.mockClear();
  pause.mockClear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: Cb) {
        observers.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: play });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, value: pause });
  Object.defineProperty(HTMLMediaElement.prototype, "load", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "connection");
});

const enter = (inView: boolean) => act(() => observers.forEach((cb) => cb([{ isIntersecting: inView }])));

describe("VideoSection", () => {
  it("começa mudo, sem fontes carregadas e com preload none", () => {
    mockMatchMedia(false);
    const { container } = render(<VideoSection />);
    const v = container.querySelector("video")!;
    expect(v.muted).toBe(true);
    expect(v.getAttribute("preload")).toBe("none");
    expect(v.querySelectorAll("source")).toHaveLength(0);
  });

  it("toca ao entrar na tela (carregando as 3 fontes) e pausa ao sair", () => {
    mockMatchMedia(false);
    const { container } = render(<VideoSection />);
    enter(true);
    expect(play).toHaveBeenCalled();
    const sources = [...container.querySelectorAll("video source")];
    expect(sources).toHaveLength(3);
    expect(sources[0].getAttribute("media")).toBe("(max-width: 768px)");
    enter(false);
    expect(pause).toHaveBeenCalled();
  });

  it("com prefers-reduced-motion não dá autoplay e mostra o botão de play", () => {
    mockMatchMedia(true);
    render(<VideoSection />);
    enter(true);
    expect(play).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Reproduzir vídeo" }).length).toBeGreaterThan(0);
  });

  it("com economia de dados (saveData) não dá autoplay", () => {
    mockMatchMedia(false);
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    });
    render(<VideoSection />);
    enter(true);
    expect(play).not.toHaveBeenCalled();
  });

  it("botão de som usa aria-pressed e só liga o som por clique", () => {
    mockMatchMedia(false);
    const { container } = render(<VideoSection />);
    const v = container.querySelector("video")!;
    const btn = screen.getByRole("button", { name: "Ativar o som" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(v.muted).toBe(false);
    const off = screen.getByRole("button", { name: "Desativar o som" });
    expect(off.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(off);
    expect(v.muted).toBe(true);
  });

  it("barra de progresso é um slider acessível por teclado", () => {
    mockMatchMedia(false);
    const { container } = render(<VideoSection />);
    const v = container.querySelector("video")!;
    Object.defineProperty(v, "duration", { configurable: true, value: 100 });
    v.currentTime = 10;
    const slider = screen.getByRole("slider", { name: "Progresso do vídeo" });
    expect(slider.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(v.currentTime).toBe(15);
    expect(slider.getAttribute("aria-valuenow")).toBe("39"); // 1 - 0.85^3
    fireEvent.keyDown(slider, { key: "End" });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");
  });
});
