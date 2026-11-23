/**
 * 段式输入的取值运算：区间判定、失焦规整、粘贴拆分。
 *
 * 从 `SegmentField.svelte` 提出来。这些函数管的是「哪个值算合法的第几段」——
 * 闰月天数、时 ≤ 23、`2026-11` 只填了年月、把 `20261123` 粘进四个格子……
 * 全是边界情况，靠点界面点不完；提成纯函数就能在 `node --test` 里逐条钉。
 *
 * 组件那边只剩 DOM 事件与焦点跳格。
 */
import { padTo } from './dateParts.ts';

export interface SegmentSpec {
	/** 每段最大位数 */
	widths: number[];
	/** 每段合法区间（含端点）；缺省按位数取 [0, 10^n - 1] */
	ranges?: ([number, number] | undefined)[];
	/** false = 不当作数字（自由文本段），不做区间与补零 */
	numeric?: boolean;
}

/** 按 widths 把值铺成定长数组：缺的段补空串，多出来的忽略 */
export function cellValues(widths: number[], value: string[]): string[] {
	const arr: string[] = [];
	for (let i = 0; i < widths.length; i++) arr.push(value[i] ?? '');
	return arr;
}

/** 第 i 段的合法区间；没指定就按位数取满，等于不加额外约束 */
export function rangeOf(spec: SegmentSpec, i: number): [number, number] {
	const r = spec.ranges?.[i];
	if (r) return r;
	return [0, 10 ** spec.widths[i] - 1];
}

/** 键入的这一段接不接受：空串永远接受（「还没填」不是错） */
export function isLegal(spec: SegmentSpec, i: number, ch: string): boolean {
	if (!ch || !spec.numeric) return true;
	const [lo, hi] = rangeOf(spec, i);
	const n = Number(ch);
	return n >= lo && n <= hi;
}

/**
 * 段已填但越界 —— 输入过程中只用来标红，不打断。
 * 立刻改掉的话，「1」想打「12」会在第一下就被拦下来。
 */
export function isOutOfRange(spec: SegmentSpec, i: number, ch: string): boolean {
	if (!spec.numeric || !ch) return false;
	const [lo, hi] = rangeOf(spec, i);
	const n = Number(ch);
	return n < lo || n > hi;
}

/**
 * 离开整个字段时的规整：位数不足左补零；越界不接受，回到进入字段时的值。
 *
 * `fallback` 是这次编辑开始前的快照 —— 回滚要回到「用户开始改之前」，
 * 而不是清空：清空等于把人敲了三格的结果一键抹掉，还看不出发生了什么。
 */
export function normalizeCells(
	spec: SegmentSpec,
	cells: string[],
	fallback: string[],
): { cells: string[]; changed: boolean } {
	if (!spec.numeric) return { cells, changed: false };
	const arr = cells.slice();
	let changed = false;
	for (let i = 0; i < arr.length; i++) {
		if (!arr[i]) continue;
		const next = isOutOfRange(spec, i, arr[i]) ? (fallback[i] ?? '') : padTo(Number(arr[i]), spec.widths[i]);
		if (next !== arr[i]) {
			arr[i] = next;
			changed = true;
		}
	}
	return { cells: arr, changed };
}

/**
 * 粘贴：从第 `from` 段起按位宽切块铺进去，越界的块保留原值。
 *
 * 逐段切而不是整串塞第一格 —— 从别处复制来的 `2026-11-23`、`20261123`、
 * `093000` 都该一次填满，而不是挤在第 1 段里被截断。
 *
 * 返回的 `next` 是粘完后该聚焦的段：按「填了几个整段的位宽」估算，
 * 落到最后一段就不再往后跳（否则焦点会跑到字段外）。
 */
export function pasteCells(
	spec: SegmentSpec,
	cells: string[],
	text: string,
	from: number,
	fallback: string[],
): { cells: string[]; next: number } {
	const clean = spec.numeric ? text.replace(/\D/g, '') : text;
	if (!clean) return { cells, next: from };

	const arr = cells.slice();
	let pos = 0;
	for (let k = from; k < spec.widths.length && pos < clean.length; k++) {
		const take = clean.slice(pos, pos + spec.widths[k]);
		arr[k] = isLegal(spec, k, take) ? take : (fallback[k] ?? '');
		pos += spec.widths[k];
	}
	const widest = Math.max(1, ...spec.widths);
	return { cells: arr, next: Math.min(spec.widths.length - 1, from + Math.ceil(pos / widest)) };
}
