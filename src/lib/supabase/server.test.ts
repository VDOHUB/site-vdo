import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  getAll: vi.fn(() => [{ name: "sb-a", value: "1" }]),
  set: vi.fn(),
};
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fakeClient: any;
const ssrCreateServerClient = vi.fn<(...args: unknown[]) => unknown>(() => fakeClient);
vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => ssrCreateServerClient(...args),
}));

import { createServerClient, isAdmin } from "./server";

type CookieAdapter = {
  getAll: () => unknown;
  setAll: (list: { name: string; value: string; options: object }[]) => void;
};

function profilesQuery(result: { data: unknown; error: unknown }) {
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    maybeSingle: vi.fn(async () => result),
  };
  return q;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  fakeClient = { from: vi.fn() };
});

describe("createServerClient", () => {
  it("usa URL e anon key do ambiente e os cookies do Next", async () => {
    const client = await createServerClient();
    expect(client).toBe(fakeClient);
    const [url, key, options] = ssrCreateServerClient.mock.calls[0] as [
      string,
      string,
      { cookies: CookieAdapter },
    ];
    expect(url).toBe("http://127.0.0.1:54321");
    expect(key).toBe("anon-key");
    expect(options.cookies.getAll()).toEqual([{ name: "sb-a", value: "1" }]);
    options.cookies.setAll([{ name: "sb-b", value: "2", options: { path: "/" } }]);
    expect(cookieStore.set).toHaveBeenCalledWith("sb-b", "2", { path: "/" });
  });

  it("ignora erro ao gravar cookie em Server Component", async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });
    await createServerClient();
    const options = ssrCreateServerClient.mock.calls[0][2] as { cookies: CookieAdapter };
    expect(() => options.cookies.setAll([{ name: "x", value: "y", options: {} }])).not.toThrow();
  });

  it("falha com mensagem clara se faltar variavel de ambiente", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await expect(createServerClient()).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("isAdmin", () => {
  it("true quando o perfil tem role admin", async () => {
    const q = profilesQuery({ data: { role: "admin" }, error: null });
    fakeClient.from.mockReturnValue(q);
    await expect(isAdmin("user-1")).resolves.toBe(true);
    expect(fakeClient.from).toHaveBeenCalledWith("profiles");
    expect(q.select).toHaveBeenCalledWith("role");
    expect(q.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("false quando nao ha perfil", async () => {
    fakeClient.from.mockReturnValue(profilesQuery({ data: null, error: null }));
    await expect(isAdmin("user-2")).resolves.toBe(false);
  });

  it("false quando a consulta falha", async () => {
    fakeClient.from.mockReturnValue(profilesQuery({ data: null, error: { message: "boom" } }));
    await expect(isAdmin("user-3")).resolves.toBe(false);
  });

  it("false para userId vazio sem consultar o banco", async () => {
    await expect(isAdmin("")).resolves.toBe(false);
    expect(fakeClient.from).not.toHaveBeenCalled();
  });
});
