const PHONE = "5562992445881";

export const SITE = {
  name: "Viver de Obra",
  whatsapp: "(62) 99244-5881",
  whatsappUrl(msg?: string): string {
    const base = `https://api.whatsapp.com/send?phone=${PHONE}`;
    return msg ? `${base}&text=${encodeURIComponent(msg)}` : base;
  },
  address:
    "Av. São Francisco de Assis, 181, Galeria Nazir, Sala 05, 2º piso, Jundiaí, Anápolis-GO, 75110-810",
  hours: "Seg a Sáb, 8h às 18h",
  social: {
    instagram: "https://www.instagram.com/viverdobra/",
    youtube: "https://www.youtube.com/channel/UCqF-imgywwuURWTK-EQm7DQ",
    facebook: null as string | null,
  },
};

export const NAV: { href: string; label: string }[] = [
  { href: "/catalogo", label: "Catálogo de Obras" },
  { href: "/andamento", label: "Em andamento" },
  { href: "/imoveis", label: "Imóveis à venda" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export const ACCESS: { label: string; desc: string; href: string }[] = [
  {
    label: "VDO Hub",
    desc: "Salas comerciais por assinatura",
    href: "https://vdohub.viverdeobra.com",
  },
  {
    label: "VDO Club",
    desc: "Arquitetos e fornecedores",
    href: process.env.NEXT_PUBLIC_VDOCLUB_URL ?? "#",
  },
  { label: "Adm Viver de Obra", desc: "Área interna da equipe", href: "/admin" },
];
