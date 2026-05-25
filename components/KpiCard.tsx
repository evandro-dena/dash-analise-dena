interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
}

export default function KpiCard({ label, value, sub, accentColor }: KpiCardProps) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg p-6 flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-widest text-[#737373]">
        {label}
      </span>
      <span
        className="text-[28px] font-semibold leading-tight"
        style={{ color: accentColor || '#fafafa' }}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-[#737373]">{sub}</span>}
    </div>
  );
}
