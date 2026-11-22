import { OPENING, SITE } from "./site";

const FALLBACK_URL = "https://viverdeobra.com";

/** URL pública do site, sem barra final (NEXT_PUBLIC_SITE_URL ou o domínio oficial). */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_URL;
  return raw.replace(/\/+$/, "");
}

/** Dados estruturados (schema.org) da empresa, para a Home. Campos nulos ficam de fora. */
export function localBusinessJsonLd(): Record<string, unknown> {
  const sameAs = [SITE.social.instagram, SITE.social.youtube, SITE.social.facebook].filter(
    (u): u is string => Boolean(u),
  );
  const a = SITE.addressParts;
  return {
    "@context": "https://schema.org",
    "@type": ["GeneralContractor", "LocalBusiness"],
    name: SITE.legalName,
    description: SITE.description,
    url: siteUrl(),
    image: `${siteUrl()}/opengraph-image.png`,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: a.street,
      addressLocality: a.city,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: "BR",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...OPENING.days],
      opens: OPENING.opens,
      closes: OPENING.closes,
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}
