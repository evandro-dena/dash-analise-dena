'use client';

import { useMemo } from 'react';
import type { ProcessedAd, Product } from '@/lib/types';
import { useFilter } from '@/components/providers/FilterProvider';
import KpiCard from '@/components/KpiCard';
import PieChart from '@/components/Charts/PieChart';
import { formatBRL, formatNumber, formatPercent } from '@/lib/formatters';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/DataTable';

interface LpRow {
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

const LP_ORDER = [
  'LP-1 /pages/laranja-moro',
  'LP-2 /pages/lm1',
  'LP-3 lm1.denavita.com.br',
  'LP-4 /products/laranja-moro',
  'LP-5 lm2.denavita.com.br',
  'LP-1 /pages/jejoom-denavita',
  'LP-2 jejoom.denavita.com.br',
  'LP-3 /pages/jejoom-v3',
  'LP-4 jejoom1.denavita.com.br',
];

export default function VisaoGeralClient({ ads }: { ads: ProcessedAd[] }) {
  const { productFilter } = useFilter();

  const filtered = useMemo(
    () => productFilter === 'Todos' ? ads : ads.filter((a) => a.produto === productFilter),
    [ads, productFilter],
  );

  const kpis = useMemo(() => {
    const gasto = filtered.reduce((s, a) => s + a.gasto, 0);
    const receita = filtered.reduce((s, a) => s + a.receita, 0);
    const resultados = filtered.reduce((s, a) => s + a.resultados, 0);
    const cliques = filtered.reduce((s, a) => s + a.cliques, 0);
    const viewsPagina = filtered.reduce((s, a) => s + a.viewsPagina, 0);
    return {
      gasto,
      receita,
      resultados,
      cpa: resultados > 0 ? gasto / resultados : 0,
      roas: gasto > 0 ? receita / gasto : 0,
      taxaConversao: cliques > 0 ? (resultados / cliques) * 100 : 0,
      viewsPagina,
    };
  }, [filtered]);

  const gastoPorProduto = useMemo(() => {
    const lm = filtered.filter((a) => a.produto === 'Laranja Moro').reduce((s, a) => s + a.gasto, 0);
    const jj = filtered.filter((a) => a.produto === 'Jejoom').reduce((s, a) => s + a.gasto, 0);
    return [
      { name: 'Laranja Moro', value: lm, color: '#f97316' },
      { name: 'Jejoom', value: jj, color: '#3b82f6' },
    ].filter((d) => d.value > 0);
  }, [filtered]);

  const gastoPorMidia = useMemo(() => {
    const video = filtered.filter((a) => a.tipoMidia === 'Vídeo').reduce((s, a) => s + a.gasto, 0);
    const img = filtered.filter((a) => a.tipoMidia === 'Imagem').reduce((s, a) => s + a.gasto, 0);
    return [
      { name: 'Vídeo', value: video, color: '#a855f7' },
      { name: 'Imagem', value: img, color: '#06b6d4' },
    ].filter((d) => d.value > 0);
  }, [filtered]);

  const lpRows = useMemo<LpRow[]>(() => {
    const map = new Map<string, LpRow>();
    for (const ad of filtered) {
      const existing = map.get(ad.lp);
      if (!existing) {
        map.set(ad.lp, {
          produto: ad.produto, lp: ad.lp, anuncios: 1,
          impressoes: ad.impressoes, cliques: ad.cliques,
          resultados: ad.resultados, gasto: ad.gasto,
          receita: ad.receita, viewsPagina: ad.viewsPagina,
          cpa: 0, roas: 0, taxaConversao: 0,
        });
      } else {
        existing.anuncios++;
        existing.impressoes += ad.impressoes;
        existing.cliques += ad.cliques;
        existing.resultados += ad.resultados;
        existing.gasto += ad.gasto;
        existing.receita += ad.receita;
        existing.viewsPagina += ad.viewsPagina;
      }
    }
    const rows = Array.from(map.values()).map((r) => ({
      ...r,
      cpa: r.resultados > 0 ? r.gasto / r.resultados : 0,
      roas: r.gasto > 0 ? r.receita / r.gasto : 0,
      taxaConversao: r.cliques > 0 ? (r.resultados / r.cliques) * 100 : 0,
    }));
    rows.sort((a, b) => LP_ORDER.indexOf(a.lp) - LP_ORDER.indexOf(b.lp));
    return rows;
  }, [filtered]);

  const columns = useMemo<ColumnDef<LpRow>[]>(() => [
    {
      accessorKey: 'produto',
      header: 'Produto',
      cell: ({ getValue }) => {
        const v = getValue() as Product;
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: v === 'Laranja Moro' ? '#431407' : '#1e3a8a', color: v === 'Laranja Moro' ? '#f97316' : '#93c5fd' }}>
            {v}
          </span>
        );
      },
    },
    { accessorKey: 'lp', header: 'LP' },
    { accessorKey: 'anuncios', header: 'Anúncios', enableSorting: true, cell: ({ getValue }) => formatNumber(getValue() as number) },
    { accessorKey: 'gasto', header: 'Gasto', enableSorting: true, cell: ({ getValue }) => formatBRL(getValue() as number) },
    { accessorKey: 'cliques', header: 'Cliques', enableSorting: true, cell: ({ getValue }) => formatNumber(getValue() as number) },
    { accessorKey: 'viewsPagina', header: 'Views Página', enableSorting: true, cell: ({ getValue }) => formatNumber(getValue() as number) },
    { accessorKey: 'cpa', header: 'CPA', enableSorting: true, cell: ({ getValue }) => <span className="font-semibold text-[#fafafa]">{formatBRL(getValue() as number)}</span> },
    { accessorKey: 'resultados', header: 'Compras', enableSorting: true, cell: ({ getValue }) => formatNumber(getValue() as number) },
    {
      accessorKey: 'roas', header: 'ROAS', enableSorting: true,
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return <span className={`font-semibold ${v >= 1 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{v.toFixed(2)}x</span>;
      },
    },
    { accessorKey: 'taxaConversao', header: 'Taxa Conv.', enableSorting: true, cell: ({ getValue }) => formatPercent(getValue() as number) },
    { accessorKey: 'receita', header: 'Receita', enableSorting: true, cell: ({ getValue }) => <span className="text-[#22c55e]">{formatBRL(getValue() as number)}</span> },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-[#fafafa]">Visão Geral</h1>
        <p className="text-xs text-[#737373] mt-0.5">Performance consolidada dos anúncios qualificados</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Gasto Total" value={formatBRL(kpis.gasto)} />
        <KpiCard label="Receita Total" value={formatBRL(kpis.receita)} accentColor="#22c55e" />
        <KpiCard label="Compras" value={formatNumber(kpis.resultados)} />
        <KpiCard label="CPA Médio" value={formatBRL(kpis.cpa)} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="ROAS Médio" value={`${kpis.roas.toFixed(2)}x`} accentColor={kpis.roas >= 1 ? '#22c55e' : '#ef4444'} />
        <KpiCard label="Taxa de Conversão" value={formatPercent(kpis.taxaConversao)} />
        <KpiCard label="Views de Página" value={formatNumber(kpis.viewsPagina)} />
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-4">Gasto por Produto</h2>
          <PieChart data={gastoPorProduto} formatter={formatBRL} />
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-4">Gasto por Tipo de Mídia</h2>
          <PieChart data={gastoPorMidia} formatter={formatBRL} />
        </div>
      </div>

      {/* LP summary table */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-4">Resumo por Landing Page</h2>
        {lpRows.length === 0 ? (
          <p className="text-[#737373] text-sm py-8 text-center">Sem dados qualificados para esse filtro</p>
        ) : (
          <DataTable data={lpRows} columns={columns} pageSize={10} />
        )}
      </div>
    </div>
  );
}
