'use client';

import { useMemo, useState } from 'react';
import type { ProcessedAd, Product, Segment } from '@/lib/types';
import { useFilter } from '@/components/providers/FilterProvider';
import KpiCard from '@/components/KpiCard';
import { formatBRL, formatNumber, formatPercent } from '@/lib/formatters';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';

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

const SEGMENTS: Segment[] = ['engaged', 'prospecting', 'existing'];
const SEGMENT_LABELS: Record<Segment, string> = {
  engaged: 'Público Engajado',
  prospecting: 'Novo Público',
  existing: 'Cliente Existente',
};

interface SegmentPerf {
  segmento: Segment;
  gasto: number;
  receita: number;
  resultados: number;
  cliques: number;
  viewsPagina: number;
  cpa: number;
  roas: number;
  taxaConversao: number;
}

function LpCard({ lp, produto, ads }: { lp: string; produto: Product; ads: ProcessedAd[] }) {
  const [expanded, setExpanded] = useState(false);

  const kpis = useMemo(() => {
    const gasto = ads.reduce((s, a) => s + a.gasto, 0);
    const receita = ads.reduce((s, a) => s + a.receita, 0);
    const resultados = ads.reduce((s, a) => s + a.resultados, 0);
    const cliques = ads.reduce((s, a) => s + a.cliques, 0);
    const viewsPagina = ads.reduce((s, a) => s + a.viewsPagina, 0);
    return {
      gasto, receita, resultados, viewsPagina,
      cpa: resultados > 0 ? gasto / resultados : 0,
      roas: gasto > 0 ? receita / gasto : 0,
      taxaConversao: cliques > 0 ? (resultados / cliques) * 100 : 0,
    };
  }, [ads]);

  // Per segment breakdown
  const bySegment = useMemo<SegmentPerf[]>(() => {
    const map = new Map<Segment, SegmentPerf>();
    for (const ad of ads) {
      const ex = map.get(ad.segmento);
      if (!ex) {
        map.set(ad.segmento, {
          segmento: ad.segmento, gasto: ad.gasto, receita: ad.receita,
          resultados: ad.resultados, cliques: ad.cliques, viewsPagina: ad.viewsPagina,
          cpa: 0, roas: 0, taxaConversao: 0,
        });
      } else {
        ex.gasto += ad.gasto; ex.receita += ad.receita;
        ex.resultados += ad.resultados; ex.cliques += ad.cliques;
        ex.viewsPagina += ad.viewsPagina;
      }
    }
    return SEGMENTS.filter((s) => map.has(s)).map((s) => {
      const e = map.get(s)!;
      return {
        ...e,
        cpa: e.resultados > 0 ? e.gasto / e.resultados : 0,
        roas: e.gasto > 0 ? e.receita / e.gasto : 0,
        taxaConversao: e.cliques > 0 ? (e.resultados / e.cliques) * 100 : 0,
      };
    });
  }, [ads]);

  // Best segment for this LP
  const bestSegment = useMemo(() => {
    return bySegment.filter((s) => s.resultados > 0).sort((a, b) => a.cpa - b.cpa)[0] || null;
  }, [bySegment]);

  const accentColor = produto === 'Laranja Moro' ? '#f97316' : '#3b82f6';
  const bgAccent = produto === 'Laranja Moro' ? '#431407' : '#1e3a8a';

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-[#262626]">
        <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: bgAccent, color: accentColor }}>
          {produto}
        </span>
        <span className="text-sm font-medium text-[#fafafa]">{lp}</span>
        {bestSegment && (
          <div className="flex items-center gap-1.5 ml-2">
            <Trophy size={12} className="text-[#eab308]" />
            <span className="text-xs text-[#737373]">Melhor público:</span>
            <span className="text-xs font-medium text-[#fafafa] capitalize">{SEGMENT_LABELS[bestSegment.segmento]}</span>
            <span className="text-xs text-[#737373]">CPA {formatBRL(bestSegment.cpa)} · ROAS {bestSegment.roas.toFixed(2)}x</span>
          </div>
        )}
        <span className="ml-auto text-xs text-[#737373]">{ads.length} criativos</span>
        <button onClick={() => setExpanded((e) => !e)} className="text-[#737373] hover:text-[#a3a3a3]">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* KPIs row */}
      <div className="px-5 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Gasto" value={formatBRL(kpis.gasto)} accentColor={accentColor} />
        <KpiCard label="Receita" value={formatBRL(kpis.receita)} accentColor="#22c55e" />
        <KpiCard label="ROAS" value={`${kpis.roas.toFixed(2)}x`} accentColor={kpis.roas >= 1 ? '#22c55e' : '#ef4444'} />
        <KpiCard label="Compras" value={formatNumber(kpis.resultados)} />
      </div>
      <div className="px-5 pb-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="CPA" value={formatBRL(kpis.cpa)} />
        <KpiCard label="Taxa Conv." value={formatPercent(kpis.taxaConversao)} />
        <KpiCard label="Views Página" value={formatNumber(kpis.viewsPagina)} />
      </div>

      {/* Expanded: per-segment breakdown */}
      {expanded && bySegment.length > 0 && (
        <div className="px-5 pb-5 border-t border-[#262626]">
          <p className="text-xs text-[#737373] mt-4 mb-3">Performance por segmento</p>
          <div className="overflow-x-auto rounded-lg border border-[#262626]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#0a0a0a]">
                  {['Segmento', 'Compras', 'CPA', 'ROAS', 'Taxa Conv.', 'Views Página', 'Gasto', 'Receita'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-medium uppercase tracking-wider text-[#737373]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bySegment.map((seg) => (
                  <tr key={seg.segmento} className="border-b border-[#1c1c1c] hover:bg-[#1c1c1c]">
                    <td className="px-3 py-2.5 text-[#fafafa] font-medium capitalize">{SEGMENT_LABELS[seg.segmento]}</td>
                    <td className="px-3 py-2.5 text-[#22c55e] font-semibold">{formatNumber(seg.resultados)}</td>
                    <td className="px-3 py-2.5 text-[#fafafa] font-semibold">{formatBRL(seg.cpa)}</td>
                    <td className={`px-3 py-2.5 font-semibold ${seg.roas >= 1 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {seg.roas.toFixed(2)}x
                    </td>
                    <td className="px-3 py-2.5 text-[#a3a3a3]">{formatPercent(seg.taxaConversao)}</td>
                    <td className="px-3 py-2.5 text-[#a3a3a3]">{formatNumber(seg.viewsPagina)}</td>
                    <td className="px-3 py-2.5 text-[#a3a3a3]">{formatBRL(seg.gasto)}</td>
                    <td className="px-3 py-2.5 text-[#a3a3a3]">{formatBRL(seg.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPageClient({ ads }: { ads: ProcessedAd[] }) {
  const { productFilter } = useFilter();

  const filtered = useMemo(
    () => productFilter === 'Todos' ? ads : ads.filter((a) => a.produto === productFilter),
    [ads, productFilter],
  );

  const lpGroups = useMemo(() => {
    const map = new Map<string, { produto: Product; ads: ProcessedAd[] }>();
    for (const ad of filtered) {
      const ex = map.get(ad.lp);
      if (!ex) map.set(ad.lp, { produto: ad.produto, ads: [ad] });
      else ex.ads.push(ad);
    }
    return LP_ORDER.filter((lp) => map.has(lp)).map((lp) => ({ lp, ...map.get(lp)! }));
  }, [filtered]);

  // Best LP per segment (across all LPs)
  const bestLpBySegment = useMemo(() => {
    const result: Partial<Record<Segment, { lp: string; produto: Product; cpa: number; roas: number }>> = {};
    for (const seg of SEGMENTS) {
      const segAds = filtered.filter((a) => a.segmento === seg);
      const lpMap = new Map<string, { lp: string; produto: Product; gasto: number; receita: number; resultados: number }>();
      for (const ad of segAds) {
        const ex = lpMap.get(ad.lp);
        if (!ex) lpMap.set(ad.lp, { lp: ad.lp, produto: ad.produto, gasto: ad.gasto, receita: ad.receita, resultados: ad.resultados });
        else { ex.gasto += ad.gasto; ex.receita += ad.receita; ex.resultados += ad.resultados; }
      }
      let best: typeof result[Segment] = undefined;
      for (const { lp, produto, gasto, receita, resultados } of lpMap.values()) {
        if (resultados === 0) continue;
        const cpa = gasto / resultados;
        const roas = gasto > 0 ? receita / gasto : 0;
        if (!best || cpa < best.cpa) best = { lp, produto, cpa, roas };
      }
      if (best) result[seg] = best;
    }
    return result;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-[#fafafa]">Por Landing Page</h1>
        <p className="text-xs text-[#737373] mt-0.5">Performance por destino de tráfego com melhor LP por público</p>
      </div>

      {/* Best LP per segment summary */}
      {Object.entries(bestLpBySegment).length > 0 && (
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-3">
            Melhor LP por Segmento
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {SEGMENTS.filter((s) => bestLpBySegment[s]).map((seg) => {
              const best = bestLpBySegment[seg]!;
              const color = best.produto === 'Laranja Moro' ? '#f97316' : '#3b82f6';
              const bg = best.produto === 'Laranja Moro' ? '#431407' : '#1e3a8a';
              return (
                <div key={seg} className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={13} className="text-[#eab308]" />
                    <span className="text-xs font-medium text-[#fafafa] capitalize">{SEGMENT_LABELS[seg]}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold block w-fit mb-2" style={{ color, background: bg }}>
                    {best.lp}
                  </span>
                  <div className="flex gap-4 text-xs text-[#737373]">
                    <span>CPA <span className="text-[#fafafa] font-semibold">{formatBRL(best.cpa)}</span></span>
                    <span>ROAS <span className={`font-semibold ${best.roas >= 1 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{best.roas.toFixed(2)}x</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lpGroups.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-[#737373] text-sm">
          Sem dados qualificados para esse filtro
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {lpGroups.map(({ lp, produto, ads: lpAds }) => (
            <LpCard key={lp} lp={lp} produto={produto} ads={lpAds} />
          ))}
        </div>
      )}
    </div>
  );
}
