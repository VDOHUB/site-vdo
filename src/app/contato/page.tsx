import { ContactForm } from "@/components/contato/ContactForm";
import { SITE } from "@/lib/site";

export const metadata = { title: "Contato" };

export default function Page() {
  const social = [
    { label: "Instagram", href: SITE.social.instagram },
    { label: "YouTube", href: SITE.social.youtube },
    { label: "Facebook", href: SITE.social.facebook },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  return (
    <main className="wrap page">
      <div className="page-head">
        <p className="eyebrow">Contato</p>
        <h1>Fale com a gente.</h1>
        <p>Conte o que você quer construir ou reformar e retornamos o contato.</p>
      </div>
      <div className="split contact-split">
        <div>
          <ContactForm />
          <a
            className="btn"
            style={{ marginTop: 16 }}
            href={SITE.whatsappUrl("Olá! Vim pelo site e quero conversar sobre uma obra.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {SITE.whatsapp} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="info">
          <div>
            <small>Endereço</small>
            {SITE.address}
          </div>
          <div>
            <small>Horário</small>
            {SITE.hours}
          </div>
          <div>
            <small>Redes</small>
            <ul className="soc">
              {social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
