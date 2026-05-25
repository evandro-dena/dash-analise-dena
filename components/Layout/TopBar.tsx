'use client';

import { useFilter } from '@/components/providers/FilterProvider';
import type { ProductFilter } from '@/lib/types';

const FILTERS: ProductFilter[] = ['Todos', 'Laranja Moro', 'Jejoom'];

export default function TopBar() {
  const { productFilter, setProductFilter } = useFilter();

  return (
    <header className="h-14 border-b border-[#262626] flex items-center px-6 gap-6 shrink-0">
      <div className="flex items-center gap-3 mr-auto">
        <span className="font-semibold text-[#fafafa] text-base">Denavita Ads</span>
        <span className="text-xs text-[#737373]">01/jan/2026 — 25/mai/2026</span>
      </div>
      <div className="flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setProductFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              productFilter === f
                ? f === 'Laranja Moro'
                  ? 'bg-[#f97316] text-white'
                  : f === 'Jejoom'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#1c1c1c] text-[#fafafa]'
                : 'text-[#737373] hover:text-[#a3a3a3] hover:bg-[#141414]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </header>
  );
}
