'use client';

import { formatBRL } from '@/lib/formatters';

interface HeatmapCell {
  row: string;
  col: string;
  value: number | null;
}

interface Props {
  cells: HeatmapCell[];
  rows: string[];
  cols: string[];
  title?: string;
}

function interpolateColor(normalized: number): string {
  // 0 = green (#22c55e), 1 = red (#ef4444)
  const r = Math.round(34 + (239 - 34) * normalized);
  const g = Math.round(197 + (68 - 197) * normalized);
  const b = Math.round(94 + (68 - 94) * normalized);
  return `rgb(${r},${g},${b})`;
}

export default function Heatmap({ cells, rows, cols, title }: Props) {
  const values = cells.filter((c) => c.value !== null).map((c) => c.value as number);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const range = max - min || 1;

  const lookup = new Map<string, number | null>();
  for (const c of cells) {
    lookup.set(`${c.row}||${c.col}`, c.value);
  }

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-[#fafafa] mb-3">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[#737373] font-medium p-2 w-40">LP</th>
              {cols.map((col) => (
                <th key={col} className="text-center text-[#737373] font-medium p-2 capitalize">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="text-[#a3a3a3] p-2 font-medium">{row}</td>
                {cols.map((col) => {
                  const val = lookup.get(`${row}||${col}`);
                  const normalized = val != null ? (val - min) / range : 0;
                  const bg = val != null ? interpolateColor(normalized) : 'transparent';
                  return (
                    <td
                      key={col}
                      className="text-center p-2 rounded"
                      style={{
                        background: val != null ? bg : '#141414',
                        color: val != null ? '#0a0a0a' : '#737373',
                        fontWeight: val != null ? 600 : 400,
                      }}
                    >
                      {val != null ? formatBRL(val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
