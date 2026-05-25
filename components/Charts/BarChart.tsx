'use client';

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList,
} from 'recharts';

interface BarDataItem {
  name: string;
  [key: string]: string | number;
}

interface BarSeries {
  key: string;
  color: string;
  label?: string;
}

interface Props {
  data: BarDataItem[];
  series: BarSeries[];
  layout?: 'horizontal' | 'vertical';
  formatter?: (v: number) => string;
  height?: number;
  maxLabelLength?: number;
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export default function BarChart({
  data,
  series,
  layout = 'vertical',
  formatter,
  height = 320,
  maxLabelLength = 30,
}: Props) {
  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBar
        data={data}
        layout={layout}
        margin={{ top: 4, right: 16, bottom: 4, left: isVertical ? 180 : 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#262626"
          horizontal={!isVertical}
          vertical={isVertical}
        />
        {isVertical ? (
          <>
            <XAxis type="number" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => formatter ? formatter(v) : String(v)} />
            <YAxis
              type="category"
              dataKey="name"
              width={175}
              tick={{ fill: '#a3a3a3', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => truncate(v, maxLabelLength)}
            />
          </>
        ) : (
          <>
            <XAxis type="category" dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => truncate(v, 10)} />
            <YAxis type="number" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => formatter ? formatter(v) : String(v)} />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: '#1c1c1c',
            border: '1px solid #262626',
            borderRadius: 6,
            color: '#fafafa',
            fontSize: 12,
          }}
          formatter={(v, name) => [
            formatter ? formatter(v as number) : v,
            series.find((s) => s.key === name)?.label || name,
          ]}
          cursor={{ fill: '#1c1c1c' }}
        />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => {
              const s = series.find((s) => s.key === value);
              return <span style={{ color: '#a3a3a3', fontSize: 12 }}>{s?.label || value}</span>;
            }}
          />
        )}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[0, 3, 3, 0]} maxBarSize={24} />
        ))}
      </RechartsBar>
    </ResponsiveContainer>
  );
}
