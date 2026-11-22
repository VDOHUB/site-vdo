import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("alt das fotos do seed", () => {
  const manifest = JSON.parse(readFileSync("scripts/media-manifest.json", "utf8")) as {
    obras: { slug: string; images: { order: number; alt: string }[] }[];
  };
  const seed = readFileSync("supabase/seed.sql", "utf8");
  const all = manifest.obras.flatMap((o) => o.images.map((i) => ({ slug: o.slug, ...i })));

  it("tem as 39 fotos", () => expect(all).toHaveLength(39));

  it("nenhuma usa texto de placeholder e todas têm 15 a 140 caracteres", () => {
    for (const i of all) {
      expect(i.alt, `${i.slug} #${i.order}`).not.toMatch(/foto \d+/i);
      expect(i.alt.length, `${i.slug} #${i.order}`).toBeGreaterThanOrEqual(15);
      expect(i.alt.length, `${i.slug} #${i.order}`).toBeLessThanOrEqual(140);
    }
  });

  it("alts são únicos por obra", () => {
    for (const o of manifest.obras) {
      const alts = o.images.map((i) => i.alt);
      expect(new Set(alts).size, o.slug).toBe(alts.length);
    }
  });

  it("seed.sql tem o mesmo alt do manifesto", () => {
    for (const i of all) {
      const line = `'${i.slug}/${i.order}-1600.webp', '${i.alt.replace(/'/g, "''")}'`;
      expect(seed, `${i.slug} #${i.order}`).toContain(line);
    }
    expect(seed).not.toMatch(/foto \d+'/i);
  });
});

describe("siteUrl", () => {
  it("usa NEXT_PUBLIC_SITE_URL sem barra final", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemplo.com.br/");
    const { siteUrl } = await import("./seo");
    expect(siteUrl()).toBe("https://exemplo.com.br");
  });
  it("cai para o domínio oficial", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { siteUrl } = await import("./seo");
    expect(siteUrl()).toBe("https://viverdeobra.com");
  });
});

describe("localBusinessJsonLd", () => {
  it("monta GeneralContractor com dados do SITE e omite o que é nulo", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://viverdeobra.com");
    vi.stubEnv("NEXT_PUBLIC_FACEBOOK_URL", "");
    const { localBusinessJsonLd } = await import("./seo");
    const j = localBusinessJsonLd() as Record<string, unknown>;
    expect(j["@context"]).toBe("https://schema.org");
    expect(j["@type"]).toEqual(["GeneralContractor", "LocalBusiness"]);
    expect(j.name).toBe("Viver de Obra Engenharia");
    expect(j.telephone).toBe("+5562992445881");
    expect(j.url).toBe("https://viverdeobra.com");
    expect(j.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "Anápolis",
      addressRegion: "GO",
      postalCode: "75110-810",
      addressCountry: "BR",
    });
    expect(j.openingHoursSpecification).toMatchObject({
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "18:00",
    });
    expect(j.sameAs).toEqual([
      "https://www.instagram.com/viverdobra/",
      "https://www.youtube.com/channel/UCqF-imgywwuURWTK-EQm7DQ",
    ]);
    expect(JSON.stringify(j)).not.toContain("null");
  });
  it("inclui o Facebook quando configurado", async () => {
    vi.stubEnv("NEXT_PUBLIC_FACEBOOK_URL", "https://facebook.com/vdo");
    const { localBusinessJsonLd } = await import("./seo");
    expect((localBusinessJsonLd() as { sameAs: string[] }).sameAs).toContain("https://facebook.com/vdo");
  });
});
