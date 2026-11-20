// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let state: import("@/lib/leads").LeadState = { status: "ok" };
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
  it("status vazio antes do sucesso", () => {
    state = { status: "idle" };
    render(<ContactForm />);
    const st = screen.getByRole("status");
    expect(st.textContent).toBe("");
    expect(st.getAttribute("aria-live")).toBe("polite");
  });
  it("erro preserva os campos e o topico", () => {
    state = {
      status: "error",
      errors: { whatsapp: "x" },
      values: { topico: "Sugestões", nome: "Ana", whatsapp: "123", mensagem: "Oi" },
    };
    render(<ContactForm />);
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Ana");
    expect((screen.getByLabelText("WhatsApp") as HTMLInputElement).value).toBe("123");
    expect((screen.getByLabelText("Mensagem") as HTMLTextAreaElement).value).toBe("Oi");
    expect((screen.getByRole("radio", { name: "Sugestões" }) as HTMLInputElement).checked).toBe(true);
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
