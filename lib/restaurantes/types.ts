// Restaurantes do mapa "Certificado de Qualidade - Gastropiço" (Google My
// Maps), copiados para data/gastropico.json a 20/11/2026.
export type Restaurante = {
  id: number;
  c: string; // categoria (camada do mapa)
  n: string; // nome
  d: string; // descrição (pode ter links do Instagram)
  lat: number;
  lng: number;
};

// Cores das camadas, próximas das do mapa original.
export const CATEGORIAS: { nome: string; cor: string }[] = [
  { nome: "Recomendados", cor: "#8e1d4f" },
  { nome: "Recomendados pela Comunidade", cor: "#f59e0b" },
  { nome: "Outras Recomendações", cor: "#8b5cf6" },
  { nome: "Buidas!", cor: "#84cc16" },
  { nome: "Desiludiu ou não volto", cor: "#111827" },
  { nome: "Dromir", cor: "#3b82f6" },
  { nome: "Gelados", cor: "#ec4899" },
];

export const corDe = (c: string) => CATEGORIAS.find((x) => x.nome === c)?.cor ?? "#6b7280";
