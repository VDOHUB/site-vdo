// Módulo sem dependências de servidor: seguro para Client Components.
const WIDTHS = [800, 1600] as const;

export function photoUrl(path: string, width: number): string {
  // Neutraliza traversal e caminho absoluto: normaliza para relativo sem "..".
  path = path
    .split("/")
    .filter((seg) => seg !== "" && seg !== "." && seg !== "..")
    .join("/");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (path.startsWith("uploads/") && base) {
    return `${base}/storage/v1/object/public/obras/${path}`;
  }
  const m = /^(.+)\/(\d+)-\d+\.[a-z0-9]+$/i.exec(path);
  if (!m) return `/obras/${path}`;
  const w = WIDTHS.reduce((best, c) =>
    Math.abs(c - width) < Math.abs(best - width) ? c : best,
  );
  return `/obras/${m[1]}/${m[2]}-${w}.webp`;
}
