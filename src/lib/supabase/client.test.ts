import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeClient = { from: vi.fn() };
const ssrCreateBrowserClient = vi.fn<(...args: unknown[]) => unknown>(() => fakeClient);
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => ssrCreateBrowserClient(...args),
}));

import { createBrowserClient } from "./client";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
});

describe("createBrowserClient", () => {
  it("cria o cliente com URL e anon key publicas", () => {
    expect(createBrowserClient()).toBe(fakeClient);
    expect(ssrCreateBrowserClient).toHaveBeenCalledWith("http://127.0.0.1:54321", "anon-key");
  });

  it("falha com mensagem clara se faltar a anon key", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => createBrowserClient()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});
