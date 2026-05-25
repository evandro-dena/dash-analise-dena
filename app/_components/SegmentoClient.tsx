'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ProcessedAd, Segment, MediaType, Product } from '@/lib/types';
import { useFilter } from '@/components/providers/FilterProvider';
import KpiCard from '@/components/KpiCard';
import DataTable from '@/components/DataTable';
import { formatBRL, formatNumber, formatPercent } from '@/lib/formatters';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';

const SEGMENTS: Segment[] = ['engaged', 'prospecting', 'existing'];
const SEGMENT_LABELS: Record<Segment, string> = {
  engaged: 'Público Engajado',
  prospecting: 'Novo Público',
  existing: 'Cliente Existente',
};

type MediaFilter = 'Todos' | MediaType;
type SortMetric = 'cpa' | 'roas' | 'taxaConversao' | 'ctr' | 'resultados' | 'gasto';

const SORT_OPTIONS: { value: SortMetric; label: string }[] = [
  { value: 'cpa', label: 'Menor CPA' },
  { value: 'roas', label: 'Maior ROAS' },
  { value: 'taxaConversao', label: 'Maior Conv.' },
  { value: 'ctr', label: 'Maior CTR' },
  { value: 'resultados', label: 'Mais Vendas' },
  { value: 'gasto', label: 'Maior Gasto' },
];

interface AdAgg {
  nomeAnuncio: string;
  tipoMidia: MediaType;
  produto: Product;
  lp: string;
  gasto: number;
  receita: number;
  resultados: number;
  cliques: number;
  impressoes: number;
  viewsPagina: number;
  checkoutIniciados: number;
  cpa: number;
  roas: number;
  taxaConversao: number;
  ctr: number;
  hookRate: number;
}

function aggregateAds(ads: ProcessedAd[]): AdAgg[] {
  const map = new Map<string, AdAgg>();
  for (const ad of ads) {
    const ex = map.get(ad.nomeAnuncio);
    if (!ex) {
      map.set(ad.nomeAnuncio, {
        nomeAnuncio: ad.nomeAnuncio, tipoMidia: ad.tipoMidia,
        produto: ad.produto, lp: ad.lp,
        gasto: ad.gasto, receita: ad.receita, resultados: ad.resultados,
        cliques: ad.cliques, impressoes: ad.impressoes,
        viewsPagina: ad.viewsPagina, checkoutIniciados: ad.checkoutIniciados,
        cpa: 0, roas: 0, taxaConversao: 0, ctr: 0, hookRate: ad.hookRate,
      });
    } else {
      ex.gasto += ad.gasto;
      ex.receita += ad.receita;
      ex.resultados += ad.resultados;
      ex.cliques += ad.cliques;
      ex.viewsPagina += ad.viewsPagina;
      ex.checkoutIniciados += ad.checkoutIniciados;
      const prevImp = ex.impressoes;
      ex.impressoes += ad.impressoes;
      ex.hookRate = ex.impressoes > 0
        ? (ex.hookRate * prevImp + ad.hookRate * ad.impressoes) / ex.impressoes
        : 0;
    }
  }
  return Array.from(map.values()).map((a) => ({
    ...a,
    cpa: a.resultados > 0 ? a.gasto / a.resultados : 0,
    roas: a.gasto > 0 ? a.receita / a.gasto : 0,
    taxaConversao: a.cliques > 0 ? (a.resultados / a.cliques) * 100 : 0,
    ctr: a.impressoes > 0 ? (a.cliques / a.impressoes) * 100 : 0,
  }));
}

function BestLpBadge({ lp, produto }: { lp: string; produto: Product }) {
  const color = produto === 'Laranja Moro' ? '#f97316' : '#3b82f6';
  const bg = produto === 'Laranja Moro' ? '#431407' : '#1e3a8a';
  return (
    <div className="flex items-center gap-2">
      <Trophy size={13} className="text-[#eab308]" />
      <span className="text-xs text-[#737373]">Melhor LP:</span>
      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color, background: bg }}>{lp}</span>
    </div>
  );
}

