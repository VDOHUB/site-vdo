import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { listObras } from "@/lib/obras";
import { siteUrl } from "@/lib/seo";

const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/catalogo", priority: 0.9, changeFrequency: "weekly" },
  { path: "/andamento", priority: 0.7, changeFrequency: "weekly" },
  { path: "/imoveis", priority: 0.8, changeFrequency: "weekly" },
  { path: "/sobre", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contato", priority: 0.7, changeFrequency: "monthly" },
];

// Roda por requisição (listObras lê a requisição): obras publicadas no Adm entram na hora.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sem isso o Next geraria o sitemap uma vez no build e as obras novas não apareceriam.
  await connection();
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    changeFrequency,
    priority,
  }));
  let obras: Awaited<ReturnType<typeof listObras>> = [];
  try {
    obras = await listObras();
  } catch {
    // Sem banco: só as páginas estáticas.
  }
  return [
    ...pages,
    ...obras.map((o) => ({
      url: `${base}/catalogo/${o.slug}`,
      lastModified: o.created_at ? new Date(o.created_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
