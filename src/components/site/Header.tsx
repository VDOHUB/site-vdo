"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ACCESS, NAV } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [acc, setAcc] = useState(false);

  const close = () => {
    setOpen(false);
    setAcc(false);
  };

  return (
    <header className="site-header">
      <div className="in">
        <Link href="/" aria-label="Viver de Obra Engenharia - início">
          <Image src="/brand/logo-preto-amarelo.png" alt="Viver de Obra Engenharia" width={54} height={46} className="logo" priority style={{ height: 46, width: "auto" }} />
        </Link>
        <button
          type="button"
          className="burger"
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
        <nav id="main-nav" aria-label="Principal" className={`main-nav${open ? " show" : ""}`}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="link" onClick={close} aria-current={pathname === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
          <div className="acc">
            <button type="button" aria-haspopup="true" aria-expanded={acc} onClick={() => setAcc((v) => !v)}>
              Acessar ▾
            </button>
            {acc && (
              <div className="acc-menu">
                {ACCESS.map((a) => (
                  <a key={a.label} href={a.href} onClick={close}>
                    <b>{a.label}</b>
                    <small>{a.desc}</small>
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
