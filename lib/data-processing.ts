import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type {
  RawSegmentRow,
  RawUrlRow,
  RawMetricsRow,
  ProcessedAd,
  DashboardData,
  Segment,
  MediaType,
  Product,
} from './types';
import { normalizeName, buildFuzzyMap } from './fuzzy-match';

function classifyLP(url: string): { produto: Product; lp: string } | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('lm1.denavita.com.br')) return { produto: 'Laranja Moro', lp: 'LP-3 lm1.denavita.com.br' };
  if (u.includes('/pages/lm1')) return { produto: 'Laranja Moro', lp: 'LP-2 /pages/lm1' };
  if (u.includes('/pages/laranja-moro')) return { produto: 'Laranja Moro', lp: 'LP-1 /pages/laranja-moro' };
  if (u.includes('/pages/jejoom-v3')) return { produto: 'Jejoom', lp: 'LP-3 /pages/jejoom-v3' };
  if (u.includes('jejoom.denavita.com.br')) return { produto: 'Jejoom', lp: 'LP-2 jejoom.denavita.com.br' };
  if (u.includes('/pages/jejoom-denavita')) return { produto: 'Jejoom', lp: 'LP-1 /pages/jejoom-denavita' };
  return null;
}

function parseCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const cleaned = content.startsWith('﻿') ? content.slice(1) : content;
  const result = Papa.parse<T>(cleaned, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return result.data;
}

function buildUrlMap(urlRows: RawUrlRow[]): Map<string, RawUrlRow> {
  const map = new Map<string, RawUrlRow>();
  for (const row of urlRows) {
    const key = row['Nome do anúncio'];
    if (!key) continue;
    const existing = map.get(key);
    const spend = Number(row['Valor usado (BRL)']) || 0;
    const existingSpend = existing ? Number(existing['Valor usado (BRL)']) || 0 : -1;
    if (!existing || spend > existingSpend) map.set(key, row);
  }
  return map;
}

// Build metrics map keyed by "adName||segment"
function buildMetricsMap(metricsRows: RawMetricsRow[]): Map<string, RawMetricsRow> {
  const map = new Map<string, RawMetricsRow>();
  for (const row of metricsRows) {
    const adName = row['Nome do anúncio'];
    const seg = row['Segmentos de público'];
    if (!adName || !seg) continue;
    const key = `${adName}||${seg}`;
    const existing = map.get(key);
    const spend = Number(row['Valor usado (BRL)']) || 0;
    const existingSpend = existing ? Number(existing['Valor usado (BRL)']) || 0 : -1;
    if (!existing || spend > existingSpend) map.set(key, row);
  }
  return map;
}

function buildFuzzyMetricsMap(metricsRows: RawMetricsRow[]): Map<string, RawMetricsRow> {
  const map = new Map<string, RawMetricsRow>();
  for (const row of metricsRows) {
    const adName = row['Nome do anúncio'];
    const seg = row['Segmentos de público'];
    if (!adName || !seg) continue;
    const key = `${normalizeName(adName)}||${seg}`;
    const existing = map.get(key);
    const spend = Number(row['Valor usado (BRL)']) || 0;
    const existingSpend = existing ? Number(existing['Valor usado (BRL)']) || 0 : -1;
    if (!existing || spend > existingSpend) map.set(key, row);
  }
  return map;
}

let cachedData: DashboardData | null = null;

