'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ProcessedAd, Segment, MediaType, Product } from '@/lib/types';
import { useFilter } from '@/components/providers/FilterProvider';
import DataTable from '@/components/DataTable';
import { formatBRL, formatNumber, formatPercent } from '@/lib/formatters';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

const SEGMENTS: Segment[] = ['engaged', 'prospecting', 'existing'];
const SEGMENT_LABELS: Record<Segment, string> = {
  engaged: 'Engaged',
  prospecting: 'Prospecting',
  existing: 'Existing',
};

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color, background: bg }}>
      {text}
    </span>
  );
}

export default function CriativoClient({ ads }: { ads: ProcessedAd[] }) {
  const { productFilter } = useFilter();
  const [search, setSearch] = useState('');
  const [lpFilter, setLpFilter] = useState('');
  const [segFilter, setSegFilter] = useState<'Todos' | Segment>('Todos');
  const [mediaFilter, setMediaFilter] = useState<'Todos' | MediaType>('Todos');

  // Average CPA per segment for comparison arrows
  const avgCpaBySegment = useMemo(() => {
    const map: Record<string, { gasto: number; resultados: number }> = {};
    for (const ad of ads) {
      if (!map[ad.segmento]) map[ad.segmento] = { gasto: 0, resultados: 0 };
      map[ad.segmento].gasto += ad.gasto;
      map[ad.segmento].resultados += ad.resultados;
    }
    const result: Record<string, number> = {};
    for (const [seg, { gasto, resultados }] of Object.entries(map)) {
      result[seg] = resultados > 0 ? gasto / resultados : 0;
    }
    return result;
  }, [ads]);

  const allLps = useMemo(() => {
    const s = new Set(ads.map((a) => a.lp));
    return Array.from(s).sort();
  }, [ads]);

  const filtered = useMemo(() => {
    return ads.filter((a) => {
      if (productFilter !== 'Todos' && a.produto !== productFilter) return false;
      if (lpFilter && a.lp !== lpFilter) return false;
      if (segFilter !== 'Todos' && a.segmento !== segFilter) return false;
      if (mediaFilter !== 'Todos' && a.tipoMidia !== mediaFilter) return false;
      return true;
    });
  }, [ads, productFilter, lpFilter, segFilter, mediaFilter]);

  const columns = useMemo<ColumnDef<ProcessedAd>[]>(() => [
    {
      accessorKey: 'nomeAnuncio',
      header: 'Anúncio',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-[#fafafa] max-w-[220px] block truncate" title={getValue() as string}>
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'tipoMidia',
      header: 'Tipo',
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue() as MediaType;
        return (
          <Badge
            text={v}
            color={v === 'Vídeo' ? '#c4b5fd' : '#67e8f9'}
            bg={v === 'Vídeo' ? '#2e1065' : '#083344'}
          />
        );
      },
    },
    {
      accessorKey: 'produto',
      header: 'Produto',
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue() as Product;
        return (
          <Badge
            text={v === 'Laranja Moro' ? 'LM' : 'JJ'}
            color={v === 'Laranja Moro' ? '#f97316' : '#93c5fd'}
            bg={v === 'Laranja Moro' ? '#431407' : '#1e3a8a'}
          />
        );
      },
    },
    { accessorKey: 'lp', header: 'LP', enableSorting: false },
    {
      accessorKey: 'segmento',
      header: 'Segmento',
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue() as Segment;
        return <span className="text-[#a3a3a3] capitalize">{SEGMENT_LABELS[v]}</span>;
      },
    },
    {
      accessorKey: 'impressoes',
      header: 'Impressões',
      enableSorting: true,
      cell: ({ getValue }) => formatNumber(getValue() as number),
    },
    {
      accessorKey: 'cliques',
      header: 'Cliques',
      enableSorting: true,
      cell: ({ getValue }) => formatNumber(getValue() as number),
    },
    {
      accessorKey: 'ctr',
      header: 'CTR %',
      enableSorting: true,
      cell: ({ getValue }) => formatPercent(getValue() as number),
    },
    {
      accessorKey: 'resultados',
      header: 'Compras',
      enableSorting: true,
      cell: ({ getValue }) => formatNumber(getValue() as number),
    },
    {
      accessorKey: 'taxaConversao',
      header: 'Taxa Conv. %',
      enableSorting: true,
      cell: ({ getValue }) => formatPercent(getValue() as number),
    },
    {
      accessorKey: 'gasto',
      header: 'Gasto R$',
      enableSorting: true,
      cell: ({ getValue }) => formatBRL(getValue() as number),
    },
    {
      accessorKey: 'cpa',
      header: 'CPA R$',
      enableSorting: true,
      cell: ({ getValue, row }) => {
        const cpa = getValue() as number;
        const avgCpa = avgCpaBySegment[row.original.segmento] || 0;
        const better = cpa < avgCpa;
        return (
          <div className="flex items-center gap-1 font-semibold">
            <span className="text-[#fafafa]">{formatBRL(cpa)}</span>
            {avgCpa > 0 && (
              better
                ? <ArrowDown size={12} className="text-[#22c55e]" />
                : <ArrowUp size={12} className="text-[#ef4444]" />
            )}
          </div>
        );
      },
    },
  ], [avgCpaBySegment]);

  function handleExport() {
    const header = ['Nome do Anúncio', 'Tipo', 'Produto', 'LP', 'Segmento', 'Impressões', 'Cliques', 'CTR%', 'Compras', 'Taxa Conv%', 'Gasto', 'CPA'];
    const rows = filtered.map((a) => [
      a.nomeAnuncio,
      a.tipoMidia,
      a.produto,
      a.lp,
      a.segmento,
      a.impressoes,
      a.cliques,
      a.ctr.toFixed(2),
      a.resultados,
      a.taxaConversao.toFixed(2),
      a.gasto.toFixed(2),
      a.cpa.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'criativos-denavita.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-[#fafafa]">Por Criativo</h1>
        <p className="text-xs text-[#737373] mt-0.5">Tabela completa de anúncios qualificados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input
            type="text"
            placeholder="Buscar anúncio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-sm bg-[#141414] border border-[#262626] rounded-lg text-[#fafafa] placeholder-[#737373] focus:outline-none focus:border-[#333333] w-56"
          />
        </div>

        <select
          value={lpFilter}
          onChange={(e) => setLpFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-[#141414] border border-[#262626] rounded-lg text-[#a3a3a3] focus:outline-none focus:border-[#333333]"
        >
          <option value="">Todas as LPs</option>
          {allLps.map((lp) => <option key={lp} value={lp}>{lp}</option>)}
        </select>

        <select
          value={segFilter}
          onChange={(e) => setSegFilter(e.target.value as 'Todos' | Segment)}
          className="px-3 py-1.5 text-sm bg-[#141414] border border-[#262626] rounded-lg text-[#a3a3a3] focus:outline-none focus:border-[#333333]"
        >
          <option value="Todos">Todos os Segmentos</option>
          {SEGMENTS.map((s) => <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>)}
        </select>

        <select
          value={mediaFilter}
          onChange={(e) => setMediaFilter(e.target.value as 'Todos' | MediaType)}
          className="px-3 py-1.5 text-sm bg-[#141414] border border-[#262626] rounded-lg text-[#a3a3a3] focus:outline-none focus:border-[#333333]"
        >
          <option value="Todos">Vídeo + Imagem</option>
          <option value="Vídeo">Vídeo</option>
          <option value="Imagem">Imagem</option>
        </select>

        <span className="text-xs text-[#737373] ml-auto">{filtered.length} anúncios</span>
      </div>

      <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
        <DataTable
          data={filtered}
          columns={columns}
          pageSize={20}
          globalFilter={search}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
