export const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatNumber = (v: number) => v.toLocaleString('pt-BR');

export const formatPercent = (v: number, decimals = 2) =>
  `${v.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;

export const formatCompact = (v: number) =>
  v.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
