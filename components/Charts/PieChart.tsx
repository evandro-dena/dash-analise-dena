'use client';

import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: PieDataItem[];
  formatter?: (v: number) => string;
}

export default function PieChart({ data, formatter }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsPie>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#1c1c1c',
            border: '1px solid #262626',
            borderRadius: 6,
            color: '#fafafa',
            fontSize: 13,
          }}
          formatter={(v) => (formatter ? formatter(v as number) : v)}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: '#a3a3a3', fontSize: 12 }}>{value}</span>
          )}
        />
      </RechartsPie>
    </ResponsiveContainer>
  );
}
