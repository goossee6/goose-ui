export type SortDir = "asc" | "desc";
export interface SortState { key: string; dir: SortDir; }
export type SortAccessor<T> = (row: T) => string | number | null | undefined;

export function toggleSort(state: SortState | null, key: string): SortState | null {
  if (state?.key === key) {
    if (state.dir === "asc") return { key, dir: "desc" };
    return null;
  }
  return { key, dir: "asc" };
}

function emptyValue(v: unknown): boolean { return v === null || v === undefined || v === ""; }

export function compareValues(a: unknown, b: unknown): number {
  const ae = emptyValue(a); const be = emptyValue(b);
  if (ae && be) return 0; if (ae) return 1; if (be) return -1;
  if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
  return String(a).localeCompare(String(b), "zh-Hans-CN");
}

export function sorted<T>(rows: T[], state: SortState | null, accessor: (row: T) => unknown): T[] {
  if (!state) return rows;
  const dir = state.dir === "asc" ? 1 : -1;
  return [...rows].sort((x, y) => {
    const c = compareValues(accessor(x), accessor(y));
    return c === 0 ? 0 : c * dir;
  });
}
