export async function batch<T, R>(
  items: T[],
  fn: (batch: T[]) => Promise<R[]>,
  size: number = 10
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const batchResults = await fn(chunk);
    results.push(...batchResults);
  }
  return results;
}

export function group<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}
