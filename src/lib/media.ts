export type VideoSource = { src: string; type: string; media?: string };

/** Vídeo institucional (seção logo abaixo do topo). A fonte 720p vem primeiro, só para telas pequenas. */
export const video: { sources: VideoSource[]; poster: string } = {
  sources: [
    { src: "/hero/hero-720.mp4", type: "video/mp4", media: "(max-width: 768px)" },
    { src: "/hero/hero-1080.webm", type: "video/webm" },
    { src: "/hero/hero-1080.mp4", type: "video/mp4" },
  ],
  poster: "/hero/video-poster.webp",
};

/** Segundos de cada slide do topo (fade cruzado). */
export const HERO_SLIDE_SECONDS = 6;

/** Fotos do topo, alternando as duas obras (arquivos 1600w .avif/.webp em /public/obras). */
export const HERO_SLIDES = [
  { src: "/obras/dunas-douradas/14-1600" },
  { src: "/obras/agencia-bussola/14-1600" },
  { src: "/obras/dunas-douradas/13-1600" },
  { src: "/obras/agencia-bussola/5-1600" },
  { src: "/obras/dunas-douradas/11-1600" },
  { src: "/obras/agencia-bussola/12-1600" },
] as const;

/** Foto limpa dos sócios (página Sobre). */
export const sociosFoto = {
  alt: "Os dois sócios da Viver de Obra de pé em uma obra: um de camisa polo verde, segurando o capacete, e outro de camisa amarela, com capacete preto",
  width: 1200,
  height: 823,
  avif: ["/sobre/socios-600.avif 600w", "/sobre/socios-1200.avif 1200w"],
  webp: ["/sobre/socios-600.webp 600w", "/sobre/socios-1200.webp 1200w"],
  fallback: "/sobre/socios-1200.webp",
};
