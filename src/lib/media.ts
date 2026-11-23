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

/** Imagem do topo (dupla exposição dos sócios), gerada por scripts/build-socios.mjs. */
export const heroImage = {
  alt: "Os dois sócios da Viver de Obra em uma obra",
  width: 1400,
  height: 1200,
  avif: ["/hero/socios-hero-800.avif 800w", "/hero/socios-hero-1400.avif 1400w"],
  webp: ["/hero/socios-hero-800.webp 800w", "/hero/socios-hero-1400.webp 1400w"],
  fallback: "/hero/socios-hero-1400.webp",
};

/** Foto limpa dos sócios (página Sobre). */
export const sociosFoto = {
  alt: "Os dois sócios da Viver de Obra de pé em uma obra: um de camisa polo verde, segurando o capacete, e outro de camisa amarela, com capacete preto",
  width: 1200,
  height: 823,
  avif: ["/sobre/socios-600.avif 600w", "/sobre/socios-1200.avif 1200w"],
  webp: ["/sobre/socios-600.webp 600w", "/sobre/socios-1200.webp 1200w"],
  fallback: "/sobre/socios-1200.webp",
};
