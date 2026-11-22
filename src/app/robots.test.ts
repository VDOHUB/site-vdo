import { describe, expect, it, vi } from "vitest";

describe("robots", () => {
  it("bloqueia /admin e aponta o sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://viverdeobra.com");
    const robots = (await import("./robots")).default;
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toContain("/admin");
    expect(r.sitemap).toBe("https://viverdeobra.com/sitemap.xml");
  });
});
