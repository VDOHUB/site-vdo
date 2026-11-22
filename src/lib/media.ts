export type HeroSource = { src: string; type: string; media?: string };

export const hero: { sources: HeroSource[]; poster: string; posterSmall: string } = {
  sources: [
    { src: "/hero/hero-720.mp4", type: "video/mp4", media: "(max-width: 768px)" },
    { src: "/hero/hero-1080.webm", type: "video/webm" },
    { src: "/hero/hero-1080.mp4", type: "video/mp4" },
  ],
  poster: "/hero/hero-poster.webp",
  /** Versão de 800 px para telas pequenas (menos bytes e menos decodificação no celular). */
  posterSmall: "/hero/hero-poster-800.webp",
};
