import Image from "next/image";
import Link from "next/link";
import { ACCESS, NAV, SITE } from "@/lib/site";

export function Footer() {
  const social = [
    { label: "Instagram", href: SITE.social.instagram },
    { label: "Google Meu Negócio", href: SITE.social.google },
    { label: "Facebook", href: SITE.social.facebook },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  return (
    <footer className="site-footer">
      <div className="g">
        <div>
          <Image src="/brand/logo-preto-amarelo.png" alt="Viver de Obra" width={54} height={46} className="logo" style={{ height: 46, width: "auto" }} />
          <p className="muted">Obra sem dor de cabeça. Construtora boutique em Anápolis, Goiás.</p>
          <p className="muted">{SITE.address}</p>
        </div>
        <div>
          <h4>Site</h4>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </div>
        <div>
          <h4>Ecossistema</h4>
          {ACCESS.filter((a): a is typeof a & { href: string } => Boolean(a.href)).map((a) => (
            <a key={a.label} href={a.href}>{a.label}</a>
          ))}
        </div>
        <div>
          <h4>Redes</h4>
          {social.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
          ))}
          <a href={SITE.whatsappUrl()} target="_blank" rel="noopener noreferrer">WhatsApp {SITE.whatsapp}</a>
        </div>
        <div className="copy">
          <span>© Viver de Obra Engenharia</span>
          <span>{SITE.hours} · {SITE.whatsapp}</span>
        </div>
      </div>
    </footer>
  );
}
