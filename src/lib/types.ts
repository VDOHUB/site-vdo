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
