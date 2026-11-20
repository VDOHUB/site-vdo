export type HeroSource = { src: string; type: string; media?: string };

export const hero: { sources: HeroSource[]; poster: string } = {
  sources: [
    { src: "/hero/hero-720.mp4", type: "video/mp4", media: "(max-width: 768px)" },
    { src: "/hero/hero-1080.webm", type: "video/webm" },
    { src: "/hero/hero-1080.mp4", type: "video/mp4" },
  ],
  poster: "/hero/hero-poster.webp",
};
