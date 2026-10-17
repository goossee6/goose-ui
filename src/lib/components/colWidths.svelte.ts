/**
 * 列宽状态：权重归一化、像素增量换算、localStorage 持久化。
 *
 * 设计要点：表格用 `table-layout: fixed`，各列宽度以**相对权重**存储，
 * 渲染时换算成百分比（`weight / total * 100%`）。这样：
 *  - 列宽之和恒为 100%，容器怎么缩放都不会溢出，无需监听 resize；
 *  - 拖拽只改权重，不必维护「各列之和 = 容器宽」的等式。
 *
 * 为什么不存像素：实测 `<col style="width:200px">` 在 fixed 布局下，
 * 当各列之和小于表格宽度时浏览器会**等比放大**（200/140/80 → 285/200/114），
 * 像素值并非最终渲染值；百分比没有这个问题。
 */

/** 单列最小像素宽：再窄就连表头文字都放不下，且拖到 0 会让手柄抓不回来。 */
export const MIN_COL_PX = 56;

/** 默认权重。未配置 width 的列一律 1，视觉上均分。 */
export const DEFAULT_WEIGHT = 1;

/** localStorage 键前缀，与主题键（goose-ui-theme）保持同一命名风格。 */
const STORAGE_PREFIX = 'goose-ui:table-widths:';

/** 权重数组 → 百分比宽度字符串数组，供 `<col style="width:...">` 使用。 */
export function toPercents(weights: number[]): string[] {
	const total = weights.reduce((a, b) => a + (Number.isFinite(b) && b > 0 ? b : 0), 0);
	if (!(total > 0)) return weights.map(() => `${100 / Math.max(1, weights.length)}%`);
	return weights.map((w) => {
		const safe = Number.isFinite(w) && w > 0 ? w : 0;
		return `${((safe / total) * 100).toFixed(4)}%`;
	});
}

/**
 * 把一次拖拽的像素位移换算成新的权重数组，并从相邻列扣补。
 *
 * @param weights      当前权重
 * @param index        被拖拽的列下标
 * @param dxPx         本轮相对拖拽起点的像素增量（向右为正）
 * @param containerPx  表格容器当前像素宽，用于 px ↔ 权重换算
 * @param minPx        每列最小像素宽（默认 MIN_COL_PX）
 * @param maxPx        被拖拽列的最大像素宽（可选）
 * @param direction    'right' 表示手柄在该列右边缘（增大列 = 从右邻扣）；
 *                     'left' 表示手柄在左边缘（增大列 = 从左邻扣）
 * @returns 新权重数组；未发生有效变化时返回原数组
 */
export function resizeWeights(
	weights: number[],
	index: number,
	dxPx: number,
	containerPx: number,
	minPx = MIN_COL_PX,
	maxPx?: number,
	direction: 'right' | 'left' = 'right'
): number[] {
	if (index < 0 || index >= weights.length || !(containerPx > 0)) return weights;

	const neighbor = direction === 'right' ? index + 1 : index - 1;
	if (neighbor < 0 || neighbor >= weights.length) return weights;

	const total = weights.reduce((a, b) => a + (b > 0 ? b : 0), 0);
	if (!(total > 0)) return weights;

	// 1 像素对应多少权重
	const perPx = total / containerPx;

	const ownPx = (weights[index] / total) * containerPx;
	const neighborPx = (weights[neighbor] / total) * containerPx;

	const rawTarget = ownPx + (direction === 'right' ? dxPx : -dxPx);

	// 两侧都要守住最小宽度：自己不能小于 minPx，邻居也不能
	const upper = neighborPx - minPx; // 自己最多能长到多少
	const lower = minPx; // 自己最少要留多少
	const ceiling = maxPx != null ? Math.min(upper, maxPx) : upper;

	const target = Math.min(Math.max(rawTarget, lower), Math.max(lower, ceiling));
	const applied = target - ownPx; // 实际生效的像素增量（自身方向）

	if (Math.abs(applied) < 0.5) return weights;

	const next = [...weights];
	next[index] = weights[index] + applied * perPx;
	next[neighbor] = weights[neighbor] - applied * perPx;

	// 浮点误差兜底：权重必须为正
	if (!(next[index] > 0) || !(next[neighbor] > 0)) return weights;

	return next;
}

/** 读取已保存的列宽权重；不含该键、损坏或长度不符时返回 null。 */
export function loadWidths(key: string, expectedLength: number): number[] | null {
	if (typeof window === 'undefined' || !key) return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length !== expectedLength) return null;
		if (!parsed.every((v) => typeof v === 'number' && Number.isFinite(v) && v > 0)) return null;
		return parsed as number[];
	} catch {
		return null;
	}
}

/**
 * 配置指纹：把各列的默认权重拼成一个短字符串。
 *
 * 用途是让「列配置变了」时旧存档自动失效。否则使用者调整了 columns 里的
 * width，用户本地早先拖动留下的记录会一直覆盖新配置，改代码等于没改。
 * 用权重而不是列 id：仅改 width 正是需要失效的场景。
 */
export function weightsFingerprint(weights: number[]): string {
	return weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0)).join(',');
}

/** 读取列宽存档。存档的配置指纹与当前配置不一致时视为过期，返回 null。 */
export function loadWidthsVersioned(
	key: string,
	expectedLength: number,
	fingerprint: string
): number[] | null {
	if (typeof window === 'undefined' || !key) return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		// 兼容旧格式（裸数组）：视为过期，回落到配置默认值。
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
		if (parsed.fp !== fingerprint) return null;
		const weights = parsed.w;
		if (!Array.isArray(weights) || weights.length !== expectedLength) return null;
		if (!weights.every((v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0)) {
			return null;
		}
		return weights as number[];
	} catch {
		return null;
	}
}

/** 写入列宽权重。localStorage 不可用时静默忽略，仅内存生效。 */
export function saveWidths(key: string, weights: number[]): void {
	if (typeof window === 'undefined' || !key) return;
	try {
		window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(weights));
	} catch {
		/* localStorage 不可用（隐私模式 / 配额满）时仅内存生效 */
	}
}

/** 写入列宽权重，同时记录配置指纹。 */
export function saveWidthsVersioned(key: string, weights: number[], fingerprint: string): void {
	if (typeof window === 'undefined' || !key) return;
	try {
		window.localStorage.setItem(
			STORAGE_PREFIX + key,
			JSON.stringify({ fp: fingerprint, w: weights })
		);
	} catch {
		/* localStorage 不可用（隐私模式 / 配额满）时仅内存生效 */
	}
}

/** 清除某张表的列宽记录，下次加载回到默认均分。 */
export function clearWidths(key: string): void {
	if (typeof window === 'undefined' || !key) return;
	try {
		window.localStorage.removeItem(STORAGE_PREFIX + key);
	} catch {
		/* ignore */
	}
}

let autoKeySeq = 0;

/**
 * 生成自动持久化键。同一页面内每张表拿到不同的键；
 * 使用方最好显式传 persistKey，这样跨路由/重挂载也能对应上。
 */
export function nextAutoKey(): string {
	autoKeySeq += 1;
	return `auto-${autoKeySeq}`;
}
