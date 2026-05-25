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

export interface RawMetricsRow {
  'Nome da campanha': string;
  'Segmentos de público': string;
  'Nome do anúncio': string;
  'Hook Rate': number;
  'Reproduções de 100% do vídeo': number;
  'Valor usado (BRL)': number;
  'Cliques no link': number;
  'Visualizações da página de destino do site': number;
  'Tipo de resultado': string;
  'Finalizações de compra iniciadas': number;
  'Taxa de conversão': number;
  Resultados: number;
  'ROAS (retorno sobre o investimento em publicidade) das compras': number;
  'Valor dos resultados': number;
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
  receita: number;
  cpa: number;
  roas: number;
  taxaConversao: number;
  ctr: number;
  hookRate: number;
  viewsPagina: number;
  checkoutIniciados: number;
}

export interface LpSummary {
  produto: Product;
  lp: string;
  anuncios: number;
  impressoes: number;
  cliques: number;
  resultados: number;
  gasto: number;
  receita: number;
  cpa: number;
  roas: number;
  taxaConversao: number;
  viewsPagina: number;
}

export interface SegmentSummary {
  segmento: Segment;
  gasto: number;
  receita: number;
  resultados: number;
  cpa: number;
  roas: number;
  taxaConversao: number;
  impressoes: number;
  cliques: number;
}

export interface DashboardData {
  ads: ProcessedAd[];
  matchStats: { exact: number; fuzzy: number; unmatched: number };
}
