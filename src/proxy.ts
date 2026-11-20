import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Proxy (antigo middleware no Next 16) do Adm: primeira barreira, barata.
// - renova a sessao do Supabase (cookies) a cada requisicao de /admin;
// - sem sessao valida -> /admin/login; logado sem papel admin -> /admin/negado;
// - marca as respostas como noindex e nao cacheaveis.
// NAO e a unica barreira: toda tela protegida e toda Server Action chamam requireAdmin().

const LOGIN = "/admin/login";
const NEGADO = "/admin/negado";

function harden(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === LOGIN;

  let response = NextResponse.next({ request });
  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    // Mantem os cookies de sessao renovados (ou limpos) nesta resposta.
    for (const c of response.cookies.getAll()) res.cookies.set(c);
    return harden(res);
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return isLogin ? harden(response) : redirectTo(LOGIN);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() valida o token no servidor de Auth (getSession() so le o cookie).
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId) return isLogin ? harden(response) : redirectTo(LOGIN);

  // Papel lido de profiles pelo RLS (o usuario so enxerga o proprio perfil).
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const admin = (profile as { role?: string } | null)?.role === "admin";

  if (isLogin) return admin ? redirectTo("/admin/obras") : harden(response);
  if (!admin && pathname !== NEGADO) return redirectTo(NEGADO);
  return harden(response);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
