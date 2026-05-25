'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import type { ProductFilter } from '@/lib/types';

interface FilterContextValue {
  productFilter: ProductFilter;
  setProductFilter: (f: ProductFilter) => void;
}

const FilterContext = createContext<FilterContextValue>({
  productFilter: 'Todos',
  setProductFilter: () => {},
});

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [productFilter, setProductFilter] = useState<ProductFilter>('Todos');
  const value = useMemo(() => ({ productFilter, setProductFilter }), [productFilter]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilter() {
  return useContext(FilterContext);
}
