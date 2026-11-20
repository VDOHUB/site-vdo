// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Gallery } from "./Gallery";
import type { Foto } from "@/lib/types";

const fotos: Foto[] = [1, 2, 3].map((n) => ({
  id: `f${n}`,
  obra_id: "o1",
  path: `casa/${n}-800.webp`,
  ordem: n,
  alt: `Foto ${n}`,
}));

afterEach(cleanup);

function open(n = 1) {
  const thumb = screen.getAllByRole("button", { name: /Ampliar foto/ })[n - 1];
  fireEvent.click(thumb);
  return thumb;
}

describe("Gallery", () => {
  it("mostra estado vazio sem fotos", () => {
    render(<Gallery fotos={[]} />);
    expect(screen.getByText(/Fotos desta obra em breve/)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("abre o lightbox ao clicar na miniatura", () => {
    render(<Gallery fotos={fotos} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    open(2);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("2 / 3")).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("navega com as setas, com volta ao início/fim", () => {
    render(<Gallery fotos={fotos} />);
    open(1);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText("3 / 3")).toBeTruthy();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("1 / 3")).toBeTruthy();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("2 / 3")).toBeTruthy();
  });

  it("fecha com Esc, devolve o foco e libera a rolagem", () => {
    render(<Gallery fotos={fotos} />);
    const thumb = open(2);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(thumb);
    expect(document.body.style.overflow).toBe("");
  });

  it("prende o Tab no diálogo sem nunca focar o backdrop", () => {
    render(<Gallery fotos={fotos} />);
    open(1);
    const dialog = screen.getByRole("dialog");
    const btns = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([tabindex='-1'])"));
    const first = btns[0];
    const last = btns[btns.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    expect(document.activeElement?.classList.contains("lightbox-backdrop")).toBe(false);
  });
});
