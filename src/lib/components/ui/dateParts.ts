/**
 * 日期 / 时间「字符串零件」的公共工具。
 *
 * 为什么集中成一处：补零、按位置拆拼、档位索引这三件事原先散在 Calendar / Countdown /
 * Time / TimePicker / SegmentField / DateTimeRangePicker / datetimeRange 七处，而且同一件事
 * 有两三种写法 —— 有的空段补 `00`、有的保留空段、有的 `findIndex` 找不到就回 0。
 * 结果「键入中间态」和「已提交值」两种语义混在一起，改一个组件就会牵出另一个的回归
 * （`['', '07', '00']` 被拼成 `07:00` 那次就是这么来的）。
 *
 * 这里把两种语义**分开命名**，调用方必须显式选一种：
 * - `joinTrimmed()`：键入中间态用，保留空段位置，只去掉尾部连续空段
 * - `normalizeParts()`：整组赋值用，每段补零、空段按 `00`
 */

/** 补零到指定位数；空串原样返回（键入中「这一段还没填」不能被写成 `00`） */
export function padTo(v: number | string, width: number): string {
	const s = String(v);
	return s ? s.padStart(width, '0') : '';
}

/** 两位补零，最常用的那个 */
export function pad2(v: number | string): string {
	return padTo(v, 2);
}

/**
 * 列表里最后一个「数值 ≤ v」的档位下标；比首项还小就取 0。
 * 「现在」这类整组赋值必须落在步长网格上，否则滚轮会停在不存在的档位。
 */
export function indexFloor(list: string[], v: string): number {
	const n = Number(v);
	if (!v || !Number.isFinite(n)) return 0;
	let k = 0;
	for (let i = 0; i < list.length; i++) if (Number(list[i]) <= n) k = i;
	return k;
}

/**
 * 数值上最近的档位下标。网格外的值（外部传入、手敲）就近停靠，
 * 而不是一律弹回 0 —— 那样滚轮会和输入框显示的数字互相矛盾。
 * 按数值比较，所以 `3` 能找到 `03`。
 */
export function indexNearest(list: string[], v: string): number {
	if (!v || !Number.isFinite(Number(v))) return 0;
	const n = Number(v);
	let best = 0;
	let gap = Infinity;
	for (let i = 0; i < list.length; i++) {
		const d = Math.abs(Number(list[i]) - n);
		if (d < gap) {
			gap = d;
			best = i;
		}
	}
	return best;
}

/**
 * 键入中间态用：按位置拼，空段保留（`['', '07', '00']` → `:07:00`），
 * 只去掉尾部连续空段（`['12', '30', '']` → `12:30`）。
 */
export function joinTrimmed(parts: string[], sep = ':'): string {
	let last = parts.length - 1;
	while (last > 0 && !parts[last]) last--;
	return parts.slice(0, last + 1).join(sep);
}

/**
 * `joinTrimmed` 的逆运算：切成**固定段数**，缺的补空串。
 *
 * 段式输入框按位置对齐，段数由字段配置决定（日期 3 段、不含秒的时间 2 段），
 * 不能跟着分隔符实际出现几次走 —— 否则 `12` 只会得到一段，第二格就没了值。
 * 反过来多出来的段要丢掉（`2026-11-23-09` 这种误粘贴不该撑出第四格）。
 */
export function splitFixed(v: string, sep = ':', n = 3): string[] {
	const parts = v.split(sep);
	const out: string[] = [];
	for (let i = 0; i < n; i++) out.push(parts[i] ?? '');
	return out;
}

/** 整组赋值用：每段补零，空段按 `00`（`['9', '', '5']` → `09:00:05`） */
export function normalizeParts(parts: string[], width = 2): string[] {
	return parts.map((x) => (x ? padTo(x, width) : '0'.repeat(width)));
}

/** `9:5` → `09:05:00`；空串仍给 `00:00:00`（时间浮层要一个可滚的完整值） */
export function normalizeTime(v: string): string {
	const parts = v.split(':');
	while (parts.length < 3) parts.push('');
	return normalizeParts(parts).join(':');
}

/**
 * 时 / 分 / 秒三列的档位。滚轮、`now()` 对齐、外部值就近停靠都从这里取，
 * 免得「列里有哪些值」在两处各算一遍（步长改了只有一处会跟上）。
 * 小时列按 `% 24` 回绕，分秒列夹在 60 以内（`Math.floor(60 / step)` 档）。
 */
export function timeColumns(steps: [number, number, number] = [1, 1, 1], seconds = true): string[][] {
	const stepAt = (i: number) => {
		const v = steps[i];
		return Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1;
	};
	const h = stepAt(0);
	const m = stepAt(1);
	const s = stepAt(2);
	const out = [
		Array.from({ length: Math.ceil(24 / h) }, (_, i) => pad2((i * h) % 24)),
		Array.from({ length: Math.min(60, Math.floor(60 / m)) }, (_, i) => pad2(i * m)),
	];
	if (seconds) out.push(Array.from({ length: Math.min(60, Math.floor(60 / s)) }, (_, i) => pad2(i * s)));
	return out;
}
