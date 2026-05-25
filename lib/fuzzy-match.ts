export function normalizeName(name: string | number | null | undefined): string {
  return String(name ?? '')
    .toLowerCase()
    .replace(/—\s*c[oó]pia/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function buildFuzzyMap<T>(
  rows: T[],
  keyFn: (row: T) => string,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    map.set(normalizeName(keyFn(row)), row);
  }
  return map;
}
