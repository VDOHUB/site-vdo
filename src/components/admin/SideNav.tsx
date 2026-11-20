"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";

const ITEMS = [
  { href: "/admin/obras", label: "Obras e imóveis" },
  { href: "/admin/mensagens", label: "Mensagens" },
  { href: "/admin/recursos", label: "Recursos internos" },
  { href: "/admin/destaques", label: "Destaques da Home" },
];

export function SideNav({ novas }: { novas: number }) {
  const pathname = usePathname();
  return (
    <aside className="side">
      <Image src="/brand/logo-preto-amarelo.png" alt="Viver de Obra" width={47} height={40} className="logo side-logo" style={{ height: 40, width: "auto" }} />
      <nav aria-label="Adm">
        {ITEMS.map((it) => {
          const on = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
              {it.label}
              {it.href === "/admin/mensagens" && novas > 0 && (
                <span className="n" aria-label={`${novas} ${novas === 1 ? "nova" : "novas"}`}>
                  {novas}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="side-foot">
        <Link href="/">← Voltar ao site</Link>
        <form action={logout}>
          <button type="submit">Sair</button>
        </form>
      </div>
    </aside>
  );
}

/** Placeholder estatico enquanto a sessao e conferida. */
export function SideNavSkeleton() {
  return <aside className="side" aria-hidden="true" />;
}
