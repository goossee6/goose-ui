/**
 * 列宽：把「占比 + 可选的最小/最大约束」解成一组合法的百分比。
 *
 * 表格用 `table-layout: fixed`，各列宽度最终都要落成百分比，
 * 且**各列之和必须恒为 100%**，否则 fixed 布局会等比放大（见文末「为什么不存像素」）。
 *
 * 使用方可以按任一方式声明宽度，也可以混用：
 *  - 什么都不写            → 占 1 份
 *  - `2`                   → 占 2 份（相对比例，不是像素）
 *  - `'20%'`               → 要 20%（百分比）
 *  - `'200px'`             → 要 200px（换算成占容器的百分比）
 *  - `minWidth` / `maxWidth` → 约束，写法同上，`'minWidth: 120'` 按 120px 处理
 *
 * 约束优先于占比：先按占比分一遍，把越界的列夹到约束上，
 * 再把差额按占比分摊给还有余量的列，迭代到稳定为止。
 * 这样 `[{width: 3}, {width: 1, maxWidth: '15%'}]` 会得到 85% / 15%，
 * 而不是溢出后被浏览器等比缩成 75% / 25%。
 */

/** 默认权重。未配置 width 的列一律 1，视觉上均分。 */
export const DEFAULT_WEIGHT = 1;

/**
 * 像素约束换算成百分比时的参考宽度。
 *
 * 列宽与容器宽度相关，但求解发生在渲染前的纯函数里、拿不到真实宽度，
 * 所以像素写法（`'200px'` / `120`）按这个基准换算。需要精确控制时用百分比。
 */
export const REFERENCE_WIDTH_PX = 1000;

/** 一条宽度声明。`number` 是份数，`string` 是 `'20%'` / `'200px'` 这类带单位的值。 */
export type WidthSpec = number | string | null | undefined;

/** 已解析的宽度声明：`frac` 是份数，`pct` 是绝对百分比，两者有且只有一个有值。 */
export interface ParsedWidth {
  frac: number | null;
  pct: number | null;
}

/** 把一条宽度声明解析成「份数」或「百分比」。无法识别时返回 null。 */
export function parseWidth(v: WidthSpec, reference = REFERENCE_WIDTH_PX): ParsedWidth | null {
  if (v == null) return null;
  if (typeof v === 'number') {
    return Number.isFinite(v) && v > 0 ? { frac: v, pct: null } : null;
  }
  const s = v.trim();
  if (!s) return null;
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))\s*(%|px)?$/i.exec(s);
  if (!m) return null;
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = (m[2] ?? '').toLowerCase();
  if (unit === '%') return { frac: null, pct: n };
  // 纯数字字符串按份数处理，带 px 的按参考宽度换算成百分比
  if (unit === 'px') return { frac: null, pct: (n / (reference > 0 ? reference : 1)) * 100 };
  return { frac: n, pct: null };
}

/** 解析一条约束（min/max）。纯数字按「份数」理解没有意义，故一律当像素处理。 */
export function parseBound(v: WidthSpec, reference = REFERENCE_WIDTH_PX): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : null;
  const s = v.trim();
  if (!s) return null;
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))\s*(%|px)?$/i.exec(s);
  if (!m) return null;
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = (m[2] ?? '').toLowerCase();
  if (unit === '%') return n;
  // 无单位和 px 都按像素 → 换算成百分比
  return (n / (reference > 0 ? reference : 1)) * 100;
}

export interface WidthInput {
  /** 列宽声明 */
  width?: WidthSpec;
  /** 最小宽度：百分比或像素 */
  minWidth?: WidthSpec;
  /** 最大宽度：百分比或像素 */
  maxWidth?: WidthSpec;
}

/** 求解结果：每列的百分比（总和恒为 100）。 */
export function resolvePercents(cols: WidthInput[], reference = REFERENCE_WIDTH_PX): number[] {
  const n = cols.length;
  if (n === 0) return [];

  const fracs: number[] = [];
  const wants: (number | null)[] = []; // 显式声明的绝对百分比
  const mins: (number | null)[] = [];
  const maxs: (number | null)[] = [];

  for (const c of cols) {
    const w = parseWidth(c.width, reference);
    fracs.push(w?.frac ?? (w?.pct != null ? 0 : DEFAULT_WEIGHT));
    wants.push(w?.pct ?? null);
    mins.push(parseBound(c.minWidth, reference));
    maxs.push(parseBound(c.maxWidth, reference));
  }

  // 1. 先算一次「名义占比」：显式给了百分比的按百分比，否则按份数分摊剩余
  const explicitSum = wants.reduce<number>((a, b) => a + (b ?? 0), 0);
  const fracSum = fracs.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, 100 - explicitSum);

  let out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    out[i] = wants[i] ?? (fracSum > 0 ? (fracs[i] / fracSum) * remaining : remaining / n);
  }

  // 2. 迭代把越界列夹到约束上，差额分摊给还有余量的列
  const clamped = new Array<boolean>(n).fill(false);
  for (let iter = 0; iter < 8; iter++) {
    let delta = 0;
    let changed = false;

    for (let i = 0; i < n; i++) {
      if (clamped[i]) continue;
      const lo = mins[i];
      const hi = maxs[i];
      const v = out[i];
      let target = v;
      if (lo != null && v < lo) target = lo;
      else if (hi != null && v > hi) target = hi;
      if (target !== v) {
        delta += target - v;
        out[i] = target;
        clamped[i] = true;
        changed = true;
      }
    }
    if (!changed) break;

    // 把差额按「未夹列」的当前占比分摊；没有可分摊的列就到此为止
    const free = [];
    for (let i = 0; i < n; i++) if (!clamped[i]) free.push(i);
    if (free.length === 0) break;

    const freeSum = free.reduce((a, i) => a + out[i], 0);
    for (const i of free) {
      const share = freeSum > 0 ? out[i] / freeSum : 1 / free.length;
      out[i] = Math.max(0, out[i] - delta * share);
    }
  }

  // 3. 归一化，杜绝浮点误差导致总和不是 100
  const total = out.reduce((a, b) => a + (b > 0 ? b : 0), 0);
  if (total > 0) out = out.map((v) => (v > 0 ? (v / total) * 100 : 0));

  return out;
}

/** 百分比数组 → `<col style="width:...">` 用的字符串数组。 */
export function toPercents(pcts: number[]): string[] {
  return pcts.map((v) => `${(Number.isFinite(v) && v > 0 ? v : 0).toFixed(4)}%`);
}

/*
 * 为什么不存像素：实测 `<col style="width:200px">` 在 fixed 布局下，
 * 当各列之和小于表格宽度时浏览器会**等比放大**（200/140/80 → 285/200/114），
 * 像素值并非最终渲染值；百分比没有这个问题。
 */