function SegmentCard({ segmento, ads }: { segmento: Segment; ads: ProcessedAd[] }) {
  const [open, setOpen] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('Todos');
  const [sortMetric, setSortMetric] = useState<SortMetric>('cpa');

  const filteredAds = useMemo(
    () => mediaFilter === 'Todos' ? ads : ads.filter((a) => a.tipoMidia === mediaFilter),
    [ads, mediaFilter],
  );

  const kpis = useMemo(() => {
    const gasto = filteredAds.reduce((s, a) => s + a.gasto, 0);
    const receita = filteredAds.reduce((s, a) => s + a.receita, 0);
    const resultados = filteredAds.reduce((s, a) => s + a.resultados, 0);
    const cliques = filteredAds.reduce((s, a) => s + a.cliques, 0);
    return {
      gasto, receita, resultados,
      cpa: resultados > 0 ? gasto / resultados : 0,
      roas: gasto > 0 ? receita / gasto : 0,
      taxaConversao: cliques > 0 ? (resultados / cliques) * 100 : 0,
    };
  }, [filteredAds]);

  const aggregated = useMemo(() => aggregateAds(filteredAds), [filteredAds]);

  const top10 = useMemo(() => {
    const sorted = [...aggregated].sort((a, b) => {
      if (sortMetric === 'cpa') return a.cpa - b.cpa;
      if (sortMetric === 'roas') return b.roas - a.roas;
      if (sortMetric === 'taxaConversao') return b.taxaConversao - a.taxaConversao;
      if (sortMetric === 'ctr') return b.ctr - a.ctr;
      if (sortMetric === 'resultados') return b.resultados - a.resultados;
      return b.gasto - a.gasto;
    });
    return sorted.slice(0, 10);
  }, [aggregated, sortMetric]);

  const bestLp = useMemo(() => {
    const lpMap = new Map<string, { produto: Product; gasto: number; receita: number; resultados: number }>();
    for (const ad of ads) {
      const ex = lpMap.get(ad.lp);
      if (!ex) lpMap.set(ad.lp, { produto: ad.produto, gasto: ad.gasto, receita: ad.receita, resultados: ad.resultados });
      else { ex.gasto += ad.gasto; ex.receita += ad.receita; ex.resultados += ad.resultados; }
    }
    let best: { lp: string; produto: Product; cpa: number; roas: number } | null = null;
    for (const [lp, { produto, gasto, receita, resultados }] of lpMap) {
      if (resultados === 0) continue;
      const cpa = gasto / resultados;
      const roas = gasto > 0 ? receita / gasto : 0;
      if (!best || cpa < best.cpa) best = { lp, produto, cpa, roas };
    }
    return best;
  }, [ads]);

  const columns = useMemo<ColumnDef<AdAgg>[]>(() => [
    {
      accessorKey: 'nomeAnuncio', header: 'Anúncio', enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-[#fafafa] max-w-[180px] block truncate text-xs" title={getValue() as string}>
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'tipoMidia', header: 'Tipo', enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue() as MediaType;
        return <span className="px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ color: v === 'Vídeo' ? '#c4b5fd' : '#67e8f9', background: v === 'Vídeo' ? '#2e1065' : '#083344' }}>{v}</span>;
      },
    },
    { accessorKey: 'lp', header: 'LP', enableSorting: false },
    { accessorKey: 'gasto', header: 'Gasto', enableSorting: true, cell: ({ getValue }) => formatBRL(getValue() as number) },
    {
      accessorKey: 'hookRate', header: 'Hook Rate', enableSorting: true,
      cell: ({ getValue }) => formatPercent((getValue() as number) * 100),
    },
    { accessorKey: 'viewsPagina', header: 'Views Página', enableSorting: true, cell: ({ getValue }) => formatNumber(getValue() as number) },
    {
      accessorKey: 'cpa', header: 'CPA', enableSorting: true,
      cell: ({ getValue }) => <span className="text-[#fafafa] font-semibold">{formatBRL(getValue() as number)}</span>,
    },
    {
      accessorKey: 'resultados', header: 'Vendas', enableSorting: true,
      cell: ({ getValue }) => <span className="text-[#22c55e] font-semibold">{formatNumber(getValue() as number)}</span>,
    },
    {
      accessorKey: 'roas', header: 'ROAS', enableSorting: true,
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return <span className={`font-semibold ${v >= 1 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{v.toFixed(2)}x</span>;
      },
    },
    { accessorKey: 'taxaConversao', header: 'Taxa Conv.', enableSorting: true, cell: ({ getValue }) => formatPercent(getValue() as number) },
  ], []);

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
      <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#1c1c1c] transition-colors text-left"
        onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={16} className="text-[#737373]" /> : <ChevronRight size={16} className="text-[#737373]" />}
        <span className="font-semibold text-[#fafafa] capitalize">{SEGMENT_LABELS[segmento]}</span>
        <span className="ml-auto text-xs text-[#737373]">{ads.length} criativos</span>
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[#262626]">
          {/* Best LP banner */}
          {bestLp && (
            <div className="mt-4 px-4 py-2.5 bg-[#0a0a0a] rounded-lg border border-[#262626]">
              <BestLpBadge lp={bestLp.lp} produto={bestLp.produto} />
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
            <KpiCard label="Gasto" value={formatBRL(kpis.gasto)} />
            <KpiCard label="Receita" value={formatBRL(kpis.receita)} accentColor="#22c55e" />
            <KpiCard label="ROAS" value={`${kpis.roas.toFixed(2)}x`} accentColor={kpis.roas >= 1 ? '#22c55e' : '#ef4444'} />
            <KpiCard label="Compras" value={formatNumber(kpis.resultados)} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiCard label="CPA" value={formatBRL(kpis.cpa)} />
            <KpiCard label="Taxa Conv." value={formatPercent(kpis.taxaConversao)} />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#737373]">Mídia:</span>
            {(['Todos', 'Vídeo', 'Imagem'] as MediaFilter[]).map((f) => (
              <button key={f} onClick={() => setMediaFilter(f)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  mediaFilter === f ? 'bg-[#1c1c1c] border-[#333333] text-[#fafafa]' : 'border-[#262626] text-[#737373] hover:text-[#a3a3a3]'
                }`}>{f}</button>
            ))}
            <span className="text-xs text-[#737373] ml-3">Ordenar:</span>
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setSortMetric(opt.value)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  sortMetric === opt.value ? 'bg-[#1c1c1c] border-[#333333] text-[#fafafa]' : 'border-[#262626] text-[#737373] hover:text-[#a3a3a3]'
                }`}>{opt.label}</button>
            ))}
          </div>

          {top10.length === 0 ? (
            <p className="text-[#737373] text-sm py-4 text-center">Sem dados qualificados para esse filtro</p>
          ) : (
            <div>
              <p className="text-xs text-[#737373] mb-2">
                Top 10 criativos — {SORT_OPTIONS.find(o => o.value === sortMetric)?.label}
              </p>
              <DataTable data={top10} columns={columns} pageSize={10} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SegmentoClient({ ads }: { ads: ProcessedAd[] }) {
  const { productFilter } = useFilter();
  const [segmentFilter, setSegmentFilter] = useState<'Todos' | Segment>('Todos');

  const filtered = useMemo(() => {
    let result = productFilter === 'Todos' ? ads : ads.filter((a) => a.produto === productFilter);
    if (segmentFilter !== 'Todos') result = result.filter((a) => a.segmento === segmentFilter);
    return result;
  }, [ads, productFilter, segmentFilter]);

  const segmentsToShow = segmentFilter === 'Todos' ? SEGMENTS : [segmentFilter];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#fafafa]">Por Segmento de Público</h1>
          <p className="text-xs text-[#737373] mt-0.5">Análise de performance por audiência</p>
        </div>
        <div className="flex items-center gap-2">
          {(['Todos', ...SEGMENTS] as ('Todos' | Segment)[]).map((s) => (
            <button key={s} onClick={() => setSegmentFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                segmentFilter === s ? 'bg-[#1c1c1c] border-[#333333] text-[#fafafa]' : 'border-[#262626] text-[#737373] hover:text-[#a3a3a3]'
              }`}>
              {s === 'Todos' ? 'Todos' : SEGMENT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      {segmentsToShow.map((seg) => (
        <SegmentCard key={seg} segmento={seg} ads={filtered.filter((a) => a.segmento === seg)} />
      ))}
    </div>
  );
}
