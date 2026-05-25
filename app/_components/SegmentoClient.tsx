'use client';

import { useMemo, useState } from 'react';
import type { ProcessedAd, Segment, MediaType } from '@/lib/types';
import { useFilter } from '@/components/providers/FilterProvider';
import KpiCard from '@/components/KpiCard';
import BarChart from '@/components/Charts/BarChart';
import { formatBRL, formatNumber, formatPercent } from '@/lib/formatters';
import { ChevronDown, ChevronRight } from 'lucide-react';

const SEGMENTS: Segment[] = ['engaged', 'prospecting', 'existing'];
const SEGMENT_LABELS: Record<Segment, string> = {
  engaged: 'Engaged',
  prospecting: 'Prospecting',
  existing: 'Existing',
};

type MediaFilter = 'Todos' | MediaType;

function SegmentCard({ segmento, ads }: { segmento: Segment; ads: ProcessedAd[] }) {
  const [open, setOpen] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('Todos');

  const filtered = useMemo(
    () => (mediaFilter === 'Todos' ? ads : ads.filter((a) => a.tipoMidia === mediaFilter)),
    [ads, mediaFilter],
  );

  const kpis = useMemo(() => {
    const gasto = filtered.reduce((s, a) => s + a.gasto, 0);
    const resultados = filtered.reduce((s, a) => s + a.resultados, 0);
    const cliques = filtered.reduce((s, a) => s + a.cliques, 0);
    return {
      gasto,
      resultados,
      cpa: resultados > 0 ? gasto / resultados : 0,
      taxaConversao: cliques > 0 ? (resultados / cliques) * 100 : 0,
    };
  }, [filtered]);

  const top10 = useMemo(() => {
    const map = new Map<string, ProcessedAd & { _gasto: number; _resultados: number; _cliques: number }>();
    for (const ad of filtered) {
      const existing = map.get(ad.nomeAnuncio);
      if (!existing) {
        map.set(ad.nomeAnuncio, { ...ad, _gasto: ad.gasto, _resultados: ad.resultados, _cliques: ad.cliques });
      } else {
        existing._gasto += ad.gasto;
        existing._resultados += ad.resultados;
        existing._cliques += ad.cliques;
      }
    }
    return Array.from(map.values())
      .map((a) => ({
        name: a.nomeAnuncio,
        cpa: a._resultados > 0 ? a._gasto / a._resultados : 0,
      }))
      .sort((a, b) => a.cpa - b.cpa)
      .slice(0, 10);
  }, [filtered]);

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#1c1c1c] transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={16} className="text-[#737373]" /> : <ChevronRight size={16} className="text-[#737373]" />}
        <span className="font-semibold text-[#fafafa] capitalize">{SEGMENT_LABELS[segmento]}</span>
        <span className="ml-auto text-xs text-[#737373]">{ads.length} criativos</span>
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[#262626]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <KpiCard label="Gasto" value={formatBRL(kpis.gasto)} />
            <KpiCard label="Compras" value={formatNumber(kpis.resultados)} />
            <KpiCard label="CPA" value={formatBRL(kpis.cpa)} />
            <KpiCard label="Taxa Conv." value={formatPercent(kpis.taxaConversao)} />
          </div>

          <div className="flex items-center gap-2 mt-1">
            {(['Todos', 'Vídeo', 'Imagem'] as MediaFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setMediaFilter(f)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                  mediaFilter === f
                    ? 'bg-[#1c1c1c] border-[#333333] text-[#fafafa]'
                    : 'border-[#262626] text-[#737373] hover:text-[#a3a3a3]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {top10.length === 0 ? (
            <p className="text-[#737373] text-sm py-4 text-center">Sem dados qualificados para esse filtro</p>
          ) : (
            <div>
              <p className="text-xs text-[#737373] mb-2">Top 10 criativos por CPA (menor = melhor)</p>
              <BarChart
                data={top10}
                series={[{ key: 'cpa', color: '#f97316', label: 'CPA' }]}
                layout="vertical"
                formatter={formatBRL}
                height={Math.max(240, top10.length * 34)}
              />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#fafafa]">Por Segmento de Público</h1>
          <p className="text-xs text-[#737373] mt-0.5">Análise de performance por audiência</p>
        </div>
        <div className="flex items-center gap-2">
          {(['Todos', ...SEGMENTS] as ('Todos' | Segment)[]).map((s) => (
            <button
              key={s}
              onClick={() => setSegmentFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                segmentFilter === s
                  ? 'bg-[#1c1c1c] border-[#333333] text-[#fafafa]'
                  : 'border-[#262626] text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              {s === 'Todos' ? 'Todos' : SEGMENT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {segmentsToShow.map((seg) => {
        const segAds = filtered.filter((a) => a.segmento === seg);
        return <SegmentCard key={seg} segmento={seg} ads={segAds} />;
      })}
    </div>
  );
}
