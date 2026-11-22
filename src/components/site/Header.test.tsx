// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (p: { alt: string }) => <img alt={p.alt} />,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load() {
  const { Header } = await import("./Header");
  return render(<Header />);
}

describe("Header: menu Acessar", () => {
  it("abre, liga aria-controls ao menu e fecha com Escape devolvendo o foco", async () => {
    vi.stubEnv("NEXT_PUBLIC_VDOCLUB_URL", "https://club.example");
    await load();
    const btn = screen.getByRole("button", { name: /Acessar/ });
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(btn.getAttribute("aria-controls")!)).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(btn);
  });

  it("fecha com pointerdown fora, mas não dentro", async () => {
    vi.stubEnv("NEXT_PUBLIC_VDOCLUB_URL", "https://club.example");
    await load();
    const btn = screen.getByRole("button", { name: /Acessar/ });
    fireEvent.click(btn);
    fireEvent.pointerDown(screen.getByText("Área interna da equipe"));
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(document.body);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("sem NEXT_PUBLIC_VDOCLUB_URL o VDO Club não aparece no menu", async () => {
    vi.stubEnv("NEXT_PUBLIC_VDOCLUB_URL", "");
    await load();
    fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));
    expect(screen.queryByText("VDO Club")).toBeNull();
    expect(screen.getByText("VDO Hub")).toBeTruthy();
  });
});
