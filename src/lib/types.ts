export type Obra = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  local: string;
  tipo: "residencial" | "corporativo";
  status: "pronta" | "em_andamento" | "a_venda" | "vendido";
  progresso: number | null;
  preco: string | null;
  area: string | null;
  quartos: number | null;
  vagas: number | null;
  ordem: number;
  destaque: boolean;
  /** Posicao nos destaques da Home (1..n); null fora dos destaques. */
  destaque_ordem: number | null;
  publicado: boolean;
  created_at: string;
};

export type Foto = {
  id: string;
  obra_id: string;
  path: string;
  ordem: number;
  alt: string;
};
