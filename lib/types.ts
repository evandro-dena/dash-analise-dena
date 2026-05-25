export type Segment = 'engaged' | 'prospecting' | 'existing';
export type MediaType = 'Vídeo' | 'Imagem';
export type Product = 'Laranja Moro' | 'Jejoom';
export type ProductFilter = 'Todos' | Product;

export interface RawSegmentRow {
  'Nome do conjunto de anúncios': string;
  'Nome da campanha': string;
  'Nome do anúncio': string;
  'Segmentos de público': string;
  'Veiculação do anúncio': string;
  Alcance: number;
  Impressões: number;
  Frequência: number;
  'Tipo de resultado': string;
  Resultados: number;
  'Custo por resultado': number;
  'Valor usado (BRL)': number;
  Início: string;
  Término: string;
  'CPM (custo por 1.000 impressões)': number;
  'Cliques no link': number;
  'CPC (custo por clique no link)': number;
  'CTR (taxa de cliques no link)': number;
  'Início dos relatórios': string;
  'Encerramento dos relatórios': string;
}

export interface RawUrlRow {
  'Nome do conjunto de anúncios': string;
  'Nome da campanha': string;
  'Nome do anúncio': string;
  'URL do site': string;
  'Tipo de mídia': string;
  'Valor usado (BRL)': number;
}

export interface ProcessedAd {
  nomeAnuncio: string;
  segmento: Segment;
  tipoMidia: MediaType;
  produto: Product;
  lp: string;
  url: string;
  impressoes: number;
  cliques: number;
  resultados: number;
  gasto: number;
  cpa: number;
  taxaConversao: number;
  ctr: number;
}

export interface LpSummary {
  produto: Product;
  lp: string;
  anuncios: number;
  impressoes: number;
  cliques: number;
  resultados: number;
  gasto: number;
  cpa: number;
  taxaConversao: number;
}

export interface SegmentSummary {
  segmento: Segment;
  gasto: number;
  resultados: number;
  cpa: number;
  taxaConversao: number;
  impressoes: number;
  cliques: number;
}

export interface DashboardData {
  ads: ProcessedAd[];
  matchStats: { exact: number; fuzzy: number; unmatched: number };
}
