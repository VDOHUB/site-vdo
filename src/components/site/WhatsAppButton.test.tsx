// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

let path = "/";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

afterEach(cleanup);

describe("WhatsAppButton", () => {
  it("abre o WhatsApp em nova aba, com rel seguro e nome acessível", async () => {
    path = "/catalogo";
    const { WhatsAppButton } = await import("./WhatsAppButton");
    const { SITE } = await import("@/lib/site");
    render(<WhatsAppButton />);
    const a = screen.getByRole("link", { name: "Falar no WhatsApp" });
    expect(a.getAttribute("href")?.startsWith(SITE.whatsappUrl())).toBe(true);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toContain("noopener");
  });

  it("não aparece no /admin", async () => {
    path = "/admin/obras";
    const { WhatsAppButton } = await import("./WhatsAppButton");
    render(<WhatsAppButton />);
    expect(screen.queryByRole("link", { name: "Falar no WhatsApp" })).toBeNull();
  });
});