export function getDashboardData(): DashboardData {
  if (cachedData) return cachedData;

  const dataDir = path.join(process.cwd(), 'data');
  const segmentRows = parseCSV<RawSegmentRow>(path.join(dataDir, 'segment-data.csv'));
  const urlRows = parseCSV<RawUrlRow>(path.join(dataDir, 'url-data.csv'));
  const metricsRows = parseCSV<RawMetricsRow>(path.join(dataDir, 'metrics-data.csv'));

  // URL lookup (exact + fuzzy)
  const urlExactMap = buildUrlMap(urlRows);
  const urlFuzzyMap = new Map<string, RawUrlRow>();
  for (const row of urlRows) {
    const key = normalizeName(row['Nome do anúncio']);
    const existing = urlFuzzyMap.get(key);
    const spend = Number(row['Valor usado (BRL)']) || 0;
    const existingSpend = existing ? Number(existing['Valor usado (BRL)']) || 0 : -1;
    if (!existing || spend > existingSpend) urlFuzzyMap.set(key, row);
  }

  // Metrics lookup (exact + fuzzy by adName||segment)
  const metricsExactMap = buildMetricsMap(metricsRows);
  const metricsFuzzyMap = buildFuzzyMetricsMap(metricsRows);

  const VALID_SEGMENTS: Segment[] = ['engaged', 'prospecting', 'existing'];

  let exactMatches = 0, fuzzyMatches = 0, unmatched = 0;
  const ads: ProcessedAd[] = [];

  for (const seg of segmentRows) {
    const adName = seg['Nome do anúncio'];
    const segmento = seg['Segmentos de público'] as string;
    const tipoResultado = seg['Tipo de resultado'] as string;

    if (!VALID_SEGMENTS.includes(segmento as Segment)) continue;
    if (tipoResultado !== 'Compras no site') continue;

    const resultados = Number(seg['Resultados']) || 0;
    const gasto = Number(seg['Valor usado (BRL)']) || 0;

    if (gasto < 50 || resultados < 1) continue;

    // URL JOIN
    let urlRow = urlExactMap.get(adName);
    if (urlRow) {
      exactMatches++;
    } else {
      urlRow = urlFuzzyMap.get(normalizeName(adName));
      if (urlRow) { fuzzyMatches++; } else { unmatched++; continue; }
    }

    const url = urlRow['URL do site'] || '';
    const classification = classifyLP(url);
    if (!classification) continue;

    const rawMedia = urlRow['Tipo de mídia'] || '';
    const tipoMidia: MediaType = rawMedia === 'Imagem' ? 'Imagem' : 'Vídeo';

    // Metrics JOIN (exact first, then fuzzy)
    const metricsKey = `${adName}||${segmento}`;
    const metricsFuzzyKey = `${normalizeName(adName)}||${segmento}`;
    const metrics = metricsExactMap.get(metricsKey) || metricsFuzzyMap.get(metricsFuzzyKey);

    const impressoes = Number(seg['Impressões']) || 0;
    const cliques = Number(seg['Cliques no link']) || 0;

    const receita = metrics ? Number(metrics['Valor dos resultados']) || 0 : 0;
    const roas = metrics ? Number(metrics['ROAS (retorno sobre o investimento em publicidade) das compras']) || 0 : 0;
    const hookRate = metrics ? Number(metrics['Hook Rate']) || 0 : 0;
    const viewsPagina = metrics ? Number(metrics['Visualizações da página de destino do site']) || 0 : 0;
    const checkoutIniciados = metrics ? Number(metrics['Finalizações de compra iniciadas']) || 0 : 0;

    const cpa = resultados > 0 ? gasto / resultados : 0;
    const taxaConversao = cliques > 0 ? (resultados / cliques) * 100 : 0;
    const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;

    ads.push({
      nomeAnuncio: adName,
      segmento: segmento as Segment,
      tipoMidia,
      produto: classification.produto,
      lp: classification.lp,
      url,
      impressoes,
      cliques,
      resultados,
      gasto,
      receita,
      cpa,
      roas,
      taxaConversao,
      ctr,
      hookRate,
      viewsPagina,
      checkoutIniciados,
    });
  }

  console.log(`[data-processing] exact=${exactMatches} fuzzy=${fuzzyMatches} unmatched=${unmatched} final=${ads.length}`);

  cachedData = { ads, matchStats: { exact: exactMatches, fuzzy: fuzzyMatches, unmatched } };
  return cachedData;
}

export function aggregateByAdAndSegment(ads: ProcessedAd[]): ProcessedAd[] {
  const map = new Map<string, ProcessedAd>();
  for (const ad of ads) {
    const key = `${ad.nomeAnuncio}||${ad.segmento}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...ad });
    } else {
      existing.impressoes += ad.impressoes;
      existing.cliques += ad.cliques;
      existing.resultados += ad.resultados;
      existing.gasto += ad.gasto;
      existing.receita += ad.receita;
      existing.viewsPagina += ad.viewsPagina;
      existing.checkoutIniciados += ad.checkoutIniciados;
      existing.cpa = existing.resultados > 0 ? existing.gasto / existing.resultados : 0;
      existing.roas = existing.gasto > 0 ? existing.receita / existing.gasto : 0;
      existing.taxaConversao = existing.cliques > 0 ? (existing.resultados / existing.cliques) * 100 : 0;
      existing.ctr = existing.impressoes > 0 ? (existing.cliques / existing.impressoes) * 100 : 0;
      // hookRate: weighted average by impressions
      const totalImp = existing.impressoes;
      existing.hookRate = totalImp > 0 ? ((existing.hookRate * (totalImp - ad.impressoes)) + (ad.hookRate * ad.impressoes)) / totalImp : ad.hookRate;
    }
  }
  return Array.from(map.values());
}
