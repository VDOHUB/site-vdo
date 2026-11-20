// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let state: { status: string; errors?: Record<string, string> } = { status: "ok" };
vi.mock("react", async (orig) => {
  const real = await orig<typeof import("react")>();
  return { ...real, useActionState: () => [state, () => {}, false] };
});
vi.mock("@/app/contato/actions", () => ({ submitLead: async () => ({ status: "idle" }) }));

import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  afterEach(cleanup);
  it("mostra a mensagem de sucesso exata", () => {
    state = { status: "ok" };
    render(<ContactForm />);
    expect(screen.getByRole("status").textContent).toBe("Enviado com sucesso! Em breve retornaremos o contato.");
  });
  it("erros por campo com aria-invalid e describedby", () => {
    state = { status: "error", errors: { nome: "Informe seu nome." } };
    render(<ContactForm />);
    const input = screen.getByLabelText("Nome");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const id = input.getAttribute("aria-describedby")!;
    expect(document.getElementById(id)!.textContent).toBe("Informe seu nome.");
  });
  it("chips sao radiogroup e honeypot fica oculto", () => {
    state = { status: "idle" };
    render(<ContactForm />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    const hp = document.querySelector<HTMLInputElement>('input[name="website"]')!;
    expect(hp.tabIndex).toBe(-1);
    expect(hp.autocomplete).toBe("off");
    expect(hp.closest("[aria-hidden='true']")).not.toBeNull();
  });
});
