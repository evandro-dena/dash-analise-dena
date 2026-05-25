'use client';

import { useMemo, useState } from 'react';
import type { ProcessedAd, Product } from '@/lib/types';
import { useFilter } from '@/components/providers/FilterProvider';
import KpiCard from '@/components/KpiCard';
import BarChart from '@/components/Charts/BarChart';
import { formatBRL, formatNumber, formatPercent } from '@/lib/formatters';
import { ChevronDown, ChevronRight } from 'lucide-react';

const LP_ORDER = [
  'LP-1 /pages/laranja-moro',
  'LP-2 /pages/lm1',
  'LP-3 lm1.denavita.com.br',
  'LP-1 /pages/jejoom-denavita',
  'LP-2 jejoom.denavita.com.br',
  'LP-3 /pages/jejoom-v3',
];

function LpCard({ lp, produto, ads }: { lp: string; produto: Product; ads: ProcessedAd[] }) {
  const [expanded, setExpanded] = useState(false);

  const kpis = useMemo(() => {
    const gasto = ads.reduce((s, a) => s + a.gasto, 0);
    const resultados = ads.reduce((s, a) => s + a.resultados, 0);
    const cliques = ads.reduce((s, a) => s + a.cliques, 0);
    return {
      gasto,
      resultados,
      cpa: resultados > 0 ? gasto / resultados : 0,
      taxaConversao: cliques > 0 ? (resultados / cliques) * 100 : 0,
    };
  }, [ads]);

  const top5 = useMemo(() => {
    const map = new Map<string, { name: string; gasto: number; resultados: number }>();
    for (const ad of ads) {
      const ex = map.get(ad.nomeAnuncio);
      if (!ex) map.set(ad.nomeAnuncio, { name: ad.nomeAnuncio, gasto: ad.gasto, resultados: ad.resultados });
      else { ex.gasto += ad.gasto; ex.resultados += ad.resultados; }
    }
    return Array.from(map.values())
      .map((a) => ({ name: a.name, cpa: a.resultados > 0 ? a.gasto / a.resultados : 0 }))
      .sort((a, b) => a.cpa - b.cpa)
      .slice(0, 5);
  }, [ads]);

  const accentColor = produto === 'Laranja Moro' ? '#f97316' : '#3b82f6';
  const bgAccent = produto === 'Laranja Moro' ? '#431407' : '#1e3a8a';

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-[#262626]">
        <div
          className="px-2 py-0.5 rounded text-xs font-semibold"
          style={{ background: bgAccent, color: accentColor }}
        >
          {produto}
        </div>
        <span className="text-sm font-medium text-[#fafafa]">{lp}</span>
        <span className="ml-auto text-xs text-[#737373]">{ads.length} criativos</span>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-[#737373] hover:text-[#a3a3a3]"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="px-5 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Gasto" value={formatBRL(kpis.gasto)} accentColor={accentColor} />
        <KpiCard label="Compras" value={formatNumber(kpis.resultados)} />
        <KpiCard label="CPA" value={formatBRL(kpis.cpa)} />
        <KpiCard label="Taxa Conv." value={formatPercent(kpis.taxaConversao)} />
      </div>

      {expanded && top5.length > 0 && (
        <div className="px-5 pb-5 border-t border-[#262626]">
          <p className="text-xs text-[#737373] mb-2 mt-4">Top 5 criativos por CPA</p>
          <BarChart
            data={top5}
            series={[{ key: 'cpa', color: accentColor, label: 'CPA' }]}
            layout="vertical"
            formatter={formatBRL}
            height={Math.max(180, top5.length * 36)}
          />
        </div>
      )}
    </div>
  );
}

export default function LandingPageClient({ ads }: { ads: ProcessedAd[] }) {
  const { productFilter } = useFilter();

  const filtered = useMemo(
    () => (productFilter === 'Todos' ? ads : ads.filter((a) => a.produto === productFilter)),
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-[#fafafa]">Por Landing Page</h1>
        <p className="text-xs text-[#737373] mt-0.5">Performance detalhada por destino de tráfego</p>
      </div>

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
