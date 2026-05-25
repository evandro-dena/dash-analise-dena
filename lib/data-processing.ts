import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type {
  RawSegmentRow,
  RawUrlRow,
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
  // Strip BOM if present
  const cleaned = content.startsWith('﻿') ? content.slice(1) : content;
  const result = Papa.parse<T>(cleaned, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return result.data;
}

function buildUrlMap(urlRows: RawUrlRow[]): Map<string, RawUrlRow> {
  // For duplicate ad names in URL file, keep the one with highest spend
  const map = new Map<string, RawUrlRow>();
  for (const row of urlRows) {
    const key = row['Nome do anúncio'];
    if (!key) continue;
    const existing = map.get(key);
    const spend = Number(row['Valor usado (BRL)']) || 0;
    const existingSpend = existing ? Number(existing['Valor usado (BRL)']) || 0 : -1;
    if (!existing || spend > existingSpend) {
      map.set(key, row);
    }
  }
  return map;
}

let cachedData: DashboardData | null = null;

export function getDashboardData(): DashboardData {
  if (cachedData) return cachedData;

  const dataDir = path.join(process.cwd(), 'data');
  const segmentRows = parseCSV<RawSegmentRow>(path.join(dataDir, 'segment-data.csv'));
  const urlRows = parseCSV<RawUrlRow>(path.join(dataDir, 'url-data.csv'));

  // Build exact and fuzzy lookup maps for URL data
  const exactMap = buildUrlMap(urlRows);
  const fuzzyMap = buildFuzzyMap(urlRows, (r) => r['Nome do anúncio']);

  // For fuzzy: also keep highest spend by normalized key
  const fuzzyBestMap = new Map<string, RawUrlRow>();
  for (const row of urlRows) {
    const key = normalizeName(row['Nome do anúncio']);
    const existing = fuzzyBestMap.get(key);
    const spend = Number(row['Valor usado (BRL)']) || 0;
    const existingSpend = existing ? Number(existing['Valor usado (BRL)']) || 0 : -1;
    if (!existing || spend > existingSpend) {
      fuzzyBestMap.set(key, row);
    }
  }

  const VALID_SEGMENTS: Segment[] = ['engaged', 'prospecting', 'existing'];

  let exactMatches = 0;
  let fuzzyMatches = 0;
  let unmatched = 0;

  const ads: ProcessedAd[] = [];

  for (const seg of segmentRows) {
    const adName = seg['Nome do anúncio'];
    const segmento = seg['Segmentos de público'] as string;
    const tipoResultado = seg['Tipo de resultado'] as string;

    // Segment filter
    if (!VALID_SEGMENTS.includes(segmento as Segment)) continue;
    // Result type filter
    if (tipoResultado !== 'Compras no site') continue;

    const resultados = Number(seg['Resultados']) || 0;
    const gasto = Number(seg['Valor usado (BRL)']) || 0;

    // Quality filter
    if (gasto < 50 || resultados < 1) continue;

    // JOIN with URL data
    let urlRow = exactMap.get(adName);
    if (urlRow) {
      exactMatches++;
    } else {
      urlRow = fuzzyBestMap.get(normalizeName(adName));
      if (urlRow) {
        fuzzyMatches++;
      } else {
        unmatched++;
        continue; // skip rows with no URL match
      }
    }

    const url = urlRow['URL do site'] || '';
    const classification = classifyLP(url);
    if (!classification) continue; // skip non-target LPs

    const rawMedia = urlRow['Tipo de mídia'] || '';
    const tipoMidia: MediaType = rawMedia === 'Imagem' ? 'Imagem' : 'Vídeo';

    const impressoes = Number(seg['Impressões']) || 0;
    const cliques = Number(seg['Cliques no link']) || 0;

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
      cpa,
      taxaConversao,
      ctr,
    });
  }

  console.log(`[data-processing] exact=${exactMatches} fuzzy=${fuzzyMatches} unmatched=${unmatched} final=${ads.length}`);

  cachedData = {
    ads,
    matchStats: { exact: exactMatches, fuzzy: fuzzyMatches, unmatched },
  };

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
      existing.cpa = existing.resultados > 0 ? existing.gasto / existing.resultados : 0;
      existing.taxaConversao = existing.cliques > 0 ? (existing.resultados / existing.cliques) * 100 : 0;
      existing.ctr = existing.impressoes > 0 ? (existing.cliques / existing.impressoes) * 100 : 0;
    }
  }

  return Array.from(map.values());
}
