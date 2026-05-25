'use client';

import { useMemo } from 'react';
import type { ProcessedAd, Segment, Product } from '@/lib/types';
import { useFilter } from '@/components/providers/FilterProvider';
import BarChart from '@/components/Charts/BarChart';
import Heatmap from '@/components/Charts/Heatmap';
import { formatBRL, formatPercent } from '@/lib/formatters';

const SEGMENTS: Segment[] = ['engaged', 'prospecting', 'existing'];
const SEGMENT_LABELS: Record<Segment, string> = {
  engaged: 'Engaged',
  prospecting: 'Prospecting',
  existing: 'Existing',
};

const LM_LPS = ['LP-1 /pages/laranja-moro', 'LP-2 /pages/lm1', 'LP-3 lm1.denavita.com.br'];
const JJ_LPS = ['LP-1 /pages/jejoom-denavita', 'LP-2 jejoom.denavita.com.br', 'LP-3 /pages/jejoom-v3'];

type AggKey = `${Segment}_${'Vídeo' | 'Imagem'}`;
interface AggEntry { gasto: number; resultados: number; cliques: number }

export default function ComparativoClient({ ads }: { ads: ProcessedAd[] }) {
  const { productFilter } = useFilter();

  const filtered = useMemo(
    () => (productFilter === 'Todos' ? ads : ads.filter((a) => a.produto === productFilter)),
    [ads, productFilter],
  );

  // Video vs Image by segment
  const videoVsImagem = useMemo(() => {
    const agg: Partial<Record<AggKey, AggEntry>> = {};
    for (const ad of filtered) {
      const key = `${ad.segmento}_${ad.tipoMidia}` as AggKey;
      if (!agg[key]) agg[key] = { gasto: 0, resultados: 0, cliques: 0 };
      agg[key]!.gasto += ad.gasto;
      agg[key]!.resultados += ad.resultados;
      agg[key]!.cliques += ad.cliques;
    }

    return SEGMENTS.map((seg) => {
      const v = agg[`${seg}_Vídeo`];
      const i = agg[`${seg}_Imagem`];
      return {
        name: SEGMENT_LABELS[seg],
        'CPA Vídeo': v && v.resultados > 0 ? v.gasto / v.resultados : 0,
        'CPA Imagem': i && i.resultados > 0 ? i.gasto / i.resultados : 0,
        'Conv. Vídeo': v && v.cliques > 0 ? (v.resultados / v.cliques) * 100 : 0,
        'Conv. Imagem': i && i.cliques > 0 ? (i.resultados / i.cliques) * 100 : 0,
      };
    });
  }, [filtered]);

  // Heatmap: LP x Segment
  function buildHeatmap(lps: string[], product: Product) {
    const agg = new Map<string, { gasto: number; resultados: number }>();
    const productAds = filtered.filter((a) => a.produto === product);
    for (const ad of productAds) {
      const key = `${ad.lp}||${ad.segmento}`;
      const ex = agg.get(key);
      if (!ex) agg.set(key, { gasto: ad.gasto, resultados: ad.resultados });
      else { ex.gasto += ad.gasto; ex.resultados += ad.resultados; }
    }
    const cells = [];
    for (const lp of lps) {
      for (const seg of SEGMENTS) {
        const entry = agg.get(`${lp}||${seg}`);
        cells.push({
          row: lp,
          col: SEGMENT_LABELS[seg],
          value: entry && entry.resultados > 0 ? entry.gasto / entry.resultados : null,
        });
      }
    }
    return cells;
  }

  const lmHeatmap = useMemo(() => buildHeatmap(LM_LPS, 'Laranja Moro'), [filtered]);
  const jjHeatmap = useMemo(() => buildHeatmap(JJ_LPS, 'Jejoom'), [filtered]);

  const heatmapCols = SEGMENTS.map((s) => SEGMENT_LABELS[s]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-[#fafafa]">Comparativo</h1>
        <p className="text-xs text-[#737373] mt-0.5">Vídeo vs Imagem e matriz LP × Segmento</p>
      </div>

      {/* CPA comparison */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-4">
          CPA por Segmento — Vídeo vs Imagem
        </h2>
        <BarChart
          data={videoVsImagem}
          series={[
            { key: 'CPA Vídeo', color: '#a855f7', label: 'Vídeo' },
            { key: 'CPA Imagem', color: '#06b6d4', label: 'Imagem' },
          ]}
          layout="horizontal"
          formatter={formatBRL}
          height={280}
        />
      </div>

      {/* Taxa Conversao comparison */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-4">
          Taxa de Conversão — Vídeo vs Imagem
        </h2>
        <BarChart
          data={videoVsImagem}
          series={[
            { key: 'Conv. Vídeo', color: '#a855f7', label: 'Vídeo' },
            { key: 'Conv. Imagem', color: '#06b6d4', label: 'Imagem' },
          ]}
          layout="horizontal"
          formatter={(v) => formatPercent(v)}
          height={280}
        />
      </div>

      {/* Heatmaps */}
      {(productFilter === 'Todos' || productFilter === 'Laranja Moro') && (
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-4">
            Heatmap CPA — Laranja Moro (LP × Segmento)
          </h2>
          <Heatmap
            cells={lmHeatmap}
            rows={LM_LPS}
            cols={heatmapCols}
          />
        </div>
      )}
      {(productFilter === 'Todos' || productFilter === 'Jejoom') && (
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-4">
            Heatmap CPA — Jejoom (LP × Segmento)
          </h2>
          <Heatmap
            cells={jjHeatmap}
            rows={JJ_LPS}
            cols={heatmapCols}
          />
        </div>
      )}
    </div>
  );
}
